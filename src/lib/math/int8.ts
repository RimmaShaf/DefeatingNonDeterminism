import { roundToFloat16 } from './float16';

export function quantizeSymmetric(row: number[]): { values: Int8Array; scale: number } {
	if (row.length === 0) throw new Error('quantizeSymmetric: empty row');
	for (const v of row) {
		if (!Number.isFinite(v)) throw new Error('quantizeSymmetric: non-finite value');
	}
	const maxAbs = Math.max(...row.map(Math.abs));
	const scale = maxAbs === 0 ? 1 : maxAbs / 127;
	const values = new Int8Array(row.map((v) => Math.round(v / scale)));
	return { values, scale };
}

export function dequantize(values: Int8Array, scale: number): number[] {
	const result: number[] = new Array(values.length);
	for (let i = 0; i < values.length; i++) {
		result[i] = values[i] * scale;
	}
	return result;
}

export interface QuantizedDotOpts {
	accumulator: 'fp16' | 'fp32';
	order: number[];
}

export function quantizedDot(
	weightsInt8: Int8Array,
	scale: number,
	activations: number[],
	opts: QuantizedDotOpts
): number {
	const n = weightsInt8.length;
	if (activations.length !== n) {
		throw new Error('quantizedDot: weights and activations length mismatch');
	}

	// Validate order is a permutation of 0..n-1
	if (opts.order.length !== n) {
		throw new Error('quantizedDot: order must be a permutation of 0..n-1');
	}
	const seen = new Uint8Array(n);
	for (const idx of opts.order) {
		if (idx < 0 || idx >= n || !Number.isInteger(idx)) {
			throw new Error('quantizedDot: order contains invalid index');
		}
		if (seen[idx]) {
			throw new Error('quantizedDot: order is not a permutation (duplicate index)');
		}
		seen[idx] = 1;
	}

	const round = opts.accumulator === 'fp16' ? roundToFloat16 : Math.fround;

	// Compute products: dequantized weight × activation
	const products: number[] = new Array(n);
	for (let i = 0; i < n; i++) {
		products[i] = weightsInt8[i] * scale * activations[i];
	}

	// Accumulate in the given order, rounding after every add
	let acc = 0;
	for (const idx of opts.order) {
		acc = round(acc + products[idx]);
	}
	return acc;
}
