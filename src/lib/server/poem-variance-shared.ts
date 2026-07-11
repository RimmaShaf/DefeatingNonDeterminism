import path from 'node:path';

// Shared between the prerendered GET endpoints (saved-results replay) and the
// localhost-only POST endpoints (live reruns) for both providers.

export const PROMPT =
	'Write a highly creative four-line poem about a clock that counts backward.';
export const MAX_RUNS = 100;

export const ANTHROPIC_MODEL = 'claude-sonnet-4-6';
export const GROQ_MODEL = 'openai/gpt-oss-120b';

export const ANTHROPIC_SAVED_PATH = path.join(
	process.cwd(),
	'data',
	'poem-variance',
	'latest.json'
);
export const GROQ_SAVED_PATH = path.join(process.cwd(), 'data', 'poem-variance-groq', 'latest.json');

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
