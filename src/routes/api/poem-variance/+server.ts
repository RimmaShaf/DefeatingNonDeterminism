import { readFile } from 'node:fs/promises';

import { json } from '@sveltejs/kit';
import { ANTHROPIC_SAVED_PATH, type SavedResponse } from '$lib/server/poem-variance-shared';
import type { RequestHandler } from './$types';

// Prerendered into a static JSON file for the GitHub Pages build, so
// "Show saved results" works with no server. Live reruns live at ./live,
// which only exists on localhost.
export const prerender = true;

export const GET: RequestHandler = async () => {
	try {
		const raw = await readFile(ANTHROPIC_SAVED_PATH, 'utf-8');
		const saved: SavedResponse = JSON.parse(raw);
		return json(saved);
	} catch {
		return json(
			{ error: 'No saved results yet — do a live run first.' },
			{ status: 404 }
		);
	}
};
