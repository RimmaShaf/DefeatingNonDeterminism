/**
 * generateWeightsGag.ts
 *
 * Generates a fake model-weights dump. At 100% zoom every value is a uniform
 * bf16-looking token ("-0.000946", " 0.003540") — indistinguishable from a real
 * weights file. Cells covered by the hidden "SEE IT ?" bitmap are tagged `on`
 * in the row segments; the component brightens those cells only while zoomed
 * out, so the message appears as ASCII art at ~1px-per-character scale and is
 * invisible at 100%.
 */

export interface WeightsGagSegment {
	text: string;
	on: boolean;
}

export interface WeightsGagResult {
	text: string;
	/** One entry per line; consecutive cells with the same on/off flag are merged. */
	rows: WeightsGagSegment[][];
	/** Mask rows (already vertically stretched and margin-padded to `cols`). */
	maskRows: string[];
	cols: number;
	/** Number of all-off rows before the first mask row. */
	headerRows: number;
}

// ---------------------------------------------------------------------------
// Seeded PRNG – mulberry32 (fast, deterministic, no Math.random)
// ---------------------------------------------------------------------------
function mulberry32(seed: number): () => number {
	let s = seed >>> 0;
	return () => {
		s += 0x6d2b79f5;
		let z = s;
		z = Math.imul(z ^ (z >>> 15), z | 1);
		z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
		return ((z ^ (z >>> 14)) >>> 0) / 0x1_0000_0000;
	};
}

// ---------------------------------------------------------------------------
// 5×7 block glyphs for the hidden message
// ---------------------------------------------------------------------------
const GLYPHS: Record<string, string[]> = {
	S: [' ####', '#    ', '#    ', ' ### ', '    #', '    #', '#### '],
	E: ['#####', '#    ', '#    ', '#### ', '#    ', '#    ', '#####'],
	I: ['#####', '  #  ', '  #  ', '  #  ', '  #  ', '  #  ', '#####'],
	T: ['#####', '  #  ', '  #  ', '  #  ', '  #  ', '  #  ', '  #  '],
	'?': [' ### ', '#   #', '    #', '  ## ', '  #  ', '     ', '  #  '],
	' ': ['   ', '   ', '   ', '   ', '   ', '   ', '   '],
};

const MESSAGE = 'SEE IT ?';
const GLYPH_ROWS = 7;
const LETTER_GAP = 2;
// Grid cells are much wider than they are tall (~10 chars × 1 line), so each
// glyph row is repeated VREP times to keep the letters from looking squashed
// once the whole grid is scaled to fill the viewport.
const VREP = 4;

function buildMask(cols: number, margin: number): string[] {
	const glyphRows: string[] = [];
	for (let r = 0; r < GLYPH_ROWS; r++) {
		const row = [...MESSAGE].map((ch) => GLYPHS[ch][r]).join(' '.repeat(LETTER_GAP));
		glyphRows.push(row);
	}
	const width = glyphRows[0].length;
	if (margin * 2 + width !== cols) {
		throw new Error(`Mask width ${width} + margins ${margin * 2} != cols ${cols}`);
	}
	const rows: string[] = [];
	for (const row of glyphRows) {
		const padded = ' '.repeat(margin) + row + ' '.repeat(margin);
		for (let v = 0; v < VREP; v++) rows.push(padded);
	}
	return rows;
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------
export function generateWeightsGag(seed: number): WeightsGagResult {
	const rng = mulberry32(seed);

	const MARGIN = 6;
	const MESSAGE_WIDTH = [...MESSAGE]
		.map((ch) => GLYPHS[ch][0].length)
		.reduce((a, b) => a + b + LETTER_GAP, -LETTER_GAP);
	const COLS = MESSAGE_WIDTH + MARGIN * 2;
	const TOTAL_ROWS = 160;
	const CELL_W = 9; // "-0.000946" — positives get one leading pad space
	const SEP = ' ';

	const maskRows = buildMask(COLS, MARGIN);
	const HEADER_ROWS = Math.floor((TOTAL_ROWS - maskRows.length) / 2);
	const FOOTER_ROWS = TOTAL_ROWS - HEADER_ROWS - maskRows.length;

	// Plausible weight value: gaussian, σ≈0.008, like a real down_proj dump.
	function genValue(): number {
		const u1 = Math.max(rng(), 1e-12);
		const u2 = rng();
		const g = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
		return Math.max(-0.999999, Math.min(0.999999, g * 0.008));
	}

	function formatCell(val: number): string {
		return val.toFixed(6).padStart(CELL_W);
	}

	let totalNeg = 0;
	let totalCells = 0;

	function buildRow(rowMask: string | null): WeightsGagSegment[] {
		const segments: WeightsGagSegment[] = [];
		for (let c = 0; c < COLS; c++) {
			const on = rowMask !== null && rowMask[c] === '#';
			const val = genValue();
			if (val < 0) totalNeg++;
			totalCells++;
			const cellText = (c > 0 ? SEP : '') + formatCell(val);
			const last = segments[segments.length - 1];
			if (last !== undefined && last.on === on) {
				last.text += cellText;
			} else {
				segments.push({ text: cellText, on });
			}
		}
		return segments;
	}

	const rows: WeightsGagSegment[][] = [];
	for (let i = 0; i < HEADER_ROWS; i++) rows.push(buildRow(null));
	for (const maskRow of maskRows) rows.push(buildRow(maskRow));
	for (let i = 0; i < FOOTER_ROWS; i++) rows.push(buildRow(null));

	const lines = rows.map((segs) => segs.map((s) => s.text).join(''));
	const text = lines.join('\n');

	// ---------------------------------------------------------------------------
	// Plausibility assertions (throw on violation)
	// ---------------------------------------------------------------------------

	if (lines.length !== TOTAL_ROWS) {
		throw new Error(`Line count mismatch: got ${lines.length}, expected ${TOTAL_ROWS}`);
	}

	const expectedWidth = COLS * (CELL_W + SEP.length) - SEP.length;
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].length !== expectedWidth) {
			throw new Error(`Line ${i} has width ${lines[i].length}, expected ${expectedWidth}`);
		}
	}

	const negFraction = totalNeg / totalCells;
	if (negFraction < 0.4 || negFraction > 0.6) {
		throw new Error(`Negative fraction out of [0.4, 0.6]: got ${negFraction.toFixed(4)}`);
	}

	return { text, rows, maskRows, cols: COLS, headerRows: HEADER_ROWS };
}
