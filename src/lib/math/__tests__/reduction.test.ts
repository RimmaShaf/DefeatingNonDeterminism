import { describe, expect, it } from 'vitest';

import { roundToFloat16 } from '$lib/math/float16';
import { roundToBfloat16 } from '$lib/math/bf16';
import { deterministicTreeReduce, nondeterministicReduce } from '$lib/math/reduction';
import { runProof } from '$lib/proof/batchInvariantProof';

describe('deterministicTreeReduce', () => {
	it('produces same result for same inputs', () => {
		const values = [1, 2, 3, 4, 5, 6, 7, 8];
		const r1 = deterministicTreeReduce(values, roundToFloat16);
		const r2 = deterministicTreeReduce(values, roundToFloat16);
		expect(r1).toBe(r2);
	});

	it('throws on empty array', () => {
		expect(() => deterministicTreeReduce([], roundToFloat16)).toThrow();
	});

	it('returns single value unchanged', () => {
		expect(deterministicTreeReduce([42], roundToFloat16)).toBe(42);
	});
});

describe('nondeterministicReduce', () => {
	it('same seed produces same result', () => {
		const values = [1, 2, 3, 4, 5, 6, 7, 8];
		const r1 = nondeterministicReduce(values, roundToFloat16, 99);
		const r2 = nondeterministicReduce(values, roundToFloat16, 99);
		expect(r1).toBe(r2);
	});

	it('different seeds may produce different results for non-associative inputs', () => {
		const values = [1e4, 1, -1e4, 0.5, 1e4, -1e4, 1, 0.25];
		const results = new Set<number>();
		for (let s = 0; s < 20; s++) {
			results.add(nondeterministicReduce(values, roundToFloat16, s));
		}
		expect(results.size).toBeGreaterThan(1);
	});

	it('throws on empty array', () => {
		expect(() => nondeterministicReduce([], roundToFloat16, 0)).toThrow();
	});
});

describe('runProof - invariant mode', () => {
	it('returns maxAbsDiff=0 and bitwiseEqual=true when isBatchInvariant=true', () => {
		const result = runProof(32, 'fp16', true);
		expect(result.maxAbsDiff).toBe(0);
		expect(result.bitwiseEqual).toBe(true);
	});

	it('invariant bf16 mode is also deterministic', () => {
		const result = runProof(16, 'bf16', true);
		expect(result.maxAbsDiff).toBe(0);
		expect(result.bitwiseEqual).toBe(true);
	});
});

describe('runProof - non-invariant mode', () => {
	it('returns a finite referenceResult', () => {
		const result = runProof(32, 'fp16', false);
		expect(Number.isFinite(result.referenceResult)).toBe(true);
	});
});
