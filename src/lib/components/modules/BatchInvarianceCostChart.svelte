<script lang="ts">
	import { simulation } from '$lib/stores/simulation';

	const BATCH_SIZES = [1, 2, 4, 8, 16, 32, 64, 128];

	// Illustrative synthetic data: throughput relative to baseline
	const STANDARD_THROUGHPUT: Record<number, number> = {
		1: 0.18, 2: 0.28, 4: 0.42, 8: 0.58, 16: 0.72, 32: 0.85, 64: 0.93, 128: 1.0
	};
	const INVARIANT_THROUGHPUT: Record<number, number> = {
		1: 0.15, 2: 0.24, 4: 0.37, 8: 0.51, 16: 0.64, 32: 0.76, 64: 0.84, 128: 0.90
	};

	const W = 340;
	const H = 200;
	const PAD = { top: 16, right: 16, bottom: 36, left: 44 };
	const CW = W - PAD.left - PAD.right;
	const CH = H - PAD.top - PAD.bottom;

	function xPos(i: number): number {
		return PAD.left + (i / (BATCH_SIZES.length - 1)) * CW;
	}
	function yPos(v: number): number {
		return PAD.top + (1 - v) * CH;
	}

	function toPolyline(data: Record<number, number>): string {
		return BATCH_SIZES.map((b, i) => `${xPos(i)},${yPos(data[b])}`).join(' ');
	}

	function currentBatchX(): number {
		const idx = BATCH_SIZES.indexOf($simulation.batchSize);
		if (idx < 0) {
			const closest = BATCH_SIZES.reduce((a, b) =>
				Math.abs(b - $simulation.batchSize) < Math.abs(a - $simulation.batchSize) ? b : a
			);
			return xPos(BATCH_SIZES.indexOf(closest));
		}
		return xPos(idx);
	}

	let stdLine = $derived(toPolyline(STANDARD_THROUGHPUT));
	let invLine = $derived(toPolyline(INVARIANT_THROUGHPUT));
	let markerX = $derived(currentBatchX());

</script>

<div class="bcc" data-module="C">
	<h4 class="bcc__title">Module C — Cost Chart: Throughput vs Batch</h4>

	<svg
		class="bcc__chart"
		viewBox="0 0 {W} {H}"
		width={W}
		height={H}
		aria-label="Throughput chart (illustrative data)"
		role="img"
	>
		<!-- grid lines -->
		{#each [0.25, 0.5, 0.75, 1.0] as gridY}
			<line
				x1={PAD.left} y1={yPos(gridY)}
				x2={PAD.left + CW} y2={yPos(gridY)}
				stroke="#e5e7eb" stroke-width="1"
			/>
			<text x={PAD.left - 6} y={yPos(gridY) + 4} text-anchor="end" font-size="10" fill="#9ca3af">
				{(gridY * 100).toFixed(0)}%
			</text>
		{/each}

		<!-- x axis labels -->
		{#each BATCH_SIZES as b, i}
			<text
				x={xPos(i)} y={H - 6}
				text-anchor="middle" font-size="10" fill="#9ca3af"
			>{String(b)}</text>
		{/each}

		<!-- axis labels -->
		<text x={PAD.left + CW / 2} y={H - 0} text-anchor="middle" font-size="10" fill="#6b7280">batch size</text>
		<text x={10} y={PAD.top + CH / 2} text-anchor="middle" font-size="10" fill="#6b7280"
			transform="rotate(-90, 10, {PAD.top + CH / 2})">throughput</text>

		<!-- standard line -->
		<polyline
			points={stdLine}
			fill="none"
			stroke="#3b82f6"
			stroke-width="2"
			stroke-linejoin="round"
			opacity={$simulation.isBatchInvariant ? 0.35 : 1}
		/>
		{#each BATCH_SIZES as b, i}
			<circle
				cx={xPos(i)} cy={yPos(STANDARD_THROUGHPUT[b])}
				r="3" fill="#3b82f6"
				opacity={$simulation.isBatchInvariant ? 0.35 : 1}
			/>
		{/each}

		<!-- invariant line -->
		<polyline
			points={invLine}
			fill="none"
			stroke="#f59e0b"
			stroke-width="2"
			stroke-dasharray="5 3"
			stroke-linejoin="round"
			opacity={$simulation.isBatchInvariant ? 1 : 0.45}
		/>
		{#each BATCH_SIZES as b, i}
			<circle
				cx={xPos(i)} cy={yPos(INVARIANT_THROUGHPUT[b])}
				r="3" fill="#f59e0b"
				opacity={$simulation.isBatchInvariant ? 1 : 0.45}
			/>
		{/each}

		<!-- current batch marker -->
		<line
			x1={markerX} y1={PAD.top}
			x2={markerX} y2={PAD.top + CH}
			stroke="#6b7280" stroke-width="1" stroke-dasharray="3 2"
		/>
		<text x={markerX + 3} y={PAD.top + 12} font-size="10" fill="#374151">
			batch={$simulation.batchSize}
		</text>
	</svg>

	<div class="bcc__legend">
		<span class="bcc__legend-item bcc__legend-item--std">
			<span class="bcc__swatch bcc__swatch--std"></span>Standard cuBLAS
		</span>
		<span class="bcc__legend-item bcc__legend-item--inv">
			<span class="bcc__swatch bcc__swatch--inv"></span>Batch-Invariant Ops
		</span>
	</div>

	<p class="bcc__disclaimer">
		⚠ Data is illustrative (synthetic). Real numbers depend on GPU architecture and kernels.
		Reference: <a href="https://pytorch.org/docs/stable/deterministic_algorithms.html" rel="noopener" target="_blank">PyTorch deterministic algorithms</a>.
	</p>

	<div class="bcc__toggle-hint">
		The "Batch Invariant" toggle in the control panel shows/hides the invariant line.
	</div>
</div>

<style>
	.bcc {
		background: var(--surface, #fff);
		border: 1px solid var(--hairline, #e5e7eb);
		border-radius: 8px;
		padding: 20px;
		font-size: 14px;
	}
	.bcc__title {
		font-size: 15px;
		font-weight: 700;
		margin: 0 0 12px;
	}
	.bcc__chart {
		display: block;
		max-width: 100%;
		margin-bottom: 10px;
	}
	.bcc__legend {
		display: flex;
		gap: 16px;
		font-size: 12px;
		margin-bottom: 8px;
	}
	.bcc__legend-item {
		display: flex;
		align-items: center;
		gap: 5px;
	}
	.bcc__swatch {
		width: 20px;
		height: 3px;
		border-radius: 2px;
		display: inline-block;
	}
	.bcc__swatch--std {
		background: #3b82f6;
	}
	.bcc__swatch--inv {
		background: #f59e0b;
		border-top: 2px dashed #f59e0b;
		height: 0;
		border-radius: 0;
	}
	.bcc__disclaimer {
		font-size: 12px;
		color: var(--muted, #6b7280);
		margin: 0 0 6px;
		padding: 6px 10px;
		background: #fffbeb;
		border-radius: 4px;
		border-left: 3px solid #f59e0b;
	}
	.bcc__disclaimer a {
		color: var(--accent, #3b82f6);
	}
	.bcc__toggle-hint {
		font-size: 12px;
		color: var(--muted, #6b7280);
	}
</style>
