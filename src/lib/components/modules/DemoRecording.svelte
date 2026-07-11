<script lang="ts">
	import { onMount } from 'svelte';

	const VIDEO_SRC = '/ollama-demo.mp4';

	let status = $state<'checking' | 'available' | 'missing'>('checking');

	onMount(async () => {
		const res = await fetch(VIDEO_SRC, { method: 'HEAD' });
		status = res.ok ? 'available' : 'missing';
	});
</script>

<div class="dr" data-module="recording">
	<h4 class="dr__title">Demo: Deterministic LLM on a laptop (Ollama)</h4>

	{#if status === 'checking'}
		<div class="dr__status">Checking for recording…</div>
	{:else if status === 'available'}
		<!-- svelte-ignore a11y_media_has_caption -->
		<video class="dr__video" controls preload="metadata" src={VIDEO_SRC}></video>
	{:else}
		<div class="dr__placeholder" role="alert">
			<strong>Recording not yet made.</strong>
			Run <code>scripts/ollama-demo.sh</code>, record the screen, and place the file at
			<code>static/ollama-demo.mp4</code> (plan 2.3: divergence → convergence, sha256 of both runs).
		</div>
	{/if}
</div>

<style>
	.dr {
		border: 1px solid var(--hairline);
		border-radius: 10px;
		padding: 16px;
		margin: 24px 0;
	}

	.dr__title {
		margin: 0 0 12px;
		font-size: 15px;
	}

	.dr__status {
		color: var(--muted);
		font-size: 14px;
	}

	.dr__video {
		width: 100%;
		border-radius: 8px;
		background: #000;
	}

	.dr__placeholder {
		border: 2px dashed #d99;
		border-radius: 8px;
		padding: 16px;
		font-size: 14px;
		background: #fdf3f3;
		line-height: 1.5;
	}

	.dr__placeholder code {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 13px;
		background: #f3e3e3;
		padding: 1px 4px;
		border-radius: 4px;
	}
</style>
