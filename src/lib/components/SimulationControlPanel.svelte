<script lang="ts">
	import {
		setSimulationBatchInvariant,
		setSimulationBatchSize,
		setSimulationPrecisionMode,
		simulation,
		type PrecisionMode
	} from '$lib/stores/simulation';

	function onBatchInput(event: Event): void {
		const input = event.currentTarget as HTMLInputElement;
		const value = Math.round(Number(input.value));
		setSimulationBatchSize(value);
	}

	function onPrecisionChange(mode: PrecisionMode): void {
		setSimulationPrecisionMode(mode);
	}

	function onInvariantChange(event: Event): void {
		const input = event.currentTarget as HTMLInputElement;
		setSimulationBatchInvariant(input.checked);
	}
</script>

<section class="simulation-panel" aria-label="Параметры симуляций">
	<h3 class="simulation-panel__title">Параметры симуляций</h3>

	<div class="simulation-panel__grid">
		<div class="simulation-panel__field">
			<label class="simulation-panel__label" for="sim-batch-size">
				Batch size: <span class="simulation-panel__value">{$simulation.batchSize}</span>
			</label>
			<input
				id="sim-batch-size"
				class="simulation-panel__range"
				type="range"
				min="1"
				max="128"
				step="1"
				value={$simulation.batchSize}
				oninput={onBatchInput}
			/>
		</div>

		<fieldset class="simulation-panel__fieldset">
			<legend class="simulation-panel__legend">Точность</legend>
			<div class="simulation-panel__segment">
				<button
					type="button"
					class="simulation-panel__seg-btn"
					class:simulation-panel__seg-btn--active={$simulation.precisionMode === 'fp16'}
					onclick={() => onPrecisionChange('fp16')}
				>
					FP16
				</button>
				<button
					type="button"
					class="simulation-panel__seg-btn"
					class:simulation-panel__seg-btn--active={$simulation.precisionMode === 'bf16'}
					onclick={() => onPrecisionChange('bf16')}
				>
					BF16
				</button>
			</div>
		</fieldset>

		<div class="simulation-panel__field simulation-panel__field--toggle">
			<label class="simulation-panel__checkbox-label">
				<input
					type="checkbox"
					checked={$simulation.isBatchInvariant}
					onchange={onInvariantChange}
				/>
				Batch-invariant ops
			</label>
		</div>
	</div>
</section>

<style>
	.simulation-panel {
		margin: 0 0 28px;
		padding: 16px 18px;
		border: 1px solid var(--hairline);
		border-radius: 12px;
		background: #fafafa;
		max-width: var(--max-text);
		font-family:
			ui-sans-serif,
			system-ui,
			-apple-system,
			Segoe UI,
			Roboto,
			Helvetica,
			Arial,
			'Apple Color Emoji',
			'Segoe UI Emoji';
	}

	.simulation-panel__title {
		margin: 0 0 14px;
		font-size: 14px;
		font-weight: 600;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.simulation-panel__grid {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.simulation-panel__field {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.simulation-panel__label {
		font-size: 14px;
		color: var(--fg);
	}

	.simulation-panel__value {
		font-variant-numeric: tabular-nums;
		font-weight: 600;
	}

	.simulation-panel__range {
		width: 100%;
		max-width: 22rem;
		accent-color: var(--accent);
	}

	.simulation-panel__fieldset {
		margin: 0;
		padding: 0;
		border: none;
	}

	.simulation-panel__legend {
		padding: 0;
		margin-bottom: 8px;
		font-size: 13px;
		font-weight: 600;
		color: var(--fg);
	}

	.simulation-panel__segment {
		display: inline-flex;
		border: 1px solid var(--hairline);
		border-radius: 8px;
		overflow: hidden;
		background: #fff;
	}

	.simulation-panel__seg-btn {
		margin: 0;
		padding: 8px 14px;
		border: none;
		background: transparent;
		font-size: 13px;
		font-weight: 600;
		color: var(--muted);
		cursor: pointer;
	}

	.simulation-panel__seg-btn:hover {
		background: #f3f3f3;
		color: var(--fg);
	}

	.simulation-panel__seg-btn--active {
		background: var(--accent);
		color: #fff;
	}

	.simulation-panel__seg-btn--active:hover {
		background: var(--accent);
		color: #fff;
	}

	.simulation-panel__checkbox-label {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		font-size: 14px;
		cursor: pointer;
		user-select: none;
	}

	.simulation-panel__field--toggle input {
		width: 1rem;
		height: 1rem;
		accent-color: var(--accent);
	}
</style>
