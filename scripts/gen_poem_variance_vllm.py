import json
import os
import time

os.environ["VLLM_BATCH_INVARIANT"] = "1"

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
    runs.append({"index": i, "lines": lines, "latencyMs": total_ms / N_RUNS})

payload = {
    "prompt": PROMPT,
    "model": MODEL,
    "savedAt": __import__("datetime").datetime.utcnow().isoformat() + "Z",
    "runs": runs,
}

with open("/workspace/poem_variance_vllm.json", "w") as f:
    json.dump(payload, f, indent="\t")

unique = len(set(" / ".join(r["lines"]) for r in runs))
print(f"\n[poem-variance-vllm] total={len(runs)}, unique_variations={unique}")
print("Saved to /workspace/poem_variance_vllm.json")