<script lang="ts">
	import type { Snippet } from 'svelte';

	type ArticleSectionProps = {
		sectionId: string;
		title: string;
		body: Snippet;
		marginal?: Snippet;
	};

	let { sectionId, title, body, marginal }: ArticleSectionProps = $props();
</script>

<section class="article-section" aria-labelledby={sectionId}>
	<h3 class="article-section__title" id={sectionId}>{title}</h3>

	{#if marginal}
		<div class="article-row">
			<div class="article-section__body">
				{@render body()}
			</div>
			{@render marginal()}
		</div>
	{:else}
		<div class="article-section__body">
			{@render body()}
		</div>
	{/if}
</section>
