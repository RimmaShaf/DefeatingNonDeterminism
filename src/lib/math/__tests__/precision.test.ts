import { describe, expect, it } from 'vitest';

import { roundToBfloat16, roundToFloat16 } from '$lib/math';

describe('precision emulation', () => {
	it('drops tiny increment near large magnitude for float16', () => {
		expect(roundToFloat16(10000.25)).toBe(10000);
	});

	it('bfloat16 keeps wider range but lower mantissa precision', () => {
		const value = 1.234567;
		expect(roundToBfloat16(value)).not.toBe(value);
	});

	it('non-associativity demo changes with quantization steps', () => {
		const a = 2048;
		const b = 1;
		const c = -2048;

		const left = roundToFloat16(roundToFloat16(a + b) + c);
		const right = roundToFloat16(a + roundToFloat16(b + c));

		expect(left).not.toBe(right);
		expect(Number.isFinite(left)).toBe(true);
		expect(Number.isFinite(right)).toBe(true);
	});
});
