import json
import os
import random
import sys
import time

BATCH_INVARIANT = sys.argv[1] if len(sys.argv) > 1 else "on"
os.environ["VLLM_BATCH_INVARIANT"] = "1" if BATCH_INVARIANT == "on" else "0"

from vllm import LLM, SamplingParams

MODEL = "meta-llama/Llama-3.1-8B-Instruct"
NEEDLE_PROMPT = "Write a highly creative four-line poem about a clock that counts backward."
N_TRIALS = 30
MIN_BATCH = 8
MAX_BATCH = 96
SEED = 12345

random.seed(SEED)

# Varied-length filler prompts, standing in for "other users' concurrent
# requests" — heterogeneous shapes are what actually drive kernel/algorithm
# selection variance, unlike the earlier all-identical-prompts test.
FILLER_TEMPLATES = [
	"Question: What is the capital of France?\nAnswer: The capital of France is",
	"Q: How does photosynthesis work?\nA: Photosynthesis is the process by which",
	"Once upon a time in a distant galaxy, there lived",
	"The old man walked slowly down the street, remembering",
	"To implement a binary search tree in Python, first we need to",
	"The Renaissance was a period in European history that",
	"Climate change is caused by several factors including",
	"I've been thinking about getting a new laptop because",
	"My favorite thing about summer is definitely",
	"The human brain contains approximately 86 billion neurons which",
]
PAD = " This is additional context to vary the prompt length for batching purposes."


def random_filler() -> str:
	base = random.choice(FILLER_TEMPLATES)
	pad_count = random.randint(0, 40)
	return base + PAD * pad_count


llm = LLM(
	model=MODEL,
	max_num_seqs=128,
	gpu_memory_utilization=0.85,
	max_model_len=4096,
	attention_config={"backend": "FLASH_ATTN"},
)

sampling = SamplingParams(temperature=0.0, max_tokens=200, seed=42)

needle_runs = []
t0 = time.perf_counter()
for trial in range(N_TRIALS):
	batch_size = random.randint(MIN_BATCH, MAX_BATCH)
	needle_pos = random.randint(0, batch_size - 1)
	prompts = [random_filler() for _ in range(batch_size)]
	prompts[needle_pos] = NEEDLE_PROMPT

	outputs = llm.generate(prompts, sampling)
	needle_out = outputs[needle_pos]
	text = needle_out.outputs[0].text.strip()
	lines = [ln.strip() for ln in text.split("\n") if ln.strip()]

	needle_runs.append(
		{
			"index": trial,
			"batchSize": batch_size,
			"needlePosition": needle_pos,
			"lines": lines,
		}
	)
	print(f"[trial {trial}] batch_size={batch_size} needle_pos={needle_pos}")

total_ms = (time.perf_counter() - t0) * 1000

unique = len(set(" / ".join(r["lines"]) for r in needle_runs))
payload = {
	"prompt": NEEDLE_PROMPT,
	"model": MODEL,
	"batchInvariant": BATCH_INVARIANT == "on",
	"savedAt": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
	"totalWallMs": total_ms,
	"trials": N_TRIALS,
	"uniqueVariations": unique,
	"runs": needle_runs,
}

out_path = f"/workspace/poem_needle_vllm_{BATCH_INVARIANT}.json"
with open(out_path, "w") as f:
	json.dump(payload, f, indent="\t")

print(f"\n[poem-needle-vllm] batch_invariant={BATCH_INVARIANT}")
print(f"trials={N_TRIALS}, unique_variations={unique}, total_wall_ms={total_ms:.1f}")
print(f"Saved to {out_path}")
