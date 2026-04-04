<script lang="ts">
	import katex from 'katex';

	type MathBlockProps = {
		tex: string;
		displayMode?: boolean;
	};

	let { tex, displayMode = false }: MathBlockProps = $props();

	let containerEl: HTMLSpanElement | null = $state(null);

	$effect(() => {
		if (!containerEl) {
			throw new Error('MathBlock: container element is not mounted');
		}

		containerEl.innerHTML = katex.renderToString(tex, {
			displayMode,
			throwOnError: true,
			output: 'html'
		});
	});
</script>

<span class="math-block" class:math-block--display={displayMode} bind:this={containerEl}></span>

<style>
	.math-block {
		display: inline-block;
		vertical-align: baseline;
	}

	.math-block--display {
		display: block;
		width: 100%;
	}
</style>
