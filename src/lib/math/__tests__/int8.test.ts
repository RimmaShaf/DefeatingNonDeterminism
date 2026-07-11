import { describe, expect, it } from 'vitest';

import { quantizeSymmetric, dequantize, quantizedDot } from '$lib/math/int8';

describe('quantizeSymmetric', () => {
	it('throws on empty row', () => {
		expect(() => quantizeSymmetric([])).toThrow('quantizeSymmetric: empty row');
	});

	it('throws on non-finite values', () => {
		expect(() => quantizeSymmetric([1, Infinity, 3])).toThrow('quantizeSymmetric: non-finite value');
		expect(() => quantizeSymmetric([NaN])).toThrow('quantizeSymmetric: non-finite value');
	});

	it('produces scale = maxAbs / 127', () => {
		const { scale } = quantizeSymmetric([0, 127, -127]);
		expect(scale).toBeCloseTo(1, 10);
	});

	it('quantizes correctly', () => {
		const { values, scale } = quantizeSymmetric([0, 64, -64, 127]);
		expect(scale).toBeCloseTo(1, 10);
		expect(Array.from(values)).toEqual([0, 64, -64, 127]);
	});
});

describe('dequantize', () => {
	it('is bit-exact and deterministic', () => {
		const int8 = new Int8Array([0, 64, -64, 127]);
		const scale = 1.0;
		const r1 = dequantize(int8, scale);
		const r2 = dequantize(int8, scale);
		expect(r1).toEqual(r2);
		// each result is v * scale in fp64 — check exact values
		expect(r1[0]).toBe(0);
		expect(r1[1]).toBe(64);
		expect(r1[2]).toBe(-64);
		expect(r1[3]).toBe(127);
	});

	it('round-trip through quantize preserves values approximately', () => {
		const row = [10, -20, 50, -100];
		const { values, scale } = quantizeSymmetric(row);
		const recovered = dequantize(values, scale);
		for (let i = 0; i < row.length; i++) {
			expect(Math.abs(recovered[i] - row[i])).toBeLessThan(scale);
		}
	});
});

describe('quantizedDot - accumulator divergence', () => {
	// Craft inputs that expose fp16 rounding non-associativity:
	// mixing large and small magnitudes causes order-dependent rounding,
	// while keeping every partial sum well below fp16 max (65504) to avoid overflow.
	// At accumulator value 2048 the fp16 ulp is 2, so adding 1 is absorbed
	// when the large value is accumulated first, but survives when added before it.

	const row = [1, 1, 1, 1];
	const { values: weightsInt8, scale } = quantizeSymmetric(row);
	const activations = [2048, 1, -2048, 0.5];
	const orderA = [0, 1, 2, 3]; // large, small, large-neg, small
	const orderB = [1, 3, 0, 2]; // small first, then large values

	it('fp16 accumulator: different order → different result', () => {
		const resultA = quantizedDot(weightsInt8, scale, activations, {
			accumulator: 'fp16',
			order: orderA
		});
		const resultB = quantizedDot(weightsInt8, scale, activations, {
			accumulator: 'fp16',
			order: orderB
		});
		// The two orders should give different results due to fp16 rounding
		expect(resultA).not.toBe(resultB);
	});

	it('fp32 accumulator: divergence is zero or strictly smaller than fp16 divergence', () => {
		const fp16A = quantizedDot(weightsInt8, scale, activations, {
			accumulator: 'fp16',
			order: orderA
		});
		const fp16B = quantizedDot(weightsInt8, scale, activations, {
			accumulator: 'fp16',
			order: orderB
		});
		const fp32A = quantizedDot(weightsInt8, scale, activations, {
			accumulator: 'fp32',
			order: orderA
		});
		const fp32B = quantizedDot(weightsInt8, scale, activations, {
			accumulator: 'fp32',
			order: orderB
		});

		const fp16Divergence = Math.abs(fp16A - fp16B);
		const fp32Divergence = Math.abs(fp32A - fp32B);

		expect(fp32Divergence).toBeLessThan(fp16Divergence);
	});
});

describe('quantizedDot - error handling', () => {
	const { values, scale } = quantizeSymmetric([1, 2, 3]);
	const activations = [1, 2, 3];

	it('throws when order is not a permutation (duplicate)', () => {
		expect(() =>
			quantizedDot(values, scale, activations, { accumulator: 'fp16', order: [0, 0, 2] })
		).toThrow('not a permutation');
	});

	it('throws when order has wrong length', () => {
		expect(() =>
			quantizedDot(values, scale, activations, { accumulator: 'fp16', order: [0, 1] })
		).toThrow();
	});

	it('throws when order contains out-of-range index', () => {
		expect(() =>
			quantizedDot(values, scale, activations, { accumulator: 'fp16', order: [0, 1, 5] })
		).toThrow('invalid index');
	});
});
