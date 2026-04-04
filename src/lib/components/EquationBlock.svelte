<script lang="ts">
	import MathBlock from '$lib/components/MathBlock.svelte';

	type EquationBlockProps = {
		tex: string;
		displayMode?: boolean;
		caption?: string;
	};

	let { tex, displayMode = true, caption }: EquationBlockProps = $props();
</script>

<figure class="equation-block">
	<div class="math">
		<MathBlock {tex} {displayMode} />
	</div>
	{#if caption}
		<figcaption class="equation-block__caption">{caption}</figcaption>
	{/if}
</figure>

<style>
	.equation-block {
		margin: 0;
	}

	.equation-block__caption {
		margin: 8px 0 0;
		font-size: 13px;
		line-height: 1.45;
		color: var(--muted);
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
	}
</style>
