<!--
	Beat: "Another way" — Groq LPU: determinism by architecture, not by tax.
	Source: Shanmugavelu et al., arXiv:2408.05148 (ORNL / ETH / Groq).
-->
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
		<div class="gl__pane gl__pane--lpu">
			<h3 class="gl__name">Groq LPU</h3>
			<p class="gl__tagline">scheduled at compile time</p>
			<ul class="gl__list">
				<li>the compiler plans <em>every add, every cycle</em> before the first byte arrives</li>
				<li>no dynamic scheduler, no atomics racing for an accumulator</li>
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
		grid-template-columns: 1fr 1fr;
		gap: 20px;
		text-align: left;
	}

	.gl__pane {
		background: #11151d;
		border: 1px solid #232b3b;
		border-radius: 12px;
		padding: 20px 24px;
	}

	.gl__pane--lpu {
		border-color: #2f4a3a;
	}

	.gl__name {
		margin: 0 0 2px;
		font-size: clamp(18px, 2vw, 26px);
		color: #e8edf7;
	}

	.gl__tagline {
		margin: 0 0 14px;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 12px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #5b6678;
	}

	.gl__pane--lpu .gl__tagline {
		color: #6ee7a0;
	}

	.gl__list {
		margin: 0;
		padding-left: 18px;
		font-size: clamp(13px, 1.4vw, 17px);
		line-height: 1.6;
		color: #aab4c8;
	}

	.gl__list li {
		margin-bottom: 7px;
	}

	.gl__list em {
		color: #ffb454;
		font-style: normal;
	}

	.gl__source {
		margin: 20px auto 0;
		max-width: 66ch;
		font-size: clamp(13px, 1.5vw, 18px);
		line-height: 1.55;
		color: #aab4c8;
	}

	.gl__source strong {
		color: #6ee7a0;
	}

	.gl__source em {
		font-style: italic;
		color: #c9d3e4;
	}

	@media (max-width: 760px) {
		.gl__panes {
			grid-template-columns: 1fr;
		}
	}
</style>
