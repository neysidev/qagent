"""In-page extraction of interactive/meaningful elements with stable data-qa-ref ids."""

from typing import Any
from urllib.parse import urlsplit

from playwright.async_api import Page
from pydantic import BaseModel

_EXTRACT_JS = r"""
() => {
  const SEL = 'a,button,input,select,textarea,summary,[role=button],[role=link],[role=checkbox],[role=tab],' +
    '[role=menuitem],[role=switch],[role=radio],[onclick],[contenteditable=""],[contenteditable=true],' +
    'h1,h2,h3,[role=alert],[role=status],[aria-live],.error,.toast,[aria-invalid=true]';
  window.__qaN = window.__qaN || 0;
  const vh = innerHeight, out = [], seen = new Set();
  const clip = (s, n) => (s || '').replace(/\s+/g, ' ').trim().slice(0, n);
  const nameOf = (el) => {
    const byId = el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    return clip(el.getAttribute('aria-label') || (el.labels && el.labels[0] && el.labels[0].innerText) ||
      (byId && byId.innerText) || el.getAttribute('placeholder') || el.getAttribute('alt') ||
      el.getAttribute('title') || el.innerText || el.value || el.getAttribute('name') ||
      (el.querySelector('svg title,img[alt]') && (el.querySelector('svg title')?.textContent || el.querySelector('img[alt]').alt)) ||
      el.dataset.testid || (el.tagName === 'BUTTON' && el.id) || '', 80);
  };
  for (const el of document.querySelectorAll(SEL)) {
    if (seen.has(el) || out.length >= 100) continue;
    const r = el.getBoundingClientRect(), st = getComputedStyle(el);
    if (r.width < 1 || r.height < 1 || st.visibility === 'hidden' || st.display === 'none' || +st.opacity === 0) continue;
    if (r.bottom < -100 || r.top > vh + 300) continue;
    seen.add(el);
    if (!el.dataset.qaRef) el.dataset.qaRef = 'e' + (++window.__qaN);
    const tag = el.tagName.toLowerCase(), type = el.getAttribute('type') || '';
    let value = ('value' in el && tag !== 'button' && tag !== 'a') ? String(el.value || '') : '';
    if (type === 'password' && value) value = '••••';
    out.push({
      ref: el.dataset.qaRef, tag, role: el.getAttribute('role') || '', type, name: nameOf(el),
      value: clip(value, 60), disabled: !!el.disabled || el.getAttribute('aria-disabled') === 'true',
      checked: (type === 'checkbox' || type === 'radio') ? !!el.checked
        : (el.getAttribute('aria-checked') ? el.getAttribute('aria-checked') === 'true' : null),
      pressed: el.getAttribute('aria-pressed') ? el.getAttribute('aria-pressed') === 'true' : null,
      expanded: el.getAttribute('aria-expanded') ? el.getAttribute('aria-expanded') === 'true' : null,
      invalid: el.getAttribute('aria-invalid') === 'true',
      bbox: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    });
  }
  const captcha = !!document.querySelector('iframe[src*="recaptcha"],iframe[src*="hcaptcha"],' +
    'iframe[src*="challenges.cloudflare.com"],.g-recaptcha,.h-captcha,.cf-turnstile,#challenge-form');
  return { url: location.href, title: document.title, text: clip(document.body ? document.body.innerText : '', 1000), elements: out, captcha };
}
"""

# Page-level look: theme is judged from the real rendered background colour (canvas decodes any CSS colour format).
_STATE_JS = r"""
() => {
  const de = document.documentElement, b = document.body;
  const c = document.createElement('canvas').getContext('2d');
  const lum = (css) => {
    c.clearRect(0, 0, 1, 1); c.fillStyle = '#000'; c.fillStyle = css; c.fillRect(0, 0, 1, 1);
    const [r, g, bl, a] = c.getImageData(0, 0, 1, 1).data;
    return a < 10 ? null : (0.2126 * r + 0.7152 * g + 0.0722 * bl) / 255;
  };
  let bg = null;
  for (const el of [b, de]) { if (!el) continue; bg = lum(getComputedStyle(el).backgroundColor); if (bg !== null) break; }
  if (bg === null) bg = 1;
  const clip = (s) => (s || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  return { theme: bg < 0.4 ? 'dark' : 'light', bg: Math.round(bg * 100) / 100, cls: clip((de.className || '') + ' ' + ((b && b.className) || '')),
    dataTheme: de.dataset.theme || (b && b.dataset.theme) || '', colorScheme: getComputedStyle(de).colorScheme };
}
"""

ROLE_BY_TAG = {"a": "link", "button": "button", "select": "combobox", "textarea": "textbox", "summary": "button"}
INPUT_ROLES = {"checkbox": "checkbox", "radio": "radio", "submit": "button", "button": "button"}
INFO_TAGS = {"h1", "h2", "h3"}


class Element(BaseModel):
    ref: str
    tag: str
    role: str
    type: str
    name: str
    value: str
    disabled: bool
    checked: bool | None
    pressed: bool | None = None
    expanded: bool | None = None
    invalid: bool
    bbox: dict[str, int]

    @property
    def aria_role(self) -> str:
        if self.role:
            return self.role
        if self.tag == "input":
            return INPUT_ROLES.get(self.type, "textbox")
        return ROLE_BY_TAG.get(self.tag, self.tag)

    def line(self) -> str:
        kind = self.tag if self.tag in INFO_TAGS else self.aria_role
        parts = [f"[{self.ref}] {kind}"]
        if self.type and self.tag == "input":
            parts.append(f"type={self.type}")
        parts.append(f'"{self.name}"')
        if self.value:
            parts.append(f'value="{self.value}"')
        if self.disabled:
            parts.append("disabled")
        if self.checked is not None:
            parts.append("checked" if self.checked else "unchecked")
        if self.pressed is not None:
            parts.append("pressed" if self.pressed else "not-pressed")
        if self.expanded is not None:
            parts.append("expanded" if self.expanded else "collapsed")
        if self.invalid:
            parts.append("invalid")
        return " ".join(parts)


class Observation(BaseModel):
    url: str
    title: str
    text: str
    elements: list[Element]
    captcha: bool = False
    state: dict[str, Any] = {}

    def state_line(self) -> str:
        st = self.state
        if not st:
            return ""
        extra = "".join(f", {k}={st[k]!r}" for k in ("dataTheme", "cls", "colorScheme") if st.get(k))
        return f"Theme: {st['theme']} (background luminance {st['bg']}{extra})"

    def diff(self, prev: "Observation | None") -> str:
        """What changed since the previous observation, so the model need not compare two page dumps."""
        if prev is None:
            return ""
        out: list[str] = []
        if self.url != prev.url:
            out.append(f"URL: {prev.url} -> {self.url}")
        if prev.state and self.state and prev.state["theme"] != self.state["theme"]:
            out.append(f"Theme: {prev.state['theme']} -> {self.state['theme']}")
        old = {e.line() for e in prev.elements}
        new = [e.line() for e in self.elements if e.line() not in old and e.ref not in {p.ref for p in prev.elements}]
        changed = [e.line() for e in self.elements if e.ref in {p.ref for p in prev.elements} and e.line() not in old]
        if new:
            out.append("New: " + "; ".join(new[:6]))
        if changed:
            out.append("Changed: " + "; ".join(changed[:6]))
        gone = len({p.ref for p in prev.elements} - {e.ref for e in self.elements})
        if gone:
            out.append(f"{gone} element(s) disappeared")
        return "\n".join(out) or "nothing visible changed"

    def checks(self) -> dict[str, Any]:
        """Deterministic end-state assertions for replay: URL path + key headings/messages."""
        texts = [e.name for e in self.elements if e.name and (e.tag in INFO_TAGS or e.role in ("alert", "status"))]
        return {"path": urlsplit(self.url).path, "texts": texts[:3]}

    def by_ref(self, ref: str | None) -> Element | None:
        return next((e for e in self.elements if e.ref == ref), None)

    def render(self, secrets: list[str]) -> str:
        body = "\n".join(e.line() for e in self.elements)
        out = f"URL: {self.url}\nTitle: {self.title}\n{self.state_line()}\n\nElements:\n{body}\n\nVisible text (truncated):\n{self.text}"
        for s in secrets:
            if s:
                out = out.replace(s, "****")
        return out


async def observe(page: Page) -> Observation:
    try:
        await page.wait_for_load_state("domcontentloaded", timeout=5_000)
        await page.wait_for_load_state("networkidle", timeout=1_500)  # let SPAs hydrate before reading the page
    except Exception:
        pass
    raw: dict[str, Any] = await page.evaluate(_EXTRACT_JS)
    raw["state"] = await page_state(page)
    return Observation.model_validate(raw)


async def page_state(page: Page) -> dict[str, Any]:
    try:
        return await page.evaluate(_STATE_JS)
    except Exception:
        return {}
