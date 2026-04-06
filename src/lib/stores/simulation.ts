import { writable } from 'svelte/store';

export type PrecisionMode = 'fp16' | 'bf16';

export type SimulationState = {
	batchSize: number;
	precisionMode: PrecisionMode;
	isBatchInvariant: boolean;
};

const MIN_BATCH = 1;
const MAX_BATCH = 128;

const initialState: SimulationState = {
	batchSize: 32,
	precisionMode: 'fp16',
	isBatchInvariant: false
};

export const simulation = writable<SimulationState>(initialState);

export function setSimulationBatchSize(value: number): void {
	if (!Number.isInteger(value)) {
		throw new Error(`batchSize must be an integer, got ${String(value)}`);
	}
	if (value < MIN_BATCH || value > MAX_BATCH) {
		throw new Error(
			`batchSize must be in [${String(MIN_BATCH)}, ${String(MAX_BATCH)}], got ${String(value)}`
		);
	}
	simulation.update((s) => ({ ...s, batchSize: value }));
}

export function setSimulationPrecisionMode(mode: PrecisionMode): void {
	if (mode !== 'fp16' && mode !== 'bf16') {
		throw new Error(`precisionMode must be fp16 or bf16, got ${String(mode)}`);
	}
	simulation.update((s) => ({ ...s, precisionMode: mode }));
}

export function setSimulationBatchInvariant(value: boolean): void {
	if (typeof value !== 'boolean') {
		throw new Error(`isBatchInvariant must be boolean, got ${typeof value}`);
	}
	simulation.update((s) => ({ ...s, isBatchInvariant: value }));
}
