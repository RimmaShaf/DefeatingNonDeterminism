import { readFile } from 'node:fs/promises';

import { json } from '@sveltejs/kit';
import { VLLM_SAVED_PATH, type SavedResponse } from '$lib/server/poem-variance-shared';
import type { RequestHandler } from './$types';

// Prerendered into a static JSON file for the GitHub Pages build. Unlike the
// Anthropic/Groq demos, there is no ./live route: the vLLM server runs on an
// ephemeral RunPod GPU pod whose address changes on every restart, so this
// demo only ever replays the committed saved run.
export const prerender = true;

export const GET: RequestHandler = async () => {
	try {
		const raw = await readFile(VLLM_SAVED_PATH, 'utf-8');
		const saved: SavedResponse = JSON.parse(raw);
		return json(saved);
	} catch {
		return json({ error: 'No saved results yet — do a live run first.' }, { status: 404 });
	}
};
