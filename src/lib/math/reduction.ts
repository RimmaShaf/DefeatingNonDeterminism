export type RoundFn = (x: number) => number;

export function deterministicTreeReduce(values: number[], round: RoundFn): number {
	if (values.length === 0) throw new Error('deterministicTreeReduce: empty array');
	let level = [...values];
	while (level.length > 1) {
		const next: number[] = [];
		for (let i = 0; i < level.length; i += 2) {
			if (i + 1 < level.length) {
				next.push(round(level[i] + level[i + 1]));
			} else {
				next.push(level[i]);
			}
		}
		level = next;
	}
	return level[0];
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
	const copy = [...arr];
	let s = seed >>> 0;
	for (let i = copy.length - 1; i > 0; i--) {
		s = Math.imul(s, 1664525) + 1013904223;
		const j = (s >>> 0) % (i + 1);
		const tmp = copy[i];
		copy[i] = copy[j];
		copy[j] = tmp;
	}
	return copy;
}

/** Deterministic seeded permutation of [0..length-1] — the same shuffle used by nondeterministicReduce. */
export function seededOrder(length: number, seed: number): number[] {
	if (length <= 0 || !Number.isInteger(length)) {
		throw new Error(`seededOrder: length must be a positive integer, got ${String(length)}`);
	}
	return seededShuffle(
		Array.from({ length }, (_, i) => i),
		seed
	);
}

export function nondeterministicReduce(values: number[], round: RoundFn, seed: number): number {
	if (values.length === 0) throw new Error('nondeterministicReduce: empty array');
	const shuffled = seededShuffle(values, seed);
	return deterministicTreeReduce(shuffled, round);
}
