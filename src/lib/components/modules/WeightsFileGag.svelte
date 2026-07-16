<script lang="ts">
	import { generateWeightsGag } from '$lib/gag/generateWeightsGag';

	const gag = generateWeightsGag(42);

	let zoomedOut = $state(false);
	let sx = $state(1);
	let sy = $state(1);
	let viewportEl: HTMLDivElement | undefined = $state();
	let preEl: HTMLPreElement | undefined = $state();

	function toggleZoom(): void {
		if (!zoomedOut && viewportEl !== undefined && preEl !== undefined) {
			viewportEl.scrollTop = 0;
			viewportEl.scrollLeft = 0;
			// Scale independently on each axis so the grid fills the whole
			// viewport — the mask glyphs are pre-stretched to compensate.
			sx = viewportEl.clientWidth / preEl.offsetWidth;
			sy = viewportEl.clientHeight / preEl.offsetHeight;
		}
		zoomedOut = !zoomedOut;
	}
</script>

<div class="wfg" data-module="gag">
	<div class="wfg__chrome">
		<div class="wfg__traffic" aria-hidden="true">
			<span class="wfg__dot wfg__dot--red"></span>
			<span class="wfg__dot wfg__dot--yellow"></span>
			<span class="wfg__dot wfg__dot--green"></span>
		</div>
		<div class="wfg__filename">model.language_model.layers.5.mlp.down_proj.weight_weights.txt</div>
		<button class="wfg__zoom-btn" onclick={toggleZoom}>
			{zoomedOut ? 'Reset zoom (100%)' : 'Zoom out'}
		</button>
	</div>

	<div class="wfg__viewport" class:wfg__viewport--out={zoomedOut} bind:this={viewportEl}>
		<pre
			class="wfg__pre"
			class:wfg__pre--out={zoomedOut}
			style="--sx: {sx}; --sy: {sy}"
			bind:this={preEl}>{#each gag.rows as row, i (i)}{#each row as seg, j (j)}{#if seg.on}<span
						class="wfg__on">{seg.text}</span>{:else}{seg.text}{/if}{/each}{'\n'}{/each}</pre>
	</div>
</div>

<style>
	.wfg {
		border: 1px solid var(--hairline);
		border-radius: 10px;
		overflow: hidden;
		margin: 24px 0;
		background: #1e1e1e;
	}

	.wfg__chrome {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 12px;
		background: #2d2d2d;
		border-bottom: 1px solid #3c3c3c;
	}

	.wfg__traffic {
		display: flex;
		gap: 6px;
	}

	.wfg__dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
	}

	.wfg__dot--red {
		background: #ff5f57;
	}

	.wfg__dot--yellow {
		background: #febc2e;
	}

	.wfg__dot--green {
		background: #28c840;
	}

	.wfg__filename {
		flex: 1;
		color: #ccc;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 16px;
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.wfg__zoom-btn {
		background: #3c3c3c;
		color: #eee;
		border: none;
		border-radius: 6px;
		padding: 6px 14px;
		font-size: 15px;
		cursor: pointer;
		white-space: nowrap;
	}

	.wfg__zoom-btn:hover {
		background: #4a4a4a;
	}

	.wfg__viewport {
		height: clamp(420px, 62vh, 820px);
		overflow: auto;
	}

	.wfg__viewport--out {
		overflow: hidden;
	}

	.wfg__pre {
		margin: 0;
		padding: 14px 16px;
		width: max-content;
		color: #9cdcfe;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 17px;
		line-height: 1.5;
		transform-origin: top left;
		transition:
			transform 1.8s ease,
			color 1.8s ease;
	}

	.wfg__pre--out {
		transform: scale(var(--sx), var(--sy));
		color: #3f5a78;
	}

	.wfg__on {
		color: inherit;
		transition: color 1.8s ease;
	}

	.wfg__pre--out .wfg__on {
		color: #eaf6ff;
		text-shadow: 0 0 30px rgba(191, 227, 255, 0.9);
	}
</style>
