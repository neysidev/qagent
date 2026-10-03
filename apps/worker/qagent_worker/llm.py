"""Model factory + token/cost accounting. Provider and models are env-configurable."""

import json
import os
from functools import cache
from typing import Literal, TypeVar

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import BaseMessage
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)
ModelKind = Literal["fast", "smart"]

# USD per 1M tokens: {"model": [input, output]}. Override with PRICE_TABLE_JSON.
DEFAULT_PRICES: dict[str, list[float]] = {
    "gemini-2.5-flash": [0.30, 2.50],
    "gemini-2.5-flash-lite": [0.10, 0.40],
    "gemini-2.5-pro": [1.25, 10.0],
}
PRICES: dict[str, list[float]] = {**DEFAULT_PRICES, **json.loads(os.environ.get("PRICE_TABLE_JSON") or "{}")}


def model_name(kind: ModelKind) -> str:
    if kind == "fast":
        return os.environ.get("MODEL_FAST", "gemini-2.5-flash")
    return os.environ.get("MODEL_SMART", "gemini-2.5-pro")


@cache
def chat_model(kind: ModelKind) -> BaseChatModel:
    name = model_name(kind)
    if os.environ.get("LLM_PROVIDER", "gemini") == "openai_compatible":
        from langchain_openai import ChatOpenAI

        return ChatOpenAI(
            model=name,
            base_url=os.environ.get("LLM_BASE_URL") or None,
            api_key=os.environ["LLM_API_KEY"],
            temperature=0.1,
            timeout=60,
            max_retries=2,
        )
    from langchain_google_genai import ChatGoogleGenerativeAI

    return ChatGoogleGenerativeAI(
        model=name, google_api_key=os.environ["GOOGLE_API_KEY"], temperature=0.1, timeout=60, max_retries=2
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


async def structured(kind: ModelKind, schema: type[T], messages: list[BaseMessage], cost: Cost) -> T:
    """One structured-output call; retries once on a parse failure. Usage is always billed."""
    llm = chat_model(kind).with_structured_output(schema, include_raw=True)
    last_error: Exception | None = None
    for _ in range(2):
        res = await llm.ainvoke(messages)
        usage = getattr(res["raw"], "usage_metadata", None) or {}
        cost.add(model_name(kind), usage.get("input_tokens", 0), usage.get("output_tokens", 0))
        if res.get("parsed") is not None:
            return res["parsed"]
        last_error = res.get("parsing_error")
    raise RuntimeError(f"LLM returned invalid output: {last_error}")
