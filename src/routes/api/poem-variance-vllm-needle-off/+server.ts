import { readFile } from 'node:fs/promises';

import { json } from '@sveltejs/kit';
import { VLLM_NEEDLE_OFF_PATH, type NeedleSavedResponse } from '$lib/server/poem-variance-shared';
import type { RequestHandler } from './$types';

// Same needle experiment as ./needle-on, batch invariance OFF (default vLLM
// behavior) — committed data, no live route (see poem-variance-vllm/+server.ts).
export const prerender = true;

export const GET: RequestHandler = async () => {
	try {
		const raw = await readFile(VLLM_NEEDLE_OFF_PATH, 'utf-8');
		const saved: NeedleSavedResponse = JSON.parse(raw);
		return json(saved);
	} catch {
		return json({ error: 'No saved results yet.' }, { status: 404 });
	}
};
