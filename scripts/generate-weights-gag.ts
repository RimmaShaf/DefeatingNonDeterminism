// CLI wrapper: node scripts/generate-weights-gag.ts (Node 23+, native TS)
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateWeightsGag } from '../src/lib/gag/generateWeightsGag.ts';

const SEED = 42;
const outPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'static', 'weights-gag.txt');

const { text } = generateWeightsGag(SEED);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, text, 'utf8');

const lines = text.split('\n');
console.log(`Wrote ${outPath}: ${lines.length} lines x ${lines[0].length} chars (seed ${SEED})`);
