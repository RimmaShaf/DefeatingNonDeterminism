from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal, Protocol, runtime_checkable

Status = Literal["ok", "empty", "error", "filtered", "truncated"]


@dataclass(slots=True)
class CompletionRecord:
    run_idx: int
    ts: float
    status: Status
    text: str
    tokens: list
    logprobs: list | None
    model_digest: str
    tokenizer_version: str
    api_version: str
    seed: int | None
    config_hash: str
    provider_raw_id: str = ""


@runtime_checkable
class Provider(Protocol):
    name: str
    model_name: str
    model_digest: str
    api_version: str
    tokenizer_version: str

    async def complete(
        self,
        prompt: str,
        temperature: float,
        top_p: float,
        max_tokens: int,
        seed: int | None,
    ) -> CompletionRecord: ...
