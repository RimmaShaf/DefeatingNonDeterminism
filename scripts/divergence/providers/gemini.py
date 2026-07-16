from __future__ import annotations

import os
import time
from dataclasses import dataclass, field
from typing import Any

from . import CompletionRecord, Status


@dataclass(slots=True)
class GeminiProvider:
    name: str = "gemini"
    model_name: str = ""
    model_digest: str = ""
    api_version: str = "google-genai"
    tokenizer_version: str = "utf8-codepoint"
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
    ) -> "GeminiProvider":
        from google import genai

        api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        client = genai.Client(api_key=api_key) if api_key else genai.Client()
        sdk_version = getattr(genai, "__version__", "unknown")
        inst = cls(
            model_name=model_name,
            model_digest=f"gemini-api:{model_name}",
            api_version=f"google-genai:{sdk_version}",
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
            from google.genai import types

            cfg = types.GenerateContentConfig(
                temperature=temperature,
                top_p=top_p,
                max_output_tokens=max_tokens,
            )
            resp = await self._client.aio.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=cfg,
            )
            text = getattr(resp, "text", "") or ""
            candidates = getattr(resp, "candidates", None) or []
            finish_reason = ""
            if candidates:
                finish_reason = str(getattr(candidates[0], "finish_reason", "") or "")
            raw_id = finish_reason
            if "SAFETY" in finish_reason.upper() or "BLOCK" in finish_reason.upper():
                status = "filtered"
            elif not text:
                status = "empty"
            elif "MAX_TOKENS" in finish_reason.upper():
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
            seed=None,
            config_hash=self._config_hash,
            provider_raw_id=raw_id,
        )
