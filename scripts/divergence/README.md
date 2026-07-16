# LLM Output Divergence Experiment — Harness

Source-of-truth plan: `/Users/rimma/Documents/vibe-coding/DefeatingNonDeterminism/.omc/plans/divergence-experiment.md`.

This directory holds the Python harness that produces the JSONL raw data and
the analyzed `divergence-data.json` consumed by the two HTML reports
(`divergence-cdf.html`, `divergence-tree.html`) at the repo root.

## Requirements

- Python **3.11 or 3.12** (enforced at startup; 3.13+ and ≤3.10 will exit).
- `ollama` daemon running locally (already installed at `/usr/local/bin/ollama`).
- Optional: `GEMINI_API_KEY` and/or `GROQ_API_KEY` env vars.

## Install

```bash
cd scripts/divergence
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Model substitution from plan

The consensus plan nominates `llama3.1:8b` and `qwen2.5:7b`. This machine has
the following pulled instead, and the baseline config uses them:

| Plan nominal       | Used here                       |
|--------------------|----------------------------------|
| `llama3.1:8b`      | `gemma4:latest` (9.6 GB)         |
| `qwen2.5:7b`       | `gemma3:27b` (17 GB)             |
| (additional)       | `llama3.3:70b-instruct-q2_K`, `llama3.3:70b` available — commented out |

Cells are model-isolated by design (per-provider small-multiples; no cross-model
chart), so the substitution does not invalidate any metric.

## Workflow

```bash
# 1. dry-run to see planned cells and cfg8 hashes
python scripts/divergence/run_divergence.py \
    --config scripts/divergence/configs/baseline.yaml --dry-run

# 2. full run (ollama-only by default)
python scripts/divergence/run_divergence.py \
    --config scripts/divergence/configs/baseline.yaml

# 3. analyze raw -> JSON + inject into HTML reports
python scripts/divergence/analyze.py \
    --in data/divergence/raw \
    --out data/divergence/divergence-data.json \
    --emit-html divergence-cdf.html divergence-tree.html

open divergence-cdf.html divergence-tree.html
```

## Adding Gemini / Groq cells

Uncomment the corresponding entries in `configs/baseline.yaml`, export the API
key, then re-run. The harness is resumable per `(cell, cfg8)`: it counts
existing `status=="ok"` rows and tops up.

**Groq free tier** caps at **30 RPM** ⇒ 100 runs/cell ≈ 3.5 min/cell. The
expected wall-clock is printed at startup so you can decide whether to upgrade
to paid before running. Paid tier removes the RPM ceiling but adds ~$0.10/cell
at 200 max-tokens.

**Gemini 2.5 Flash** runs concurrently with semaphore=8; baseline cost ≈ $0.04
total. Gemini does not accept a seed — `seed_scheme="unset"` is baked into the
`cfg8` so future seed-aware variants won't collide.

## Tokenizer notes

For Ollama we use HuggingFace `AutoTokenizer` keyed on a mapping table
(`OLLAMA_TO_HF` in `tok.py`). Some HF repos are **gated** — you'll need to
`huggingface-cli login` and accept the model card terms. If the tokenizer load
fails (gated, offline, missing), the harness logs a warning and falls back to
UTF-8 codepoint indices with `tokenizer_version="codepoint-fallback"`. The
harness never crashes on tokenizer issues.

Gemini exposes no token IDs; we record both UTF-8 byte indices and Unicode
codepoint indices in the analyzer so the report can overlay both CDFs.

## Stretch config

`configs/stretch.yaml` runs 20 prompts (5 per category) for higher statistical
power. **Gated** on the baseline shipping cleanly with budget unspent.

## Layout

```
scripts/divergence/
  requirements.txt
  configs/{baseline,stretch}.yaml
  config_hash.py    pacing.py    tok.py
  providers/{__init__,ollama,gemini,groq}.py
  run_divergence.py
  analyze.py
  _report-shared.css.txt
  README.md
data/divergence/
  raw/*.jsonl         (gitignored)
  divergence-data.json
  .gitignore
```
