#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import random
import sys
import time
from itertools import combinations
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[2]
HARNESS_DIR = Path(__file__).resolve().parent
RAW_DIR = PROJECT_ROOT / "data" / "divergence" / "raw"
OUT_PATH = PROJECT_ROOT / "data" / "divergence" / "divergence-data.json"
CSS_PARTIAL = HARNESS_DIR / "_report-shared.css.txt"

HARNESS_VERSION = "0.1.0"
DATA_MARKER = "/* DATA_JSON_INJECT */"
CSS_MARKER = "/* CSS_PARTIAL_INJECT */"
MAX_PAIRS = 1225


def _load_rows(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except Exception:
                continue
    return rows


def _group_cells(raw_dir: Path) -> dict[str, list[dict[str, Any]]]:
    cells: dict[str, list[dict[str, Any]]] = {}
    for jl in sorted(raw_dir.glob("*.jsonl")):
        rows = _load_rows(jl)
        if not rows:
            continue
        key = jl.stem
        cells[key] = rows
    return cells


def _first_divergence(a: list, b: list) -> int:
    n = min(len(a), len(b))
    for i in range(n):
        if a[i] != b[i]:
            return i
    return n


def _pairwise_cdf(seqs: list[list]) -> list[dict[str, float]]:
    n = len(seqs)
    if n < 2:
        return []
    pairs = list(combinations(range(n), 2))
    if len(pairs) > MAX_PAIRS:
        rnd = random.Random(0)
        pairs = rnd.sample(pairs, MAX_PAIRS)
    idxs = [_first_divergence(seqs[i], seqs[j]) for i, j in pairs]
    idxs.sort()
    total = len(idxs)
    cdf: list[dict[str, float]] = []
    for rank, v in enumerate(idxs, start=1):
        cdf.append({"x": v, "p": rank / total})
    return cdf


def _build_trie(seqs: list[list], min_count: int = 2) -> dict[str, Any]:
    root: dict[str, Any] = {"count": len(seqs), "children": {}}
    for seq in seqs:
        node = root
        for tok in seq:
            key = repr(tok)
            ch = node["children"].setdefault(key, {"token": tok, "count": 0, "children": {}})
            ch["count"] += 1
            node = ch

    def _prune(node: dict[str, Any]) -> dict[str, Any]:
        kept: dict[str, Any] = {}
        for k, ch in node["children"].items():
            if ch["count"] < min_count:
                continue
            kept[k] = _prune(ch)
        node["children"] = kept
        if len(node["children"]) == 1:
            only_key = next(iter(node["children"]))
            only = node["children"][only_key]
            chain_tokens = [only["token"]]
            cur = only
            while len(cur["children"]) == 1:
                k2 = next(iter(cur["children"]))
                cur = cur["children"][k2]
                chain_tokens.append(cur["token"])
            if len(chain_tokens) > 1:
                collapsed = {
                    "token": f"{chain_tokens[0]!r}…+{len(chain_tokens) - 1}",
                    "count": only["count"],
                    "children": cur["children"],
                }
                node["children"] = {repr(collapsed["token"]): collapsed}
        return node

    return _prune(root)


def _lcp_depths(seqs: list[list]) -> list[int]:
    n_ok = len(seqs)
    if n_ok == 0:
        return []
    threshold = n_ok // 2 + 1
    depths: list[int] = []
    max_len = max((len(s) for s in seqs), default=0)
    common_path: list = []
    for d in range(max_len):
        counts: dict[Any, int] = {}
        for s in seqs:
            if d < len(s) and (d == 0 or _seq_matches_prefix(s, common_path)):
                counts[s[d]] = counts.get(s[d], 0) + 1
        if not counts:
            break
        best_tok, best_count = max(counts.items(), key=lambda kv: kv[1])
        if best_count >= threshold:
            common_path.append(best_tok)
        else:
            break
    majority_depth = len(common_path)
    for s in seqs:
        run_depth = 0
        for i in range(min(len(s), majority_depth)):
            if s[i] == common_path[i]:
                run_depth += 1
            else:
                break
        depths.append(run_depth)
    return depths


def _seq_matches_prefix(seq: list, prefix: list) -> bool:
    if len(seq) < len(prefix):
        return False
    for i, p in enumerate(prefix):
        if seq[i] != p:
            return False
    return True


def _validate_schema(out: dict[str, Any]) -> None:
    if not isinstance(out, dict):
        raise ValueError("output must be dict")
    for key in ("cells", "generated_at", "harness_version"):
        if key not in out:
            raise ValueError(f"missing key: {key}")
    if not isinstance(out["cells"], list):
        raise ValueError("cells must be list")
    for c in out["cells"]:
        for key in ("model", "prompt_id", "temperature", "unit", "n_ok", "n_excluded"):
            if key not in c:
                raise ValueError(f"cell missing key: {key}")


def _parse_key(stem: str) -> dict[str, str]:
    parts = stem.split("__")
    if len(parts) < 4:
        return {"model": stem, "prompt_id": "?", "temperature": "0.0", "cfg8": "?"}
    return {
        "model": parts[0],
        "prompt_id": parts[1],
        "temperature": parts[2].lstrip("t"),
        "cfg8": parts[3],
    }


def _analyze_cells(cells_map: dict[str, list[dict[str, Any]]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for key, rows in cells_map.items():
        meta = _parse_key(key)
        status_counts: dict[str, int] = {}
        for r in rows:
            s = r.get("status", "unknown")
            status_counts[s] = status_counts.get(s, 0) + 1
        ok_rows = [r for r in rows if r.get("status") == "ok"]
        n_ok = len(ok_rows)
        n_excluded = len(rows) - n_ok
        seqs = [list(r.get("tokens") or []) for r in ok_rows]
        mean_len = sum(len(s) for s in seqs) / max(1, n_ok)
        tv = (ok_rows[0].get("tokenizer_version") if ok_rows else "") or ""
        unit = "token"
        if tv.startswith("utf8-codepoint") or "codepoint" in tv:
            unit = "codepoint"
        elif tv.startswith("utf8-byte"):
            unit = "byte"
        prompt_text = ""
        provider = ""
        if ok_rows:
            provider_hint = ok_rows[0].get("api_version", "")
            if "gemini" in provider_hint:
                provider = "gemini"
            elif "groq" in provider_hint:
                provider = "groq"
            elif "ollama" in provider_hint:
                provider = "ollama"

        cell_out: dict[str, Any] = {
            "model": meta["model"],
            "provider": provider,
            "prompt_id": meta["prompt_id"],
            "prompt_text": prompt_text,
            "category": "",
            "temperature": float(meta["temperature"]),
            "unit": unit,
            "n_ok": n_ok,
            "n_excluded": n_excluded,
            "status_counts": status_counts,
            "mean_len": mean_len,
            "cdf_pairwise": _pairwise_cdf(seqs),
            "lcp_depths": _lcp_depths(seqs),
            "tree": _build_trie(seqs),
            "cfg8": meta["cfg8"],
        }

        if provider == "gemini" and ok_rows:
            texts = [r.get("text", "") for r in ok_rows]
            byte_seqs = [list(t.encode("utf-8")) for t in texts]
            cp_seqs = [[ord(c) for c in t] for t in texts]
            cell_out["cdf_byte"] = _pairwise_cdf(byte_seqs)
            cell_out["cdf_codepoint"] = _pairwise_cdf(cp_seqs)
            cell_out["tree_byte"] = _build_trie(byte_seqs)
            cell_out["tree_codepoint"] = _build_trie(cp_seqs)

        out.append(cell_out)
    return out


def _inject_html(html_path: Path, data_json: str, css_partial: str) -> None:
    if not html_path.exists():
        print(f"[analyze] skip inject; missing {html_path}")
        return
    txt = html_path.read_text(encoding="utf-8")
    if DATA_MARKER in txt:
        txt = txt.replace(DATA_MARKER, f"window.DIVERGENCE_DATA = {data_json};")
    if CSS_MARKER in txt and css_partial:
        txt = txt.replace(CSS_MARKER, css_partial)
    html_path.write_text(txt, encoding="utf-8")
    print(f"[analyze] injected -> {html_path}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Divergence data analyzer")
    parser.add_argument("--in", dest="in_dir", default=str(RAW_DIR))
    parser.add_argument("--out", dest="out_path", default=str(OUT_PATH))
    parser.add_argument("--emit-html", nargs="*", default=[])
    args = parser.parse_args()

    raw_dir = Path(args.in_dir).resolve()
    out_path = Path(args.out_path).resolve()
    cells_map = _group_cells(raw_dir)
    print(f"[analyze] {len(cells_map)} cells from {raw_dir}")
    cells = _analyze_cells(cells_map)

    out = {
        "cells": cells,
        "generated_at": time.time(),
        "harness_version": HARNESS_VERSION,
    }
    _validate_schema(out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[analyze] wrote {out_path}")

    if args.emit_html:
        css_partial = CSS_PARTIAL.read_text(encoding="utf-8") if CSS_PARTIAL.exists() else ""
        data_json = json.dumps(out, ensure_ascii=False)
        for html in args.emit_html:
            _inject_html(Path(html).resolve(), data_json, css_partial)

    return 0


if __name__ == "__main__":
    sys.exit(main())
