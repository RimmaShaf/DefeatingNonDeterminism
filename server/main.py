import time
from contextlib import asynccontextmanager

import torch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer

MODEL_NAME = "gpt2"
state: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    state["tokenizer"] = AutoTokenizer.from_pretrained(MODEL_NAME)
    state["model"] = AutoModelForCausalLM.from_pretrained(MODEL_NAME)
    state["model"].eval()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_methods=["*"],
    allow_headers=["*"],
)


class CheckRequest(BaseModel):
    prompt: str = "The real meaning of life is"


def top_k_tokens(logits: torch.Tensor, tokenizer, k: int = 5):
    last_step = logits[0, -1]
    probs = torch.softmax(last_step, dim=-1)
    top_probs, top_ids = torch.topk(probs, k)
    return [
        {"token": tokenizer.decode([tid]), "prob": float(p)}
        for tid, p in zip(top_ids.tolist(), top_probs.tolist())
    ]


@app.post("/api/check")
def check(req: CheckRequest):
    tokenizer = state["tokenizer"]
    model = state["model"]

    inputs = tokenizer(req.prompt, return_tensors="pt")

    t0 = time.perf_counter()
    with torch.no_grad():
        logits_1 = model(**inputs).logits
    t1 = time.perf_counter()
    with torch.no_grad():
        logits_2 = model(**inputs).logits
    t2 = time.perf_counter()

    identical = torch.equal(logits_1, logits_2)
    max_abs_diff = float((logits_1 - logits_2).abs().max())

    last_1 = logits_1[0, -1]
    last_2 = logits_2[0, -1]

    return {
        "prompt": req.prompt,
        "identical": identical,
        "maxAbsDiff": max_abs_diff,
        "logitsShape": list(logits_1.shape),
        "latencyMsPass1": (t1 - t0) * 1000,
        "latencyMsPass2": (t2 - t1) * 1000,
        "sampleLogitsPass1": last_1[:8].tolist(),
        "sampleLogitsPass2": last_2[:8].tolist(),
        "topTokensPass1": top_k_tokens(logits_1, tokenizer),
        "topTokensPass2": top_k_tokens(logits_2, tokenizer),
    }


@app.get("/api/health")
def health():
    return {"status": "ok", "model": MODEL_NAME}
