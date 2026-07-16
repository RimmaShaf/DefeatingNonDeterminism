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
		font-size: clamp(13px, 1.2vw, 15px);
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #2a7de1;
		border: 1px solid #b8cdec;
		border-radius: 999px;
		padding: 5px 14px;
		white-space: nowrap;
	}

	.exf__title {
		flex: 1;
		text-align: left;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: clamp(14px, 1.3vw, 17px);
		color: #5f739c;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.exf__open {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: clamp(14px, 1.3vw, 17px);
		color: #46618f;
		text-decoration: none;
		border: 1px solid #c9d9f0;
		border-radius: 8px;
		padding: 5px 12px;
	}

	.exf__open:hover {
		color: #2a7de1;
		border-color: #2a7de1;
	}

	.exf__frame {
		width: 100%;
		height: min(74vh, 880px);
		border: 1px solid #d7e3f4;
		border-radius: 14px;
		background: #ffffff;
		box-shadow: 0 10px 28px rgba(23, 58, 110, 0.06);
	}

	.exf__note {
		margin: 12px 0 0;
		font-size: clamp(14px, 1.4vw, 18px);
		color: #5f739c;
	}
</style>
