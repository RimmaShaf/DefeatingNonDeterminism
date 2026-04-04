<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	import '../app.css';
	import 'katex/dist/katex.min.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="site-shell">
	{@render children()}
</div>
