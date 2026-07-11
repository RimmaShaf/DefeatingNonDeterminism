<script lang="ts">
	import { base } from '$app/paths';

	// Embeds a self-contained HTML exhibit (from static/talk-embeds/) as a
	// full-width interactive frame inside a beat.
	let {
		src,
		title,
		note = ''
	}: {
		src: string;
		title: string;
		note?: string;
	} = $props();

	// Callers pass root-absolute paths; prefix the base so exhibits also load
	// when the site is served from a subpath (GitHub Pages).
	let url = $derived(base + src);
</script>

<div class="exf">
	<div class="exf__chrome">
		<span class="exf__chip">interactive exhibit</span>
		<span class="exf__title">{title}</span>
		<a class="exf__open" href={url} target="_blank" rel="noopener noreferrer">open ↗</a>
	</div>
	<iframe class="exf__frame" src={url} {title} loading="lazy"></iframe>
	{#if note}
		<p class="exf__note">{note}</p>
	{/if}
</div>

<style>
	.exf {
		width: 100%;
	}

	.exf__chrome {
		display: flex;
		align-items: center;
		gap: 14px;
		margin-bottom: 10px;
	}

	.exf__chip {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 11px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #ffb454;
		border: 1px solid #4a3a22;
		border-radius: 999px;
		padding: 4px 10px;
		white-space: nowrap;
	}

	.exf__title {
		flex: 1;
		text-align: left;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 13px;
		color: #8b95a7;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.exf__open {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 13px;
		color: #8b95a7;
		text-decoration: none;
		border: 1px solid #2a3242;
		border-radius: 8px;
		padding: 4px 10px;
	}

	.exf__open:hover {
		color: #e8edf7;
		border-color: #34405a;
	}

	.exf__frame {
		width: 100%;
		height: min(62vh, 640px);
		border: 1px solid #232b3b;
		border-radius: 12px;
		background: #0a0d13;
	}

	.exf__note {
		margin: 10px 0 0;
		font-size: 13px;
		color: #5b6678;
	}
</style>
