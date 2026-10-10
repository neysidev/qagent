"""Model factory + token/cost accounting. Provider and models are env-configurable."""

import asyncio
import json
import logging
import os
import random
import re
from functools import cache
from typing import Literal, TypeVar

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import BaseMessage
from pydantic import BaseModel

log = logging.getLogger("qagent.llm")
T = TypeVar("T", bound=BaseModel)
ModelKind = Literal["fast", "smart"]

# USD per 1M tokens: {"model": [input, output]}. Override with PRICE_TABLE_JSON.
# ponytail: 3.8 Flash doubles to [1.50, 7.50] on 2027-01-01; override via PRICE_TABLE_JSON then.
DEFAULT_PRICES: dict[str, list[float]] = {
    "gemini-3.8-flash": [0.75, 3.75],
    "gemini-3.1-flash-lite": [0.25, 1.50],
    "gemini-3.1-pro-preview": [2.00, 12.00],
}
PRICES: dict[str, list[float]] = {**DEFAULT_PRICES, **json.loads(os.environ.get("PRICE_TABLE_JSON") or "{}")}


def model_name(kind: ModelKind) -> str:
    if kind == "fast":
        return os.environ.get("MODEL_FAST", "gemini-3.8-flash")
    return os.environ.get("MODEL_SMART", "gemini-3.1-pro-preview")


# Cap on reply length. Replies are small structured JSON; without a cap, OpenAI-compatible providers reserve the
# model's full output window (64k+ tokens) per call, which credit-limited keys reject outright (OpenRouter: 402).
MAX_TOKENS = int(os.environ.get("LLM_MAX_TOKENS", "8192"))  # Gemini counts thinking tokens against this


@cache
def chat_model(kind: ModelKind) -> BaseChatModel:
    name = model_name(kind)
    if os.environ.get("LLM_PROVIDER", "gemini") == "openai_compatible":
        from langchain_openai import ChatOpenAI

        return ChatOpenAI(
            model=name,
            base_url=os.environ.get("LLM_BASE_URL") or None,
            api_key=os.environ["LLM_API_KEY"],
            max_tokens=MAX_TOKENS,
            temperature=0.1,
            timeout=60,
            max_retries=0,
        )
    from langchain_google_genai import ChatGoogleGenerativeAI

    return ChatGoogleGenerativeAI(
        model=name,
        google_api_key=os.environ["GOOGLE_API_KEY"],
        max_output_tokens=MAX_TOKENS,
        temperature=1.0,  # Gemini 3 degrades (loops, junk output) when lowered; 1.0 is Google's recommendation
        thinking_level="low" if kind == "fast" else None,  # bounded thinking so it can't eat the output budget
        timeout=60,
        max_retries=0,
    )


class Cost(BaseModel):
    inputTokens: int = 0
    outputTokens: int = 0
    usd: float = 0.0
    llmCalls: int = 0

    def add(self, model: str, input_tokens: int, output_tokens: int) -> None:
        price_in, price_out = PRICES.get(model, [0.0, 0.0])
        self.inputTokens += input_tokens
        self.outputTokens += output_tokens
        self.usd = round(self.usd + (input_tokens * price_in + output_tokens * price_out) / 1_000_000, 6)
        self.llmCalls += 1


RETRY_MARKERS = ("429", "500", "502", "503", "504", "RESOURCE_EXHAUSTED", "UNAVAILABLE", "overloaded", "timed out", "Timeout")
ATTEMPTS = 5  # 2+4+8+16s backoff ≈ 30s before giving up (or the server-hinted delay)


def _retryable(e: Exception) -> bool:
    status = getattr(e, "status_code", None) or getattr(e, "code", None)
    if isinstance(status, int):
        return status == 429 or status >= 500
    return isinstance(e, (TimeoutError, asyncio.TimeoutError)) or any(m in str(e) for m in RETRY_MARKERS)


async def _call(kind: ModelKind, schema: type[T], messages: list[BaseMessage], cost: Cost) -> T:
    """Retries 429/5xx with exponential backoff; retries once on a parse failure. Usage is always billed."""
    # OpenAI-compatible providers (Qwen etc.) often loop under strict json_schema; tool calling is widely supported
    kw = {"method": "function_calling"} if os.environ.get("LLM_PROVIDER", "gemini") == "openai_compatible" else {}
    llm = chat_model(kind).with_structured_output(schema, include_raw=True, **kw)
    parse_failures = 0
    attempt = 0
    while True:
        try:
            res = await llm.ainvoke(messages)
        except Exception as e:
            attempt += 1
            if not _retryable(e) or attempt >= ATTEMPTS:
                raise
            hinted = re.search(r"retry in (\d+(?:\.\d+)?)s|retryDelay': '(\d+)s", str(e))
            delay = min(float(next(g for g in hinted.groups() if g)) + 1, 60) if hinted else 2**attempt + random.random()
            log.warning("llm %s retry %d in %.1fs: %s", model_name(kind), attempt, delay, str(e)[:200])
            await asyncio.sleep(delay)
            continue
        usage = getattr(res["raw"], "usage_metadata", None) or {}
        cost.add(model_name(kind), usage.get("input_tokens", 0), usage.get("output_tokens", 0))
        if res.get("parsed") is not None:
            return res["parsed"]
        parse_failures += 1
        if parse_failures >= 2:
            raise RuntimeError(f"LLM returned invalid output: {res.get('parsing_error')}")


async def structured(kind: ModelKind, schema: type[T], messages: list[BaseMessage], cost: Cost) -> T:
    """Structured call on `kind`; if that model stays unavailable, falls back to the other one."""
    try:
        return await _call(kind, schema, messages, cost)
    except Exception as e:
        if not _retryable(e) or model_name("fast") == model_name("smart"):
            raise
        other: ModelKind = "smart" if kind == "fast" else "fast"
        log.warning("llm %s unavailable, falling back to %s", model_name(kind), model_name(other))
        return await _call(other, schema, messages, cost)


def error_code(e: BaseException) -> str | None:
    """Stable code for a model-provider failure, stored on the run so the app can explain it; None if not one."""
    status = getattr(e, "status_code", None) or getattr(e, "code", None)
    text = str(e)
    if status == 402 or "requires more credits" in text or "insufficient_quota" in text:
        return "LLM_CREDITS"
    if status in (401, 403) or "invalid api key" in text.lower() or "API_KEY_INVALID" in text:
        return "LLM_AUTH"
    if status == 404 or "model_not_found" in text or "is not a valid model" in text:
        return "LLM_MODEL"
    if status == 429 or "RESOURCE_EXHAUSTED" in text:
        return "LLM_RATE_LIMIT"
    if text.startswith("LLM returned invalid output"):
        return "LLM_BAD_OUTPUT"
    if _retryable(e):
        return "LLM_UNAVAILABLE"
    return None


if __name__ == "__main__":

    class E(Exception):
        def __init__(self, code: int) -> None:
            self.status_code = code

    assert _retryable(E(429)) and _retryable(E(503)) and not _retryable(E(400))
    assert _retryable(Exception("429 RESOURCE_EXHAUSTED")) and not _retryable(ValueError("bad schema"))
    assert error_code(E(402)) == "LLM_CREDITS" and error_code(E(401)) == "LLM_AUTH" and error_code(E(404)) == "LLM_MODEL"
    assert error_code(E(429)) == "LLM_RATE_LIMIT" and error_code(E(503)) == "LLM_UNAVAILABLE"
    assert error_code(RuntimeError("LLM returned invalid output: x")) == "LLM_BAD_OUTPUT"
    assert error_code(RuntimeError("Site unreachable: net::ERR")) is None
    print("ok")
