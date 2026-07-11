<script lang="ts">
	import { simulation } from '$lib/stores/simulation';

	const SM_COUNT = 8;
	const SPLIT_K_THRESHOLD = 16;

	let pulseFrame = $state(0);
	let intervalId: ReturnType<typeof setInterval> | null = null;

	function startPulse() {
		if (intervalId) return;
		intervalId = setInterval(() => {
			pulseFrame = (pulseFrame + 1) % 8;
		}, 220);
	}

	function stopPulse() {
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = null;
		}
	}

	$effect(() => {
		const isSplitK = $simulation.batchSize <= SPLIT_K_THRESHOLD;
		if (isSplitK && !$simulation.isBatchInvariant) {
			startPulse();
		} else {
			stopPulse();
		}
		return () => stopPulse();
	});

	function getNondeterminismScore(batchSize: number, isBatchInvariant: boolean): number {
		if (isBatchInvariant) return 0;
		if (batchSize <= 4) return 0.95;
		if (batchSize <= 8) return 0.78;
		if (batchSize <= 16) return 0.55;
		if (batchSize <= 32) return 0.25;
		if (batchSize <= 64) return 0.1;
		return 0.04;
	}

	function getMode(batchSize: number): 'split-k' | 'data-parallel' {
		return batchSize <= SPLIT_K_THRESHOLD ? 'split-k' : 'data-parallel';
	}

	let score = $derived(getNondeterminismScore($simulation.batchSize, $simulation.isBatchInvariant));
	let mode = $derived(getMode($simulation.batchSize));

	function meterColor(s: number): string {
		if (s < 0.2) return '#16a34a';
		if (s < 0.5) return '#f59e0b';
		return '#dc2626';
	}

	function smLabel(i: number, batchSize: number): string {
		if (mode === 'split-k') {
			return `SM${i} → shared accum`;
		}
		const rowsPerSm = Math.max(1, Math.round(batchSize / SM_COUNT));
		const start = i * rowsPerSm;
		return `SM${i} rows ${start}–${start + rowsPerSm - 1}`;
	}

	function isPulsing(i: number): boolean {
		if (mode !== 'split-k' || $simulation.isBatchInvariant) return false;
		return pulseFrame % SM_COUNT === i;
	}
</script>

<div class="kps" data-module="B">
	<h4 class="kps__title">Module B — Kernel Parallelism Simulator</h4>

	<div class="kps__mode-badge" class:kps__mode-badge--splitk={mode === 'split-k'} class:kps__mode-badge--dp={mode === 'data-parallel'}>
		{mode === 'split-k' ? 'Split-K (shared accumulator)' : 'Data Parallel (independent rows)'}
	</div>

	<div class="kps__grid" aria-label="GPU SM grid">
		{#each Array(SM_COUNT) as _, i}
			<div
				class="kps__sm"
				class:kps__sm--pulse={isPulsing(i)}
				class:kps__sm--shared={mode === 'split-k'}
				aria-label={smLabel(i, $simulation.batchSize)}
			>
				<span class="kps__sm-label">SM{i}</span>
				{#if isPulsing(i)}
					<span class="kps__pulse-dot" aria-hidden="true">●</span>
				{/if}
			</div>
		{/each}
	</div>

	{#if mode === 'split-k'}
		<div class="kps__accum" class:kps__accum--invariant={$simulation.isBatchInvariant}>
			<span class="kps__accum-label">
				{$simulation.isBatchInvariant ? '🔒 Fixed accumulator (deterministic)' : '⚡ Shared accumulator (order not fixed)'}
			</span>
		</div>
	{:else}
		<div class="kps__dp-note">
			Each SM handles independent batch rows — no race for a shared accumulator.
		</div>
	{/if}

	<div class="kps__meter">
		<div class="kps__meter-label">
			Nondeterminism Meter
			<span class="kps__meter-value" style="color: {meterColor(score)}">
				{(score * 100).toFixed(0)}%
			</span>
		</div>
		<div class="kps__meter-bar-bg">
			<div
				class="kps__meter-bar-fill"
				style="width: {score * 100}%; background: {meterColor(score)}; transition: width 0.3s ease, background 0.3s ease"
				role="progressbar"
				aria-valuenow={Math.round(score * 100)}
				aria-valuemin={0}
				aria-valuemax={100}
			></div>
		</div>
		<p class="kps__meter-hint">
			{#if score < 0.15}
				Nondeterminism risk is minimal.
			{:else if score < 0.5}
				Moderate risk: partial reduction order varies.
			{:else}
				High risk: multiple SMs competing for a shared accumulator.
			{/if}
		</p>
	</div>

	<div class="kps__params">
		<span>batch: <strong>{$simulation.batchSize}</strong></span>
		<span>precision: <strong>{$simulation.precisionMode}</strong></span>
		<span>invariant: <strong>{$simulation.isBatchInvariant ? 'yes' : 'no'}</strong></span>
	</div>
</div>

<style>
	.kps {
		background: var(--surface, #fff);
		border: 1px solid var(--hairline, #e5e7eb);
		border-radius: 8px;
		padding: 20px;
		font-size: 14px;
	}
	.kps__title {
		font-size: 15px;
		font-weight: 700;
		margin: 0 0 12px;
	}
	.kps__mode-badge {
		display: inline-block;
		padding: 3px 10px;
		border-radius: 12px;
		font-size: 12px;
		font-weight: 600;
		margin-bottom: 14px;
	}
	.kps__mode-badge--splitk {
		background: #fef3c7;
		color: #92400e;
	}
	.kps__mode-badge--dp {
		background: #d1fae5;
		color: #065f46;
	}
	.kps__grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 6px;
		margin-bottom: 10px;
	}
	.kps__sm {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: 8px 4px;
		border-radius: 6px;
		border: 2px solid var(--hairline, #e5e7eb);
		background: var(--bg-subtle, #f9fafb);
		font-size: 12px;
		font-weight: 600;
		transition: background 0.15s, border-color 0.15s;
		min-height: 42px;
	}
	.kps__sm--shared {
		border-color: #fbbf24;
	}
	.kps__sm--pulse {
		background: #fef9c3;
		border-color: #f59e0b;
	}
	.kps__sm-label {
		font-family: ui-monospace, monospace;
	}
	.kps__pulse-dot {
		color: #f59e0b;
		font-size: 10px;
		animation: pulse 0.22s ease-out;
	}
	@keyframes pulse {
		from { opacity: 1; transform: scale(1.4); }
		to { opacity: 0.7; transform: scale(1); }
	}
	.kps__accum {
		text-align: center;
		padding: 8px;
		border-radius: 6px;
		margin-bottom: 12px;
		font-size: 13px;
		font-weight: 600;
		background: #fff7ed;
		border: 2px dashed #fb923c;
	}
	.kps__accum--invariant {
		background: #f0fdf4;
		border-color: #4ade80;
	}
	.kps__dp-note {
		font-size: 13px;
		color: var(--muted, #6b7280);
		margin-bottom: 12px;
		padding: 8px 10px;
		background: #f0fdf4;
		border-radius: 6px;
	}
	.kps__meter {
		margin-bottom: 12px;
	}
	.kps__meter-label {
		font-size: 13px;
		font-weight: 600;
		margin-bottom: 6px;
		display: flex;
		gap: 8px;
		align-items: baseline;
	}
	.kps__meter-value {
		font-size: 15px;
		font-weight: 700;
	}
	.kps__meter-bar-bg {
		height: 10px;
		background: var(--hairline, #e5e7eb);
		border-radius: 5px;
		overflow: hidden;
		margin-bottom: 4px;
	}
	.kps__meter-bar-fill {
		height: 100%;
		border-radius: 5px;
	}
	.kps__meter-hint {
		font-size: 12px;
		color: var(--muted, #6b7280);
		margin: 0;
	}
	.kps__params {
		display: flex;
		gap: 12px;
		font-size: 12px;
		color: var(--muted, #6b7280);
	}
</style>
