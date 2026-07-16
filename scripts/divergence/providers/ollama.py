from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any

from . import CompletionRecord, Status


@dataclass(slots=True)
class OllamaProvider:
    name: str = "ollama"
    model_name: str = ""
    model_digest: str = ""
    api_version: str = ""
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
    ) -> "OllamaProvider":
        import ollama

        client = ollama.AsyncClient()
        digest = ""
        api_version = "ollama"
        try:
            info = await client.show(model_name)
            digest = (
                getattr(info, "digest", None)
                or (info.get("digest") if isinstance(info, dict) else "")
                or ""
            )
            details = getattr(info, "details", None)
            if details and hasattr(details, "format"):
                api_version = f"ollama:{details.format}"
        except Exception:
            pass

        inst = cls(
            model_name=model_name,
            model_digest=digest,
            api_version=api_version,
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
        raw_id = ""
        try:
            resp = await self._client.generate(
                model=self.model_name,
                prompt=prompt,
                options={
                    "temperature": temperature,
                    "top_p": top_p,
                    "num_predict": max_tokens,
                    "seed": seed if seed is not None else 0,
                },
                stream=False,
            )
            text = (
                getattr(resp, "response", None)
                or (resp.get("response") if isinstance(resp, dict) else "")
                or ""
            )
            done_reason = (
                getattr(resp, "done_reason", None)
                or (resp.get("done_reason") if isinstance(resp, dict) else "")
                or ""
            )
            eval_count = (
                getattr(resp, "eval_count", None)
                or (resp.get("eval_count") if isinstance(resp, dict) else 0)
                or 0
            )
            raw_id = str(done_reason)
            if not text:
                status = "empty"
            elif done_reason == "length" or eval_count >= max_tokens:
                status = "truncated"
            else:
                status = "ok"
            tok_result = self._tokenize(text) if text else {"ids_or_units": []}
            tokens = list(tok_result.get("ids_or_units", []))
        except Exception as exc:
            status = "error"
            raw_id = f"{type(exc).__name__}: {exc}"[:200]

        return CompletionRecord(
            run_idx=seed if seed is not None else -1,
            ts=ts,
            status=status,
            text=text,
            tokens=tokens,
            logprobs=None,
            model_digest=self.model_digest,
            tokenizer_version=self.tokenizer_version,
            api_version=self.api_version,
            seed=seed,
            config_hash=self._config_hash,
            provider_raw_id=raw_id,
        )
