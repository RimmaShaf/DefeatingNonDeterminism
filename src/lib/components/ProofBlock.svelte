<script lang="ts">
	import { simulation } from '$lib/stores/simulation';
	import { runProof, type ProofResult } from '$lib/proof/batchInvariantProof';

	let result = $state<ProofResult | null>(null);
	let running = $state(false);

	async function handleRun() {
		running = true;
		result = null;
		await new Promise((r) => setTimeout(r, 40));
		result = runProof($simulation.batchSize, $simulation.precisionMode, $simulation.isBatchInvariant);
		running = false;
	}

	function fmtDiff(n: number): string {
		if (n === 0) return '0';
		if (Math.abs(n) < 1e-10) return n.toExponential(3);
		return n.toPrecision(5);
	}
</script>

<div class="proof">
	<h4 class="proof__title">Proof Block — Batch Invariance Proof</h4>
	<p class="proof__desc">
		Runs {16} computations with the same data (batch={$simulation.batchSize}, {$simulation.precisionMode}) but in different reduction orders.
		In <strong>Batch Invariant</strong> mode the reduction tree is fixed — divergence is zero.
	</p>

	<button class="proof__run-btn" onclick={handleRun} disabled={running} aria-busy={running}>
		{running ? 'Computing…' : '▶ Run proof'}
	</button>

	{#if result}
		<div class="proof__results" aria-live="polite">
			<div class="proof__row">
				<span class="proof__key">Mode:</span>
				<span class="proof__val proof__val--mode">
					{$simulation.isBatchInvariant ? '🔒 Batch Invariant (deterministic)' : '⚡ Standard (nondeterministic)'}
				</span>
			</div>
			<div class="proof__row">
				<span class="proof__key">Runs:</span>
				<span class="proof__val">{result.runs}</span>
			</div>
			<div class="proof__row">
				<span class="proof__key">Reference result:</span>
				<span class="proof__val proof__val--mono">{fmtDiff(result.referenceResult)}</span>
			</div>
			<div class="proof__row" class:proof__row--good={result.maxAbsDiff === 0} class:proof__row--warn={result.maxAbsDiff > 0}>
				<span class="proof__key">Max abs diff:</span>
				<span class="proof__val proof__val--mono">{fmtDiff(result.maxAbsDiff)}</span>
			</div>
			<div class="proof__row">
				<span class="proof__key">Mean diff:</span>
				<span class="proof__val proof__val--mono">{fmtDiff(result.meanDiff)}</span>
			</div>
			<div class="proof__row" class:proof__row--good={result.bitwiseEqual} class:proof__row--warn={!result.bitwiseEqual}>
				<span class="proof__key">Bitwise equal:</span>
				<span class="proof__val">{result.bitwiseEqual ? '✓ yes — all results are identical' : '✗ no — divergence detected'}</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.proof {
		background: var(--surface, #fff);
		border: 1px solid var(--hairline, #e5e7eb);
		border-radius: 8px;
		padding: 20px;
		margin-top: 24px;
	}
	.proof__title {
		font-size: 15px;
		font-weight: 700;
		margin: 0 0 8px;
	}
	.proof__desc {
		font-size: 14px;
		color: var(--muted, #6b7280);
		margin: 0 0 14px;
		line-height: 1.5;
	}
	.proof__run-btn {
		padding: 8px 20px;
		font-size: 14px;
		font-weight: 600;
		background: var(--accent, #3b82f6);
		color: #fff;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		margin-bottom: 16px;
		transition: opacity 0.15s;
	}
	.proof__run-btn:disabled {
		opacity: 0.6;
		cursor: wait;
	}
	.proof__results {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.proof__row {
		display: flex;
		gap: 10px;
		align-items: baseline;
		font-size: 14px;
		padding: 5px 8px;
		border-radius: 4px;
		background: var(--bg-subtle, #f9fafb);
	}
	.proof__row--good {
		background: #f0fdf4;
	}
	.proof__row--warn {
		background: #fff7ed;
	}
	.proof__key {
		color: var(--muted, #6b7280);
		min-width: 180px;
		font-size: 13px;
	}
	.proof__val {
		font-weight: 600;
	}
	.proof__val--mono {
		font-family: ui-monospace, monospace;
	}
	.proof__val--mode {
		font-size: 13px;
	}
</style>
