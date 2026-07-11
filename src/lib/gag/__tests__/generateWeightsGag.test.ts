import { describe, expect, it } from 'vitest';

import { generateWeightsGag } from '$lib/gag/generateWeightsGag';

describe('generateWeightsGag', () => {
	const result = generateWeightsGag(42);
	const lines = result.text.split('\n');

	it('is deterministic: same seed produces identical text', () => {
		expect(generateWeightsGag(42).text).toBe(result.text);
	});

	it('different seeds produce different text', () => {
		expect(generateWeightsGag(43).text).not.toBe(result.text);
	});

	it('produces a consistent grid: all lines same width, 150+ lines', () => {
		expect(lines.length).toBeGreaterThanOrEqual(150);
		const width = lines[0].length;
		for (const line of lines) {
			expect(line.length).toBe(width);
		}
	});

	it('every token is a uniform 6-decimal weight — no visible density trick at 100%', () => {
		let neg = 0;
		let total = 0;
		for (const line of lines) {
			for (const token of line.trim().split(/\s+/)) {
				expect(token).toMatch(/^-?0\.\d{6}$/);
				total++;
				if (token.startsWith('-')) neg++;
			}
		}
		const negFraction = neg / total;
		expect(negFraction).toBeGreaterThan(0.4);
		expect(negFraction).toBeLessThan(0.6);
	});

	it('header and footer rows carry no hidden-message cells', () => {
		for (let r = 0; r < result.rows.length; r++) {
			const inMask = r >= result.headerRows && r < result.headerRows + result.maskRows.length;
			if (inMask) continue;
			expect(result.rows[r].length).toBe(1);
			expect(result.rows[r][0].on).toBe(false);
		}
	});

	it('on-cells align with the mask: per-row on-token count equals # count', () => {
		expect(result.maskRows.length).toBeGreaterThan(0);
		let sawOn = false;
		for (let r = 0; r < result.maskRows.length; r++) {
			const maskRow = result.maskRows[r];
			expect(maskRow.length).toBe(result.cols);
			const hashCount = [...maskRow].filter((c) => c === '#').length;
			const row = result.rows[result.headerRows + r];
			let onTokens = 0;
			for (const seg of row) {
				if (seg.on) {
					onTokens += seg.text.trim().split(/\s+/).length;
					sawOn = true;
				}
			}
			expect(onTokens).toBe(hashCount);
		}
		expect(sawOn).toBe(true);
	});

	it('segments reassemble into the text exactly', () => {
		const rebuilt = result.rows.map((segs) => segs.map((s) => s.text).join('')).join('\n');
		expect(rebuilt).toBe(result.text);
	});
});
