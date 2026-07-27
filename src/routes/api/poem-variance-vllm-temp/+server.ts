import { readFile } from 'node:fs/promises';

import { json } from '@sveltejs/kit';
import { VLLM_TEMP_PATHS, type TempSavedResponse } from '$lib/server/poem-variance-shared';
import type { RequestHandler } from './$types';

// Same self-hosted vLLM setup as poem-variance-vllm, but sweeping temperature
// (0.3 / 0.7 / 1.0) with a fixed seed to show batch-invariant determinism
// holds even as sampling gets noisier — committed data, no live route.
export const prerender = true;

export const GET: RequestHandler = async () => {
	try {
		const entries = await Promise.all(
			(Object.entries(VLLM_TEMP_PATHS) as [string, string][]).map(async ([, filePath]) => {
				const raw = await readFile(filePath, 'utf-8');
				return JSON.parse(raw) as TempSavedResponse;
			})
		);
		entries.sort((a, b) => a.temperature - b.temperature);
		return json({ temps: entries });
	} catch {
		return json({ error: 'No saved results yet.' }, { status: 404 });
	}
};
