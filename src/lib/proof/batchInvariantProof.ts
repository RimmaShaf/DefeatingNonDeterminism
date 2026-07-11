import { roundToFloat16, roundToBfloat16, deterministicTreeReduce, nondeterministicReduce, type RoundFn } from '$lib/math';
import type { PrecisionMode } from '$lib/stores/simulation';

export interface ProofResult {
	maxAbsDiff: number;
	meanDiff: number;
	bitwiseEqual: boolean;
	runs: number;
	referenceResult: number;
}

function getRoundFn(mode: PrecisionMode): RoundFn {
	return mode === 'fp16' ? roundToFloat16 : roundToBfloat16;
}

function buildPayload(batchSize: number, round: RoundFn): number[] {
	const values: number[] = [];
	for (let i = 0; i < batchSize; i++) {
		values.push(round((i % 7) * 0.1 + 1.0));
	}
	return values;
}

export function runProof(
	batchSize: number,
	precisionMode: PrecisionMode,
	isBatchInvariant: boolean
): ProofResult {
	const round = getRoundFn(precisionMode);
	const values = buildPayload(batchSize, round);
	const RUNS = 16;

	const reference = isBatchInvariant
		? deterministicTreeReduce(values, round)
		: nondeterministicReduce(values, round, 0);

	const results: number[] = [reference];
	for (let seed = 1; seed < RUNS; seed++) {
		const r = isBatchInvariant
			? deterministicTreeReduce(values, round)
			: nondeterministicReduce(values, round, seed);
		results.push(r);
	}

	const diffs = results.map((r) => Math.abs(r - reference));
	const maxAbsDiff = Math.max(...diffs);
	const meanDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
	const bitwiseEqual = results.every((r) => r === reference);

	return { maxAbsDiff, meanDiff, bitwiseEqual, runs: RUNS, referenceResult: reference };
}
