# Defeating Non-Determinism

Talk deck + demos for "Why Exactly LLMs Are Non-Deterministic (And Can We Tame This Probabilistic Beast?)", built with SvelteKit. A couple of the live demos also need a small backend.

## Prerequisites

- Node.js 18+ and npm
- Python 3.10+ (only needed for the live GPT-2 determinism demo)

## Frontend (SvelteKit)

```sh
npm install
npm run dev
# or start the server and open the app in a new browser tab
npm run dev -- --open
```

The talk deck is served at `/talk` (e.g. `http://localhost:5173/talk`).

### API keys (optional)

Some demos (the Groq / Anthropic poem-variance demos) call SvelteKit server routes under `src/routes/api/` that need API keys. Copy `.env.example` to `.env` and fill in what you need:

```sh
cp .env.example .env
```

```
ANTHROPIC_API_KEY=
GROQ_API_KEY=
```

Demos that ship with saved/recorded data will still work without keys — you only need them to re-run the live calls.

### Building

```sh
npm run build
npm run preview   # preview the production build
```

## Backend (FastAPI, for the live GPT-2 demo)

`LiveDeterminismDemo` (the "run it twice, compare logits" demo) calls a local FastAPI server at `http://localhost:8765`. To run it:

```sh
cd server
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8765
```

This downloads and serves `gpt2` via Hugging Face `transformers`/`torch` on first run. Leave it running in a separate terminal while the frontend dev server is up — the rest of the talk works fine without it, but that one demo will show a connection error if the backend isn't running.

## Tests

```sh
npm test
```
