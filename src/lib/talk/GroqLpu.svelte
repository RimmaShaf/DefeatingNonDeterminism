<!--
	Beat: "Another way" — Groq LPU: determinism by architecture, not by tax.
	Source: Shanmugavelu et al., arXiv:2408.05148 (ORNL / ETH / Groq).
-->
<script lang="ts">
	import { base } from '$app/paths';
</script>

<div class="gl">
	<div class="gl__panes">
		<div class="gl__pane">
			<h3 class="gl__name">GPU</h3>
			<p class="gl__tagline">improvises at runtime</p>
			<ul class="gl__list">
				<li>hardware scheduler dispatches warps <em>as they come</em></li>
				<li>kernel &amp; tile size picked per batch, per load</li>
				<li>caches, contention, clock — timing leaks into order</li>
				<li>determinism = discipline you must <em>add</em> (and pay for)</li>
			</ul>
		</div>

		<img class="gl__diagram" src="{base}/talk-assets/groqLPU.jpg" alt="GPU vs Groq LPU chip die comparison" />

		<div class="gl__pane gl__pane--lpu">
			<h3 class="gl__name">Groq LPU</h3>
			<p class="gl__tagline">scheduled at compile time</p>
			<ul class="gl__list">
				<li>the compiler plans <em>every add, every cycle</em> before the first byte arrives</li>
				<li>no dynamic scheduler</li>
				<li>one fixed reduction order — the same bits, by construction</li>
				<li>determinism = a property of the <em>architecture</em>, not a tax</li>
			</ul>
		</div>
	</div>

	<p class="gl__source">
		ORNL + Groq measured it (arXiv:2408.05148): bitwise-reproducible inference, and their GNN
		test case ran <strong>~30× faster</strong> than the GPU baseline. Determinism didn't cost
		performance — it <em>was</em> the performance strategy.
	</p>
</div>

<style>
	.gl {
		width: 100%;
	}

	.gl__panes {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 24px;
		text-align: left;
	}

	.gl__pane {
		background: #f6f9fe;
		border: 1px solid #d7e3f4;
		border-radius: 14px;
		padding: 26px 30px;
		box-shadow: 0 10px 28px rgba(23, 58, 110, 0.06);
	}

	.gl__pane--lpu {
		border: 2px solid #2a7de1;
	}

	.gl__name {
		margin: 0 0 4px;
		font-size: clamp(19px, 2vw, 26px);
		color: #14356e;
	}

	.gl__tagline {
		margin: 0 0 16px;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: clamp(11px, 1.1vw, 13px);
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #d6453d;
	}

	.gl__pane--lpu .gl__tagline {
		color: #1d9e57;
	}

	.gl__list {
		margin: 0;
		padding-left: 22px;
		font-size: clamp(14px, 1.4vw, 18px);
		line-height: 1.5;
		color: #3c4f78;
	}

	.gl__list li {
		margin-bottom: 9px;
	}

	.gl__list em {
		color: #2a7de1;
		font-style: normal;
		font-weight: 600;
	}

	.gl__source {
		margin: 26px auto 0;
		max-width: 66ch;
		font-size: clamp(17px, 1.9vw, 24px);
		line-height: 1.55;
		color: #3c4f78;
	}

	.gl__source strong {
		color: #1d9e57;
	}

	.gl__source em {
		font-style: italic;
		color: #14356e;
	}

	.gl__diagram {
		display: block;
		width: min(420px, 38vw);
		height: auto;
		border-radius: 12px;
		border: 1px solid #d7e3f4;
		box-shadow: 0 14px 34px rgba(23, 58, 110, 0.12);
	}

	@media (max-width: 760px) {
		.gl__panes {
			grid-template-columns: 1fr;
		}

		.gl__diagram {
			width: min(320px, 80%);
			margin: 0 auto;
		}
	}
</style>
