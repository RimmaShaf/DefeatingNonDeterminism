<!--
	Beat: "Matmul is deterministic. Batch-invariant, it is not."
	Scales the toy 4x3 demo up to a real shape: a wide float weight matrix
	(fixed per model) against a handful of real prompts that happen to
	share a batch. Purely illustrative — static, no interaction.
-->
<script lang="ts">
	const K = 6; // hidden dim (weight rows)
	const P = 14; // output dim (weight columns) — deliberately wide

	// Deterministic pseudo-random-looking floats, so SSR/client markup match
	// and the grid doesn't reshuffle on every reload.
	const WEIGHTS: number[][] = Array.from({ length: K }, (_, r) =>
		Array.from({ length: P }, (_, c) => {
			const v = Math.sin(r * 12.9898 + c * 78.233) * 2.5;
			return Math.round(v * 100) / 100;
		})
	);

	const PROMPTS = [
		{ who: 'User A', text: 'Hello!' },
		{ who: 'User B', text: 'Best mexican food in town?' },
		{ who: 'User C', text: 'Help me with homework' }
	];
</script>

<div class="wpm">
	<div class="wpm__tags">
		<span class="wpm__tag wpm__tag--prompts">Prompts <span class="wpm__dim">this batch</span></span>
		<span class="wpm__tag wpm__tag--weights">Weights <span class="wpm__dim">{K} × {P}, float16</span></span>
	</div>

	<div class="wpm__scene" style="--k: {K}; --p: {P}; --n: {PROMPTS.length};">
		<div class="wpm__weights">
			{#each WEIGHTS as row}
				{#each row as v}
					<div class="wpm__cell" class:neg={v < 0}>{v.toFixed(2)}</div>
				{/each}
			{/each}
		</div>

		{#each PROMPTS as p, i}
			<div class="wpm__pill" style="grid-row: {i + 2};"><b>{p.who}:</b> {p.text}</div>
			<div class="wpm__output-row" style="grid-row: {i + 2};">
				{#each WEIGHTS[0] as _c}
					<div class="wpm__cell wpm__cell--out">·</div>
				{/each}
			</div>
		{/each}
	</div>

	<p class="wpm__caption">
		The three rows on the left are whoever happened to land in this batch together — three
		strangers' prompts, none of which should ever change each other's answer.
	</p>
</div>

<style>
	.wpm {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
	}

	.wpm__tags {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		justify-content: center;
	}

	.wpm__tag {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-weight: 700;
		font-size: clamp(11px, 1.1vw, 14px);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		border-radius: 999px;
		padding: 0.35em 1em;
	}

	.wpm__tag--prompts {
		color: #1e63b8;
		background: #eaf2fe;
		border: 1px solid #b8cdec;
	}

	.wpm__tag--weights {
		color: #1d7a43;
		background: #eaf8ef;
		border: 1px solid #b6e0c4;
	}

	.wpm__dim {
		font-family: ui-serif, Georgia, serif;
		font-weight: 400;
		text-transform: none;
		letter-spacing: normal;
		color: #5f739c;
	}

	.wpm__scene {
		width: 100%;
		max-width: 900px;
		overflow-x: auto;
		padding-bottom: 4px;
		display: grid;
		grid-template-columns: minmax(190px, 230px) 1fr;
		grid-template-rows: auto repeat(var(--n), auto);
		align-items: stretch;
		column-gap: clamp(10px, 1.4vw, 20px);
		row-gap: clamp(3px, 0.4vw, 6px);
	}

	.wpm__weights {
		grid-column: 2;
		grid-row: 1;
		justify-self: end;
		display: grid;
		grid-template-columns: repeat(var(--p), clamp(20px, 2.6vw, 32px));
		gap: clamp(3px, 0.4vw, 6px);
	}

	.wpm__pill {
		grid-column: 1;
	}

	.wpm__output-row {
		grid-column: 2;
		justify-self: end;
		display: grid;
		grid-template-columns: repeat(var(--p), clamp(20px, 2.6vw, 32px));
		gap: clamp(3px, 0.4vw, 6px);
	}

	.wpm__cell {
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 22%;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-weight: 700;
		font-size: clamp(8px, 0.95vw, 11px);
		background: linear-gradient(145deg, #9fdcb4, #6fc08d);
		color: #0c3d22;
		box-shadow:
			inset 0 0.2em 0 rgba(255, 255, 255, 0.4),
			inset 0 -0.22em 0 rgba(0, 0, 0, 0.24),
			0 0.2em 0 rgba(0, 0, 0, 0.26);
	}

	.wpm__cell.neg {
		background: linear-gradient(145deg, #f5b3ae, #e08880);
		color: #5a1410;
	}

	.wpm__cell--out {
		background: rgba(42, 125, 225, 0.06);
		border: 2px dashed rgba(42, 125, 225, 0.35);
		color: #1e63b8;
		box-shadow: none;
		font-weight: 400;
		font-size: clamp(11px, 1.1vw, 14px);
	}

	.wpm__pill {
		display: flex;
		align-items: center;
		min-height: clamp(20px, 2.6vw, 32px);
		background: linear-gradient(145deg, #9ec7f0, #6ba3dd);
		color: #0d2c55;
		border-radius: 12px;
		padding: 0.5em 0.85em;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: clamp(10px, 1.05vw, 13px);
		line-height: 1.35;
		box-shadow:
			inset 0 0.2em 0 rgba(255, 255, 255, 0.4),
			inset 0 -0.22em 0 rgba(0, 0, 0, 0.22),
			0 0.2em 0 rgba(0, 0, 0, 0.24);
	}

	.wpm__pill b {
		color: #b96a10;
		font-weight: 800;
		margin-right: 0.4em;
	}

	.wpm__caption {
		max-width: 760px;
		text-align: center;
		font-size: clamp(13px, 1.3vw, 16px);
		color: #5f739c;
		line-height: 1.6;
	}

	.wpm__caption strong {
		color: #1d2c4e;
	}
</style>
