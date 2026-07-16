from __future__ import annotations

import hashlib
import json
from typing import Any


def cfg8(cell: dict[str, Any]) -> str:
    """Return 8-char sha256 prefix of canonical JSON over hash-included fields.

    INCLUDED fields (identity-defining):
        model.name, model.digest, prompt.text, temperature, top_p,
        max_tokens, tokenizer_version, seed_scheme

    EXCLUDED fields (logged but not identity-defining):
        wall-clock, run_idx, retry-count, provider request id, api_version
    """
    payload = {
        "model.name": cell["model"]["name"],
        "model.digest": cell["model"].get("digest", ""),
        "prompt.text": cell["prompt"]["text"],
        "temperature": cell["temperature"],
        "top_p": cell["top_p"],
        "max_tokens": cell["max_tokens"],
        "tokenizer_version": cell.get("tokenizer_version", ""),
        "seed_scheme": cell.get("seed_scheme", ""),
    }
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()[:8]
