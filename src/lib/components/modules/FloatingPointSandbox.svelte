<script lang="ts">
	import { simulation } from '$lib/stores/simulation';
	import { roundToFloat16 } from '$lib/math/float16';
	import { roundToBfloat16 } from '$lib/math/bf16';
	import type { RoundFn } from '$lib/math/reduction';

	// fp16 max ≈ 65504; 2048+1=2049 rounds to 2048 (b lost), but -2047 is exact → demonstrates non-associativity
	const DEFAULT_VALUES = [2048, 1, -2048];

	let order = $state([0, 1, 2]);

	function move(i: number, dir: -1 | 1) {
		const j = i + dir;
		if (j < 0 || j >= order.length) return;
		const next = [...order];
		[next[i], next[j]] = [next[j], next[i]];
		order = next;
	}

	function getRoundFn(mode: string): RoundFn {
		return mode === 'bf16' ? roundToBfloat16 : roundToFloat16;
	}

	interface Step {
		label: string;
		exact: number;
		rounded: number;
		lostPrecision: boolean;
	}

	function computeSteps(ord: number[], round: RoundFn): { steps: Step[]; trueResult: number; floatResult: number } {
		const [a, b, c] = ord.map((i) => DEFAULT_VALUES[i]);

		const ab_exact = a + b;
		const ab_rounded = round(a + b);
		const abc_exact = a + b + c;
		const abc_rounded = round(ab_rounded + c);

		const trueResult = a + b + c;

		const steps: Step[] = [
			{
				label: `step 1: (${fmt(a)}) + (${fmt(b)})`,
				exact: ab_exact,
				rounded: ab_rounded,
				lostPrecision: ab_exact !== ab_rounded
			},
			{
				label: `step 2: (${fmt(ab_rounded)}) + (${fmt(c)})`,
				exact: abc_exact,
				rounded: abc_rounded,
				lostPrecision: abc_exact !== abc_rounded || ab_exact !== ab_rounded
			}
		];

		return { steps, trueResult, floatResult: abc_rounded };
	}

	function fmt(n: number): string {
		if (Math.abs(n) >= 1e12 || (n !== 0 && Math.abs(n) < 0.001)) return n.toExponential(2);
		return String(n);
	}

	let derived = $derived(computeSteps(order, getRoundFn($simulation.precisionMode)));
</script>

<div class="fps" data-module="A">
	<h4 class="fps__title">Module A — Floating-Point Sandbox</h4>

	<div class="fps__reorder" aria-label="Operand order">
		<p class="fps__reorder-label">Operand order (reorder with ↑↓ buttons):</p>
		<ol class="fps__operands">
			{#each order as idx, i (i)}
				<li class="fps__operand">
					<span class="fps__val">{fmt(DEFAULT_VALUES[idx])}</span>
					<span class="fps__btns">
						<button
							class="fps__btn"
							onclick={() => move(i, -1)}
							disabled={i === 0}
							aria-label="Move up"
						>↑</button>
						<button
							class="fps__btn"
							onclick={() => move(i, 1)}
							disabled={i === order.length - 1}
							aria-label="Move down"
						>↓</button>
					</span>
				</li>
			{/each}
		</ol>
	</div>

	<div class="fps__expr">
		Expression: ({fmt(DEFAULT_VALUES[order[0]])} + {fmt(DEFAULT_VALUES[order[1]])}) + {fmt(DEFAULT_VALUES[order[2]])}
	</div>

	<div class="fps__steps">
		<p class="fps__steps-label">Step-by-step computation ({$simulation.precisionMode}):</p>
		{#each derived.steps as step, i}
			<div class="fps__step" class:fps__step--loss={step.lostPrecision}>
				<span class="fps__step-label">{step.label}</span>
				<span class="fps__step-vals">
					<span class="fps__exact">exact: {fmt(step.exact)}</span>
					<span class="fps__rounded">after rounding: <strong>{fmt(step.rounded)}</strong></span>
					{#if step.lostPrecision}
						<span class="fps__loss-badge">⚠ precision lost</span>
					{/if}
				</span>
			</div>
		{/each}
	</div>

	<div class="fps__results">
		<div class="fps__result-row">
			<span class="fps__result-label">True result (ℝ):</span>
			<span class="fps__result-val fps__result-val--true">{fmt(derived.trueResult)}</span>
		</div>
		<div class="fps__result-row">
			<span class="fps__result-label">Float result ({$simulation.precisionMode}):</span>
			<span
				class="fps__result-val"
				class:fps__result-val--mismatch={derived.trueResult !== derived.floatResult}
			>{fmt(derived.floatResult)}</span>
		</div>
		{#if derived.trueResult !== derived.floatResult}
			<p class="fps__divergence">
				Divergence: {fmt(Math.abs(derived.trueResult - derived.floatResult))}
			</p>
		{:else}
			<p class="fps__nodivergence">Results match for this order.</p>
		{/if}
	</div>
</div>

<style>
	.fps {
		background: var(--surface, #fff);
		border: 1px solid var(--hairline, #e5e7eb);
		border-radius: 8px;
		padding: 20px;
		font-size: 14px;
	}
	.fps__title {
		font-size: 15px;
		font-weight: 700;
		margin: 0 0 14px;
	}
	.fps__reorder-label,
	.fps__steps-label {
		font-size: 13px;
		color: var(--muted, #6b7280);
		margin: 0 0 6px;
	}
	.fps__operands {
		list-style: none;
		margin: 0 0 12px;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.fps__operand {
		display: flex;
		align-items: center;
		gap: 8px;
		background: var(--bg-subtle, #f9fafb);
		border: 1px solid var(--hairline, #e5e7eb);
		border-radius: 4px;
		padding: 4px 8px;
	}
	.fps__val {
		font-family: ui-monospace, monospace;
		font-weight: 600;
		min-width: 80px;
	}
	.fps__btns {
		display: flex;
		gap: 2px;
	}
	.fps__btn {
		background: none;
		border: 1px solid var(--hairline, #e5e7eb);
		border-radius: 3px;
		cursor: pointer;
		padding: 1px 5px;
		font-size: 12px;
		line-height: 1.4;
	}
	.fps__btn:disabled {
		opacity: 0.3;
		cursor: default;
	}
	.fps__expr {
		font-family: ui-monospace, monospace;
		font-size: 13px;
		margin-bottom: 14px;
		color: var(--text, #111);
		background: var(--bg-subtle, #f9fafb);
		padding: 6px 10px;
		border-radius: 4px;
	}
	.fps__steps {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-bottom: 16px;
	}
	.fps__step {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 8px 10px;
		border-radius: 4px;
		background: var(--bg-subtle, #f9fafb);
		border-left: 3px solid transparent;
	}
	.fps__step--loss {
		border-left-color: #f59e0b;
		background: #fffbeb;
	}
	.fps__step-label {
		font-family: ui-monospace, monospace;
		font-size: 13px;
	}
	.fps__step-vals {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		font-size: 13px;
	}
	.fps__exact {
		color: var(--muted, #6b7280);
	}
	.fps__rounded {
		color: var(--text, #111);
	}
	.fps__loss-badge {
		color: #b45309;
		font-weight: 600;
		font-size: 12px;
	}
	.fps__results {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 12px;
		background: var(--bg-subtle, #f9fafb);
		border-radius: 6px;
	}
	.fps__result-row {
		display: flex;
		gap: 8px;
		align-items: baseline;
		font-size: 13px;
	}
	.fps__result-label {
		color: var(--muted, #6b7280);
		min-width: 200px;
	}
	.fps__result-val {
		font-family: ui-monospace, monospace;
		font-weight: 700;
	}
	.fps__result-val--true {
		color: #16a34a;
	}
	.fps__result-val--mismatch {
		color: #dc2626;
	}
	.fps__divergence {
		margin: 4px 0 0;
		font-size: 13px;
		color: #b45309;
		font-weight: 600;
	}
	.fps__nodivergence {
		margin: 4px 0 0;
		font-size: 13px;
		color: #16a34a;
	}
</style>
