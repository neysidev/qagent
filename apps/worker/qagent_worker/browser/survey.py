"""Pre-planning survey: what the site really offers, read from the start page and a few key pages (no LLM)."""

import asyncio
import re
from urllib.parse import urldefrag, urljoin, urlsplit

from playwright.async_api import Page

MAX_PAGES = 4
MAX_CHARS = 7000
_SKIP = re.compile(r"\.(pdf|zip|png|jpe?g|webp|svg|mp4|xml)$|logout|signout|sign-out|خروج", re.I)

_INVENTORY_JS = r"""
() => {
  const clip = (s, n) => (s || '').replace(/\s+/g, ' ').trim().slice(0, n);
  const vis = (el) => { const r = el.getBoundingClientRect(), st = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && st.display !== 'none'; };
  const nameOf = (el) => {
    const byId = el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    return clip(el.getAttribute('aria-label') || (el.labels && el.labels[0] && el.labels[0].innerText) ||
      (byId && byId.innerText) || el.getAttribute('placeholder') || el.getAttribute('title') || el.innerText ||
      el.value || el.getAttribute('name') || el.id || '', 60);
  };
  const uniq = (a) => [...new Set(a.filter(Boolean))];
  const headings = uniq([...document.querySelectorAll('h1,h2,h3')].filter(vis).map((e) => clip(e.innerText, 80))).slice(0, 20);
  const links = [...document.querySelectorAll('a[href]')].filter(vis).map((a) => ({
    text: nameOf(a), href: a.href, nav: !!a.closest('nav,header,footer,[role=navigation]'),
  })).slice(0, 150);
  const controls = uniq([...document.querySelectorAll('button,[role=button],[role=switch],[role=tab],[role=checkbox],summary,select')]
    .filter(vis).map((e) => `${e.getAttribute('role') || e.tagName.toLowerCase()} "${nameOf(e)}"`)).slice(0, 50);
  const forms = [...document.querySelectorAll('form')].filter(vis).map((f) => {
    const fields = uniq([...f.querySelectorAll('input:not([type=hidden]),textarea,select')].map((i) => `${i.type || i.tagName.toLowerCase()} "${nameOf(i)}"`));
    const submit = f.querySelector('button[type=submit],input[type=submit],button:not([type])');
    return `fields: ${fields.join(', ')}${submit ? `; submit "${nameOf(submit)}"` : ''}`;
  }).slice(0, 8);
  const loose = uniq([...document.querySelectorAll('input:not([type=hidden]),textarea')].filter((i) => vis(i) && !i.form)
    .map((i) => `${i.type || 'textarea'} "${nameOf(i)}"`)).slice(0, 10);
  return { title: document.title, headings, links, controls, forms, loose, text: clip(document.body ? document.body.innerText : '', 600) };
}
"""


async def _inventory(page: Page) -> dict:
    try:  # reveal lazy content below the fold, then come back
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await page.wait_for_timeout(300)
        await page.evaluate("window.scrollTo(0, 0)")
    except Exception:
        pass
    return await page.evaluate(_INVENTORY_JS)


def _render(path: str, inv: dict, origin: str) -> str:
    nav = [f'"{l["text"]}" -> {urlsplit(l["href"]).path or "/"}' for l in inv["links"] if l["text"] and l["href"].startswith(origin)]
    lines = [f"PAGE {path} (title: {inv['title']!r})"]
    for label, items in (
        ("Headings", inv["headings"]),
        ("Links", list(dict.fromkeys(nav))[:40]),
        ("Controls", inv["controls"]),
        ("Standalone inputs", inv["loose"]),
        ("Forms", inv["forms"]),
    ):
        if items:
            lines.append(f"{label}: " + " | ".join(items))
    return "\n".join(lines)


def _candidates(inv: dict, origin: str, current: str, goal: str) -> list[str]:
    """Same-site pages worth a look: ones matching the goal's words first, then navigation links."""
    words = [w for w in re.split(r"\W+", goal.lower()) if len(w) >= 3]
    scored: dict[str, int] = {}
    for l in inv["links"]:
        url = urldefrag(urljoin(current, l["href"]))[0]
        if not url.startswith(origin) or url.rstrip("/") == current.rstrip("/") or _SKIP.search(url) or url in scored:
            continue
        hay = f'{l["text"]} {urlsplit(url).path}'.lower()
        scored[url] = 2 * sum(w in hay for w in words) + (1 if l["nav"] else 0)
    return [u for u, s in sorted(scored.items(), key=lambda kv: -kv[1]) if s > 0][: MAX_PAGES - 1]


async def survey(page: Page, goal: str) -> str:
    """Text inventory of the start page (already loaded) plus a few linked pages. Best effort: failures just shorten it."""
    start = page.url
    origin = "{0.scheme}://{0.netloc}".format(urlsplit(start))
    inv = await _inventory(page)
    parts = [_render(urlsplit(start).path or "/", inv, origin)]
    try:
        async with asyncio.timeout(40):
            for url in _candidates(inv, origin, start, goal):
                try:
                    await page.goto(url, wait_until="domcontentloaded", timeout=10_000)
                    await page.wait_for_timeout(500)
                    parts.append(_render(urlsplit(page.url).path or "/", await _inventory(page), origin))
                except Exception:
                    continue
    except TimeoutError:
        pass
    return "\n\n".join(parts)[:MAX_CHARS]
