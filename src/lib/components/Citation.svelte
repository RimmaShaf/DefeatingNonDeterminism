<script lang="ts">
	import { getCitation, type CitationId } from '$lib/content/citations';

	type CitationProps = {
		citeId: CitationId;
	};

	let { citeId }: CitationProps = $props();

	const citation = $derived(getCitation(citeId));
</script>

<a
	class="citation"
	href={citation.href}
	title={citation.title}
	rel="noopener noreferrer"
	target="_blank"
>
	{citation.label}
</a>

<style>
	.citation {
		font-family:
			ui-sans-serif,
			system-ui,
			-apple-system,
			Segoe UI,
			Roboto,
			Helvetica,
			Arial,
			'Apple Color Emoji',
			'Segoe UI Emoji';
		font-size: 0.95em;
		white-space: nowrap;
	}
</style>
