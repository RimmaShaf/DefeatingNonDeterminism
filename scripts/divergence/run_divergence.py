#!/usr/bin/env python3
from __future__ import annotations

import argparse
import asyncio
import dataclasses
import json
import sys
import time
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[2]
HARNESS_DIR = Path(__file__).resolve().parent
RAW_DIR = PROJECT_ROOT / "data" / "divergence" / "raw"

if str(HARNESS_DIR.parent) not in sys.path:
    sys.path.insert(0, str(HARNESS_DIR.parent))

from divergence.config_hash import cfg8  # type: ignore
from divergence.pacing import ProviderPacing  # type: ignore
from divergence.tok import get_tokenizer, tokenizer_version as tk_version  # type: ignore


PROVIDER_LATENCY_S = {"ollama": 4.0, "gemini": 1.0, "groq": 2.0}
PROVIDER_SEMAPHORE = {"ollama": 1, "gemini": 8, "groq": 4}
ROUGH_PRICING = {
    "gemini": 0.00015,  # TODO: verify $/1K tokens for gemini-2.5-flash
    "groq": 0.00010,    # TODO: verify $/1K tokens for groq llama-3.3-70b-versatile
    "ollama": 0.0,
}


def _enforce_python() -> None:
    if not (sys.version_info >= (3, 11) and sys.version_info < (3, 13)):
        print(
            f"ERROR: Python 3.11–3.12 required; got {sys.version_info.major}."
            f"{sys.version_info.minor}.{sys.version_info.micro}",
            file=sys.stderr,
        )
        sys.exit(2)


def _slugify(s: str) -> str:
    return s.replace(":", "_").replace("/", "_")


def _load_yaml(path: Path) -> dict[str, Any]:
    import yaml

    with path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def _expand_cells(cfg: dict[str, Any]) -> list[dict[str, Any]]:
    cells: list[dict[str, Any]] = []
    for model in cfg["models"]:
        for prompt in cfg["prompts"]:
            for temp in cfg["temperatures"]:
                seed_scheme = "unset" if model["provider"] == "gemini" else "run_idx"
                tv = tk_version(model["provider"], model["name"])
                cell = {
                    "model": {"provider": model["provider"], "name": model["name"], "digest": ""},
                    "prompt": prompt,
                    "temperature": float(temp),
                    "top_p": float(cfg.get("top_p", 1.0)),
                    "max_tokens": int(cfg.get("max_tokens", 200)),
                    "tokenizer_version": tv,
                    "seed_scheme": seed_scheme,
                    "n_runs": int(cfg.get("n_runs", 100)),
                }
                cell["cfg8"] = cfg8(cell)
                cells.append(cell)
    return cells


def _filename_for(cell: dict[str, Any]) -> Path:
    slug = _slugify(cell["model"]["name"])
    pid = cell["prompt"]["id"]
    temp = cell["temperature"]
    h = cell["cfg8"]
    return RAW_DIR / f"{slug}__{pid}__t{temp}__{h}.jsonl"


def _count_ok(path: Path) -> int:
    if not path.exists():
        return 0
    n = 0
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            try:
                row = json.loads(line)
                if row.get("status") == "ok":
                    n += 1
            except Exception:
                continue
    return n


def _append_row(path: Path, row: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(row, ensure_ascii=False) + "\n")


def _expected_wallclock(cells: list[dict[str, Any]]) -> dict[str, float]:
    per: dict[str, float] = {}
    for c in cells:
        prov = c["model"]["provider"]
        n_needed = c["n_runs"]
        sem = PROVIDER_SEMAPHORE.get(prov, 1)
        lat = PROVIDER_LATENCY_S.get(prov, 2.0)
        if prov == "groq":
            lat = max(lat, 60.0 / 30.0)
        per[prov] = per.get(prov, 0.0) + (n_needed * lat) / max(1, sem)
    return per


async def _build_provider(cell: dict[str, Any]) -> Any:
    prov = cell["model"]["provider"]
    model_name = cell["model"]["name"]
    tok_fn = get_tokenizer(prov, model_name)
    tv = cell["tokenizer_version"]
    h = cell["cfg8"]
    match prov:
        case "ollama":
            from divergence.providers.ollama import OllamaProvider
            return await OllamaProvider.create(model_name, tok_fn, tv, h)
        case "gemini":
            from divergence.providers.gemini import GeminiProvider
            return await GeminiProvider.create(model_name, tok_fn, tv, h)
        case "groq":
            from divergence.providers.groq import GroqProvider
            return await GroqProvider.create(model_name, tok_fn, tv, h)
        case _:
            raise ValueError(f"Unknown provider: {prov}")


async def _run_cell(
    cell: dict[str, Any],
    pacing: ProviderPacing,
    sem: asyncio.Semaphore,
    counts: dict[str, int],
) -> None:
    prov = cell["model"]["provider"]
    path = _filename_for(cell)
    have = _count_ok(path)
    needed = cell["n_runs"] - have
    if needed <= 0:
        return
    provider = await _build_provider(cell)
    cell["model"]["digest"] = getattr(provider, "model_digest", "") or cell["model"]["digest"]

    async def _one(run_idx: int) -> None:
        async with sem:
            await pacing.get(prov).acquire()
            rec = await provider.complete(
                prompt=cell["prompt"]["text"],
                temperature=cell["temperature"],
                top_p=cell["top_p"],
                max_tokens=cell["max_tokens"],
                seed=run_idx if cell["seed_scheme"] != "unset" else None,
            )
            row = dataclasses.asdict(rec)
            row["run_idx"] = run_idx
            _append_row(path, row)
            counts[prov] = counts.get(prov, 0) + 1

    tasks = [_one(have + i) for i in range(needed)]
    await asyncio.gather(*tasks)


async def _main(args: argparse.Namespace) -> int:
    cfg_path = Path(args.config).resolve()
    cfg = _load_yaml(cfg_path)
    cells = _expand_cells(cfg)
    if args.provider:
        cells = [c for c in cells if c["model"]["provider"] == args.provider]

    print(f"[run_divergence] config={cfg_path}")
    print(f"[run_divergence] expanded {len(cells)} cells")
    for c in cells:
        path = _filename_for(c)
        have = _count_ok(path)
        print(
            f"  - {c['model']['provider']:7s} {c['model']['name']:32s} "
            f"prompt={c['prompt']['id']:10s} t={c['temperature']:.1f} "
            f"cfg8={c['cfg8']} have={have}/{c['n_runs']} -> {path.name}"
        )

    expected = _expected_wallclock(cells)
    print("[run_divergence] expected wall-clock (seconds) per provider:")
    for prov, sec in expected.items():
        print(f"  - {prov}: {sec:.1f}s (~{sec/60:.1f} min)")

    if args.dry_run:
        print("[run_divergence] dry-run; no requests issued")
        return 0

    pacing = ProviderPacing()
    sems: dict[str, asyncio.Semaphore] = {
        prov: asyncio.Semaphore(PROVIDER_SEMAPHORE.get(prov, 4))
        for prov in {c["model"]["provider"] for c in cells}
    }
    counts: dict[str, int] = {}
    t0 = time.time()
    for c in cells:
        try:
            await _run_cell(c, pacing, sems[c["model"]["provider"]], counts)
        except Exception as exc:
            print(f"[run_divergence] cell failed {c['cfg8']}: {exc}", file=sys.stderr)

    elapsed = time.time() - t0
    print(f"[run_divergence] done in {elapsed:.1f}s ({elapsed/60:.1f} min)")
    print("[run_divergence] per-provider request counts:")
    for prov, n in counts.items():
        est_spend = n * cfg.get("max_tokens", 200) / 1000.0 * ROUGH_PRICING.get(prov, 0.0)
        print(f"  - {prov}: {n} requests, est spend ${est_spend:.4f}")
    return 0


def main() -> int:
    _enforce_python()
    parser = argparse.ArgumentParser(description="LLM divergence harness")
    parser.add_argument("--config", required=True, help="Path to YAML config")
    parser.add_argument("--provider", default=None, help="Filter to one provider")
    parser.add_argument("--dry-run", action="store_true", help="Plan only; no requests")
    parser.add_argument("--resume", action="store_true", help="Resume by topping up incomplete cells (default behavior)")
    args = parser.parse_args()
    return asyncio.run(_main(args))


if __name__ == "__main__":
    sys.exit(main())
