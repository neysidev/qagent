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
      el.getAttribute('title') || el.innerText || el.value || el.getAttribute('name'), 80);
  };
  for (const el of document.querySelectorAll(SEL)) {
    if (seen.has(el) || out.length >= 150) continue;
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
      checked: (type === 'checkbox' || type === 'radio') ? !!el.checked : null,
      invalid: el.getAttribute('aria-invalid') === 'true',
      bbox: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    });
  }
  const captcha = !!document.querySelector('iframe[src*="recaptcha"],iframe[src*="hcaptcha"],' +
    'iframe[src*="challenges.cloudflare.com"],.g-recaptcha,.h-captcha,.cf-turnstile,#challenge-form');
  return { url: location.href, title: document.title, text: clip(document.body ? document.body.innerText : '', 1500), elements: out, captcha };
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
        if self.invalid:
            parts.append("invalid")
        return " ".join(parts)


class Observation(BaseModel):
    url: str
    title: str
    text: str
    elements: list[Element]
    captcha: bool = False

    def checks(self) -> dict[str, Any]:
        """Deterministic end-state assertions for replay: URL path + key headings/messages."""
        texts = [e.name for e in self.elements if e.name and (e.tag in INFO_TAGS or e.role in ("alert", "status"))]
        return {"path": urlsplit(self.url).path, "texts": texts[:3]}

    def by_ref(self, ref: str | None) -> Element | None:
        return next((e for e in self.elements if e.ref == ref), None)

    def render(self, secrets: list[str]) -> str:
        body = "\n".join(e.line() for e in self.elements)
        out = f"URL: {self.url}\nTitle: {self.title}\n\nElements:\n{body}\n\nVisible text (truncated):\n{self.text}"
        for s in secrets:
            if s:
                out = out.replace(s, "****")
        return out


async def observe(page: Page) -> Observation:
    try:
        await page.wait_for_load_state("domcontentloaded", timeout=5_000)
    except Exception:
        pass
    raw: dict[str, Any] = await page.evaluate(_EXTRACT_JS)
    return Observation.model_validate(raw)
