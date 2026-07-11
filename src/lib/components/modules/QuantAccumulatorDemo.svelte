<script lang="ts">
	import { quantizeSymmetric, quantizedDot, seededOrder } from '$lib/math';

	// Fixed demo data: int8 weights stay IDENTICAL across all runs.
	// Activations mix large and small magnitudes so fp16 accumulator rounding
	// becomes order-dependent (partial sums stay far below fp16 max 65504).
	const WEIGHT_ROW = [1, -0.5, 0.75, 1, -0.25, 0.5, 1, -1];
	const ACTIVATIONS = [2048, 1, -1024, 0.5, 512, -0.25, -1536, 2];

	const { values: weightsInt8, scale } = quantizeSymmetric(WEIGHT_ROW);

	const ORDERS = [0, 1, 2, 3, 4].map((seed) => seededOrder(WEIGHT_ROW.length, seed * 1000 + 7));

	let accumulator = $state<'fp16' | 'fp32'>('fp16');

	let results = $derived(
		ORDERS.map((order) => quantizedDot(weightsInt8, scale, ACTIVATIONS, { accumulator, order }))
	);
	let maxDiff = $derived(Math.max(...results) - Math.min(...results));
	let allEqual = $derived(maxDiff === 0);
</script>

<div class="qad" data-module="quant">
	<h4 class="qad__title">Quantized weights × summation order</h4>

	<p class="qad__setup">
		The same <strong>int8 weights</strong> (symmetric quantization, zero-point = 0, scale = {scale.toFixed(6)}),
		the same activations — only the <em>order</em> of summation in the accumulator changes.
	</p>

	<div class="qad__weights" aria-label="int8 weights">
		{#each Array.from(weightsInt8) as w, i (i)}
			<span class="qad__chip">{w}</span>
		{/each}
		<span class="qad__chip-label">← int8, unchanged across all runs</span>
	</div>

	<div class="qad__controls">
		<span class="qad__controls-label">Accumulator precision:</span>
		<label class="qad__radio">
			<input type="radio" bind:group={accumulator} value="fp16" />
			fp16
		</label>
		<label class="qad__radio">
			<input type="radio" bind:group={accumulator} value="fp32" />
			fp32
		</label>
	</div>

	<table class="qad__table">
		<thead>
			<tr>
				<th>Reduction order</th>
				<th>Result ({accumulator})</th>
			</tr>
		</thead>
		<tbody>
			{#each results as r, i (i)}
				<tr>
					<td class="qad__order">[{ORDERS[i].join(', ')}]</td>
					<td class="qad__result" class:qad__result--diverged={r !== results[0]}>{r}</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<div class="qad__verdict" class:qad__verdict--diverged={!allEqual}>
		{#if allEqual}
			All orders produced the same result (divergence 0).
		{:else}
			Divergence across orders: {maxDiff} — with identical int8 weights!
		{/if}
	</div>

	<p class="qad__takeaway">
		<strong>The accumulator is the culprit, not the weights.</strong> Fewer bits in the weights doesn't help: dequantization is exact, and
		nondeterminism arises from the rounding order of partial sums — where you add (fp16/fp32), not where you store (int8).
	</p>
</div>

<style>
	.qad {
		border: 1px solid var(--hairline);
		border-radius: 10px;
		padding: 16px;
		margin: 24px 0;
		background: var(--panel, #fafafa);
	}

	.qad__title {
		margin: 0 0 8px;
		font-size: 15px;
	}

	.qad__setup {
		font-size: 14px;
		margin: 0 0 12px;
	}

	.qad__weights {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		align-items: center;
		margin-bottom: 12px;
	}

	.qad__chip {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 12px;
		background: #e8eef7;
		border: 1px solid #c4d4ea;
		border-radius: 6px;
		padding: 2px 8px;
	}

	.qad__chip-label {
		font-size: 12px;
		color: var(--muted);
	}

	.qad__controls {
		display: flex;
		gap: 12px;
		align-items: center;
		margin-bottom: 12px;
		font-size: 14px;
	}

	.qad__controls-label {
		color: var(--muted);
	}

	.qad__radio {
		display: inline-flex;
		gap: 4px;
		align-items: center;
		cursor: pointer;
	}

	.qad__table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
		margin-bottom: 12px;
	}

	.qad__table th,
	.qad__table td {
		text-align: left;
		padding: 6px 8px;
		border-bottom: 1px solid var(--hairline);
	}

	.qad__order {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 12px;
		color: var(--muted);
	}

	.qad__result {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	}

	.qad__result--diverged {
		color: #b3261e;
		font-weight: 700;
	}

	.qad__verdict {
		font-size: 14px;
		padding: 8px 12px;
		border-radius: 8px;
		background: #e7f4e8;
		margin-bottom: 12px;
	}

	.qad__verdict--diverged {
		background: #fdecea;
	}

	.qad__takeaway {
		font-size: 14px;
		margin: 0;
	}
</style>
