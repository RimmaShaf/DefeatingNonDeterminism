import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { json } from '@sveltejs/kit';
import Anthropic from '@anthropic-ai/sdk';
import { env } from '$env/dynamic/private';
import {
	ANTHROPIC_MODEL,
	ANTHROPIC_SAVED_PATH,
	MAX_RUNS,
	PROMPT,
	type RunResult,
	type SavedResponse
} from '$lib/server/poem-variance-shared';
import type { RequestHandler } from './$types';

// Live reruns: real API calls, localhost only. This route is intentionally
// excluded from the static GitHub Pages build (adapter strict: false).

const CONCURRENCY = 10;

async function runOne(client: Anthropic, index: number): Promise<RunResult> {
	const t0 = performance.now();
	try {
		const message = await client.messages.create({
			model: ANTHROPIC_MODEL,
			max_tokens: 200,
			temperature: 0,
			thinking: { type: 'disabled' },
			messages: [{ role: 'user', content: PROMPT }]
		});
		const text = message.content
			.filter((block) => block.type === 'text')
			.map((block) => block.text)
			.join('')
			.trim();
		const lines = text
			.split('\n')
			.map((line) => line.trim())
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
	if (!env.ANTHROPIC_API_KEY) {
		return json({ error: 'ANTHROPIC_API_KEY is not set on the server' }, { status: 500 });
	}

	const body = await request.json().catch(() => ({}));
	const requested = Number(body?.runs) || MAX_RUNS;
	const runs = Math.max(1, Math.min(MAX_RUNS, requested));

	const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

	const results: RunResult[] = [];
	for (let start = 0; start < runs; start += CONCURRENCY) {
		const batch = Array.from(
			{ length: Math.min(CONCURRENCY, runs - start) },
			(_, i) => start + i
		);
		const batchResults = await Promise.all(batch.map((index) => runOne(client, index)));
		results.push(...batchResults);
	}

	const payload: SavedResponse = {
		prompt: PROMPT,
		model: ANTHROPIC_MODEL,
		savedAt: new Date().toISOString(),
		runs: results
	};

	// Persist only runs where at least one call succeeded, so a broken run
	// (bad key, network down) doesn't clobber a good saved result.
	if (results.some((r) => !r.error)) {
		try {
			await mkdir(path.dirname(ANTHROPIC_SAVED_PATH), { recursive: true });
			await writeFile(ANTHROPIC_SAVED_PATH, JSON.stringify(payload, null, '\t'), 'utf-8');
		} catch (e) {
			console.error('poem-variance: failed to save results:', e);
		}
	}

	return json(payload);
};
