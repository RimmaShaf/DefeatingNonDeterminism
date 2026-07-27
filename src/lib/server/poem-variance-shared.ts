import path from 'node:path';

// Shared between the prerendered GET endpoints (saved-results replay) and the
// localhost-only POST endpoints (live reruns) for both providers.

export const PROMPT =
	'Write a highly creative four-line poem about a clock that counts backward.';
export const MAX_RUNS = 100;

export const ANTHROPIC_MODEL = 'claude-sonnet-4-6';
export const GROQ_MODEL = 'openai/gpt-oss-120b';
export const VLLM_MODEL = 'meta-llama/Llama-3.1-8B-Instruct';

export const ANTHROPIC_SAVED_PATH = path.join(
	process.cwd(),
	'data',
	'poem-variance',
	'latest.json'
);
export const GROQ_SAVED_PATH = path.join(process.cwd(), 'data', 'poem-variance-groq', 'latest.json');
export const VLLM_SAVED_PATH = path.join(process.cwd(), 'data', 'poem-variance-vllm', 'latest.json');
export const VLLM_NEEDLE_ON_PATH = path.join(
	process.cwd(),
	'data',
	'poem-variance-vllm',
	'needle-on.json'
);
export const VLLM_NEEDLE_OFF_PATH = path.join(
	process.cwd(),
	'data',
	'poem-variance-vllm',
	'needle-off.json'
);
export const VLLM_TEMP_PATHS = {
	'0.3': path.join(process.cwd(), 'data', 'poem-variance-vllm', 'temp-0.3.json'),
	'0.7': path.join(process.cwd(), 'data', 'poem-variance-vllm', 'temp-0.7.json'),
	'1.0': path.join(process.cwd(), 'data', 'poem-variance-vllm', 'temp-1.0.json')
} as const;

export type RunResult = {
	index: number;
	lines: string[];
	latencyMs: number;
	error?: string;
};

export type SavedResponse = {
	prompt: string;
	model: string;
	savedAt: string;
	runs: RunResult[];
};

export type TempSavedResponse = SavedResponse & {
	temperature: number;
	seed: number;
};

// The needle experiment mixes the poem prompt ("the needle") into a batch of
// heterogeneous filler prompts at a random position/batch size per trial —
// a harsher, more realistic stress test than the identical-batch run above.
export type NeedleRunResult = {
	index: number;
	batchSize: number;
	needlePosition: number;
	lines: string[];
};

export type NeedleSavedResponse = {
	prompt: string;
	model: string;
	batchInvariant: boolean;
	savedAt: string;
	totalWallMs: number;
	trials: number;
	uniqueVariations: number;
	runs: NeedleRunResult[];
};
