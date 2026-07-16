from __future__ import annotations

import logging
from typing import Any, Callable, TypedDict

logger = logging.getLogger(__name__)


class TokenizationResult(TypedDict):
    unit: str
    ids_or_units: list
    version: str


OLLAMA_TO_HF: dict[str, str] = {
    "gemma3:27b": "google/gemma-2-27b-it",
    "gemma4:latest": "google/gemma-3-27b-it",
    "llama3.3:70b": "meta-llama/Llama-3.3-70B-Instruct",
    "llama3.3:70b-instruct-q2_K": "meta-llama/Llama-3.3-70B-Instruct",
    "llama3.1:8b": "meta-llama/Llama-3.1-8B-Instruct",
    "qwen2.5:7b": "Qwen/Qwen2.5-7B-Instruct",
}

GROQ_DEFAULT_HF = "meta-llama/Llama-3.3-70B-Instruct"


def _codepoint_tokenize(text: str) -> TokenizationResult:
    return {
        "unit": "codepoint",
        "ids_or_units": [ord(c) for c in text],
        "version": "codepoint-fallback",
    }


def _byte_tokenize(text: str) -> TokenizationResult:
    return {
        "unit": "byte",
        "ids_or_units": list(text.encode("utf-8")),
        "version": "utf8-byte",
    }


def tokenize_bytes(text: str) -> TokenizationResult:
    return _byte_tokenize(text)


def tokenize_codepoints(text: str) -> TokenizationResult:
    return {
        "unit": "codepoint",
        "ids_or_units": [ord(c) for c in text],
        "version": "utf8-codepoint",
    }


def _build_hf_tokenizer(hf_repo: str) -> tuple[Callable[[str], TokenizationResult], str] | None:
    try:
        from transformers import AutoTokenizer
    except ImportError:
        logger.warning("transformers not installed; using codepoint fallback")
        return None
    try:
        tok = AutoTokenizer.from_pretrained(hf_repo)
    except Exception as exc:
        logger.warning("HF tokenizer load failed for %s: %s", hf_repo, exc)
        return None
    version = f"hf:{hf_repo}@{getattr(tok, 'name_or_path', hf_repo)}"

    def _tokenize(text: str) -> TokenizationResult:
        ids = tok.encode(text, add_special_tokens=False)
        return {"unit": "token", "ids_or_units": list(ids), "version": version}

    return _tokenize, version


def get_tokenizer(provider: str, model_name: str) -> Callable[[str], TokenizationResult]:
    match provider:
        case "ollama":
            hf_repo = OLLAMA_TO_HF.get(model_name)
            if hf_repo:
                built = _build_hf_tokenizer(hf_repo)
                if built is not None:
                    return built[0]
            logger.warning("No HF tokenizer for ollama model %s; using codepoint", model_name)
            return _codepoint_tokenize
        case "gemini":
            return tokenize_codepoints
        case "groq":
            built = _build_hf_tokenizer(GROQ_DEFAULT_HF)
            if built is not None:
                return built[0]
            return _codepoint_tokenize
        case _:
            return _codepoint_tokenize


def tokenizer_version(provider: str, model_name: str) -> str:
    match provider:
        case "ollama":
            hf_repo = OLLAMA_TO_HF.get(model_name)
            return f"hf:{hf_repo}" if hf_repo else "codepoint-fallback"
        case "gemini":
            return "utf8-codepoint"
        case "groq":
            return f"hf:{GROQ_DEFAULT_HF}"
        case _:
            return "codepoint-fallback"
