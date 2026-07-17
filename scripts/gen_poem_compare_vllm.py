import json
import os
import sys
import time

# Must be set before importing vllm — it's read at import time.
BATCH_INVARIANT = sys.argv[1] if len(sys.argv) > 1 else "on"
os.environ["VLLM_BATCH_INVARIANT"] = "1" if BATCH_INVARIANT == "on" else "0"

from vllm import LLM, SamplingParams

MODEL = "meta-llama/Llama-3.1-8B-Instruct"
PROMPT = "Write a highly creative four-line poem about a clock that counts backward."
N_RUNS = 100

llm = LLM(
    model=MODEL,
    max_num_seqs=128,
    gpu_memory_utilization=0.85,
    max_model_len=2048,
    attention_config={"backend": "FLASH_ATTN"},
)

sampling = SamplingParams(temperature=0.0, max_tokens=200, seed=42)

t0 = time.perf_counter()
outputs = llm.generate([PROMPT] * N_RUNS, sampling)
total_ms = (time.perf_counter() - t0) * 1000

runs = []
for i, out in enumerate(outputs):
    text = out.outputs[0].text.strip()
    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
    m = out.metrics
    latency_ms = (m.finished_time - m.arrival_time) * 1000 if m else total_ms / N_RUNS
    runs.append({"index": i, "lines": lines, "latencyMs": latency_ms})

payload = {
    "prompt": PROMPT,
    "model": MODEL,
    "batchInvariant": BATCH_INVARIANT == "on",
    "savedAt": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
    "totalWallMs": total_ms,
    "runs": runs,
}

out_path = f"/workspace/poem_variance_vllm_{BATCH_INVARIANT}.json"
with open(out_path, "w") as f:
    json.dump(payload, f, indent="\t")

unique = len(set(" / ".join(r["lines"]) for r in runs))
avg_latency = sum(r["latencyMs"] for r in runs) / len(runs)
print(f"\n[poem-variance-vllm] batch_invariant={BATCH_INVARIANT}")
print(f"total={len(runs)}, unique_variations={unique}")
print(f"total_wall_ms={total_ms:.1f}, avg_per_request_latency_ms={avg_latency:.1f}")
print(f"Saved to {out_path}")
PYEOF