from __future__ import annotations

import os
import time
from dataclasses import dataclass, field
from typing import Any

from . import CompletionRecord, Status


@dataclass(slots=True)
class GroqProvider:
    name: str = "groq"
    model_name: str = ""
    model_digest: str = ""
    api_version: str = "groq"
    tokenizer_version: str = ""
    _client: Any = field(default=None, init=False)
    _tokenize: Any = field(default=None, init=False)
    _config_hash: str = field(default="", init=False)

    @classmethod
    async def create(
        cls,
        model_name: str,
        tokenize_fn: Any,
        tokenizer_version: str,
        config_hash: str,
    ) -> "GroqProvider":
        import groq

        api_key = os.environ.get("GROQ_API_KEY")
        client = groq.AsyncGroq(api_key=api_key) if api_key else groq.AsyncGroq()
        sdk_version = getattr(groq, "__version__", "unknown")
        inst = cls(
            model_name=model_name,
            model_digest=f"groq-api:{model_name}",
            api_version=f"groq:{sdk_version}",
            tokenizer_version=tokenizer_version,
        )
        inst._client = client
        inst._tokenize = tokenize_fn
        inst._config_hash = config_hash
        return inst

    async def complete(
        self,
        prompt: str,
        temperature: float,
        top_p: float,
        max_tokens: int,
        seed: int | None,
    ) -> CompletionRecord:
        ts = time.time()
        status: Status
        text = ""
        tokens: list = []
        logprobs_out: list | None = None
        raw_id = ""
        try:
            resp = await self._client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                top_p=top_p,
                max_tokens=max_tokens,
                seed=seed,
                logprobs=True,
            )
            choice = resp.choices[0]
            text = choice.message.content or ""
            finish_reason = str(choice.finish_reason or "")
            raw_id = getattr(resp, "id", "") or finish_reason
            api_tokens: list = []
            lp = getattr(choice, "logprobs", None)
            if lp is not None:
                content = getattr(lp, "content", None) or []
                for tok in content:
                    tstr = getattr(tok, "token", None)
                    if tstr is not None:
                        api_tokens.append(tstr)
                if content:
                    logprobs_out = [
                        getattr(t, "logprob", None) for t in content
                    ]
            if api_tokens:
                tokens = api_tokens
            elif text:
                tok_result = self._tokenize(text)
                tokens = list(tok_result.get("ids_or_units", []))
            if finish_reason == "content_filter":
                status = "filtered"
            elif not text:
                status = "empty"
            elif finish_reason == "length":
                status = "truncated"
            else:
                status = "ok"
        except Exception as exc:
            status = "error"
            raw_id = f"{type(exc).__name__}: {exc}"[:200]

        return CompletionRecord(
            run_idx=seed if seed is not None else -1,
            ts=ts,
            status=status,
            text=text,
            tokens=tokens,
            logprobs=logprobs_out,
            model_digest=self.model_digest,
            tokenizer_version=self.tokenizer_version,
            api_version=self.api_version,
            seed=seed,
            config_hash=self._config_hash,
            provider_raw_id=raw_id,
        )
