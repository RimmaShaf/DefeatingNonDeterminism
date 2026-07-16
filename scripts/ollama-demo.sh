#!/usr/bin/env bash
# Ollama determinism demo: divergence at temperature=0, then convergence with pinned settings.
# Usage: scripts/ollama-demo.sh [MODEL] [NUM_PREDICT]
set -euo pipefail

MODEL="${1:-gemma4:latest}"
NUM_PREDICT="${2:-200}"
PROMPT="Write a 200-word story about a GPU that dreams of being deterministic."
API="http://localhost:11434/api/generate"

if command -v jq >/dev/null 2>&1; then
	extract() { jq -r '.response'; }
	escape_json() { jq -Rs .; }
elif command -v python3 >/dev/null 2>&1; then
	extract() { python3 -c 'import json,sys; print(json.load(sys.stdin)["response"])'; }
	escape_json() { python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))'; }
else
	echo "FATAL: neither jq nor python3 available to parse JSON" >&2
	exit 1
fi

PROMPT_JSON="$(printf '%s' "$PROMPT" | escape_json)"

if ! curl -sf "http://localhost:11434/api/tags" >/dev/null; then
	echo "FATAL: Ollama server not reachable at localhost:11434 (run 'ollama serve')" >&2
	exit 1
fi

TMPDIR_DEMO="$(mktemp -d)"
trap 'rm -rf "$TMPDIR_DEMO"' EXIT

request() {
	# $1 = output file, $2 = extra options JSON fragment (may be empty)
	local out="$1" extra="${2:-}"
	local opts="\"temperature\": 0, \"num_predict\": ${NUM_PREDICT}"
	if [[ -n "$extra" ]]; then
		opts="${opts}, ${extra}"
	fi
	local response
	response="$(curl -s "$API" -d "{
		\"model\": \"${MODEL}\",
		\"prompt\": ${PROMPT_JSON},
		\"stream\": false,
		\"think\": false,
		\"options\": { ${opts} }
	}" | extract)"
	if [[ -z "$response" ]]; then
		echo "FATAL: empty response from model ${MODEL} (check num_predict/thinking mode)" >&2
		exit 1
	fi
	printf '%s\n' "$response" > "$out"
}

verdict() {
	# $1 = stage name, $2/$3 = files
	local h1 h2
	h1="$(shasum -a 256 "$2" | cut -d' ' -f1)"
	h2="$(shasum -a 256 "$3" | cut -d' ' -f1)"
	echo "--- $1 output A (first 5 lines) ---"
	head -5 "$2"
	echo "--- $1 output B (first 5 lines) ---"
	head -5 "$3"
	echo "sha256 A: $h1"
	echo "sha256 B: $h2"
	if [[ "$h1" == "$h2" ]]; then
		echo "$1: IDENTICAL"
	else
		echo "$1: DIVERGED"
	fi
}

echo "=== STAGE 1: DIVERGENCE (temperature=0, no seed, concurrent requests) ==="
request "$TMPDIR_DEMO/s1a.txt" "" &
PID_A=$!
request "$TMPDIR_DEMO/s1b.txt" "" &
PID_B=$!
wait "$PID_A" "$PID_B"
verdict "STAGE1" "$TMPDIR_DEMO/s1a.txt" "$TMPDIR_DEMO/s1b.txt"

echo
echo "=== STAGE 2: CONVERGENCE (temperature=0, seed=42, num_thread=4, sequential) ==="
request "$TMPDIR_DEMO/s2a.txt" "\"seed\": 42, \"num_thread\": 4"
request "$TMPDIR_DEMO/s2b.txt" "\"seed\": 42, \"num_thread\": 4"
verdict "STAGE2" "$TMPDIR_DEMO/s2a.txt" "$TMPDIR_DEMO/s2b.txt"
