import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import {
	GROQ_MODEL,
	GROQ_SAVED_PATH,
	MAX_RUNS,
	PROMPT,
	type RunResult,
	type SavedResponse
} from '$lib/server/poem-variance-shared';
import type { RequestHandler } from './$types';

// Live reruns: real API calls, localhost only. This route is intentionally
// excluded from the static GitHub Pages build (adapter strict: false).

const SEED = 700;
// Groq free tier limits this model to 8000 tokens/min; each call is ~150 tokens,
// so pace batches to stay near ~45 calls/min instead of bursting into 429s.
const CONCURRENCY = 5;
const BATCH_PAUSE_MS = 6500;
const MAX_RETRIES = 3;

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runOne(apiKey: string, index: number): Promise<RunResult> {
	const t0 = performance.now();
	try {
		let data: { choices?: { message?: { content?: string } }[] } | undefined;
		for (let attempt = 0; ; attempt++) {
			const res = await fetch(GROQ_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${apiKey}`
				},
				body: JSON.stringify({
					model: GROQ_MODEL,
					// gpt-oss is a reasoning model: reasoning tokens share this budget,
					// so keep effort low and the budget generous or the poem gets cut off.
					max_completion_tokens: 1024,
					reasoning_effort: 'low',
					temperature: 0,
					seed: SEED,
					messages: [{ role: 'user', content: PROMPT }]
				})
			});
			if (res.status === 429 && attempt < MAX_RETRIES) {
				// TPM limit hit anyway — wait as long as Groq tells us to, then retry.
				const retryAfterSec = Number(res.headers.get('retry-after')) || 5;
				await res.body?.cancel();
				await sleep(retryAfterSec * 1000 + 250);
				continue;
			}
			if (!res.ok) {
				const body = await res.text().catch(() => '');
				throw new Error(`Groq HTTP ${res.status}: ${body.slice(0, 200)}`);
			}
			data = await res.json();
			break;
		}
		const text: string = (data?.choices?.[0]?.message?.content ?? '').trim();
		const lines = text
			.split('\n')
			.map((line: string) => line.trim())
			.filter(Boolean);
		return { index, lines, latencyMs: performance.now() - t0 };
	} catch (e) {
		return {
			index,
			lines: [],
			latencyMs: performance.now() - t0,
			error: e instanceof Error ? e.message : 'unknown error'
		};
	}
}

export const POST: RequestHandler = async ({ request }) => {
	if (!env.GROQ_API_KEY) {
		return json({ error: 'GROQ_API_KEY is not set on the server' }, { status: 500 });
	}

	const body = await request.json().catch(() => ({}));
	const requested = Number(body?.runs) || MAX_RUNS;
	const runs = Math.max(1, Math.min(MAX_RUNS, requested));

	const results: RunResult[] = [];
	for (let start = 0; start < runs; start += CONCURRENCY) {
		const batch = Array.from(
			{ length: Math.min(CONCURRENCY, runs - start) },
			(_, i) => start + i
		);
		const batchResults = await Promise.all(
			batch.map((index) => runOne(env.GROQ_API_KEY!, index))
		);
		results.push(...batchResults);
		if (start + CONCURRENCY < runs) await sleep(BATCH_PAUSE_MS);
	}

	const payload: SavedResponse = {
		prompt: PROMPT,
		model: GROQ_MODEL,
		savedAt: new Date().toISOString(),
		runs: results
	};

	// Persist only runs where at least one call succeeded, so a broken run
	// (bad key, network down) doesn't clobber a good saved result.
	if (results.some((r) => !r.error)) {
		try {
			await mkdir(path.dirname(GROQ_SAVED_PATH), { recursive: true });
			await writeFile(GROQ_SAVED_PATH, JSON.stringify(payload, null, '\t'), 'utf-8');
		} catch (e) {
			console.error('poem-variance-groq: failed to save results:', e);
		}
	}

	return json(payload);
};
