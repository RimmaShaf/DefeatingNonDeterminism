import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const SAVED_PATH = path.join(process.cwd(), 'data', 'live-determinism', 'latest.json');

// Committed replay of the GPT-2 live demo (server/main.py) for when the talk
// venue can't be trusted to have a local PyTorch server reachable — same
// data shape as a live /api/check response, just pre-recorded.
export const prerender = true;

export const GET: RequestHandler = async () => {
	try {
		const raw = await readFile(SAVED_PATH, 'utf-8');
		return json(JSON.parse(raw));
	} catch {
		return json({ error: 'No saved results yet.' }, { status: 404 });
	}
};
