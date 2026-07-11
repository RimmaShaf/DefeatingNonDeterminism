import { writable } from 'svelte/store';

export type TalkModeState = {
	active: boolean;
	currentBeat: number;
	totalBeats: number;
};

const initialState: TalkModeState = {
	active: false,
	currentBeat: 1,
	totalBeats: 0
};

export const talkMode = writable<TalkModeState>(initialState);

export function initTalkMode(active: boolean, totalBeats: number): void {
	if (typeof active !== 'boolean') {
		throw new Error(`active must be boolean, got ${typeof active}`);
	}
	if (typeof totalBeats !== 'number') {
		throw new Error(`totalBeats must be a number, got ${typeof totalBeats}`);
	}
	if (!Number.isInteger(totalBeats)) {
		throw new Error(`totalBeats must be an integer, got ${String(totalBeats)}`);
	}
	if (totalBeats < 0 || Number.isNaN(totalBeats)) {
		throw new Error(`totalBeats must be >= 0, got ${String(totalBeats)}`);
	}
	talkMode.set({ active, currentBeat: 1, totalBeats });
}

export function setCurrentBeat(beat: number): void {
	if (!Number.isInteger(beat)) {
		throw new Error(`beat must be an integer, got ${String(beat)}`);
	}
	talkMode.update((s) => {
		if (beat < 1 || beat > s.totalBeats) {
			throw new Error(`beat must be in [1, ${String(s.totalBeats)}], got ${String(beat)}`);
		}
		return { ...s, currentBeat: beat };
	});
}
