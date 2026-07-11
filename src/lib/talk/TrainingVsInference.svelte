<!--
	Beat: "Prior record". The ML reproducibility crisis was always about
	TRAINING. Inference of a frozen model was the part everyone trusted.
-->
<div class="tvi">
	<div class="tvi__panes">
		<div class="tvi__pane">
			<div class="tvi__head">
				<span class="tvi__badge tvi__badge--old">old news</span>
				<h3 class="tvi__name">Training</h3>
			</div>
			<p class="tvi__claim">same code + same data + same seeds<br />→ <em>two different models</em></p>
			<ul class="tvi__facts">
				<li><strong>70%</strong> of researchers failed to reproduce someone else's experiment (Nature survey)</li>
				<li>up to <strong>10.8%</strong> accuracy swing from implementation noise alone</li>
				<li>cuDNN <em>races</em> algorithms at startup — the winner varies run to run</li>
			</ul>
			<p class="tvi__verdict tvi__verdict--old">Known dice-rolling. Documented. Priced in.</p>
		</div>

		<div class="tvi__pane tvi__pane--new">
			<div class="tvi__head">
				<span class="tvi__badge tvi__badge--new">breaking news</span>
				<h3 class="tvi__name">Inference</h3>
			</div>
			<p class="tvi__claim">frozen weights + same prompt + temperature 0<br />→ <em>different answers</em></p>
			<ul class="tvi__facts">
				<li>no gradients, no shuffling, no seeds — nothing left to randomize</li>
				<li>greedy decoding: always pick the <strong>argmax</strong> token</li>
				<li>a pure function of its inputs. On paper.</li>
			</ul>
			<p class="tvi__verdict tvi__verdict--new">This was supposed to be arithmetic.</p>
		</div>
	</div>
</div>

<style>
	.tvi {
		width: 100%;
	}

	.tvi__panes {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;
		text-align: left;
	}

	.tvi__pane {
		background: #11151d;
		border: 1px solid #232b3b;
		border-radius: 12px;
		padding: 20px 24px;
	}

	.tvi__pane--new {
		border-color: #5a3030;
	}

	.tvi__head {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 14px;
	}

	.tvi__badge {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 11px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		border-radius: 999px;
		padding: 4px 10px;
	}

	.tvi__badge--old {
		color: #8b95a7;
		border: 1px solid #2a3242;
	}

	.tvi__badge--new {
		color: #ff6b66;
		border: 1px solid #5a3030;
	}

	.tvi__name {
		margin: 0;
		font-size: clamp(18px, 2vw, 26px);
		color: #e8edf7;
	}

	.tvi__claim {
		margin: 0 0 14px;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: clamp(13px, 1.4vw, 16px);
		line-height: 1.55;
		color: #c9d3e4;
	}

	.tvi__claim em {
		color: #ffb454;
		font-style: normal;
	}

	.tvi__facts {
		margin: 0 0 14px;
		padding-left: 18px;
		font-size: clamp(13px, 1.4vw, 16px);
		line-height: 1.6;
		color: #aab4c8;
	}

	.tvi__facts li {
		margin-bottom: 6px;
	}

	.tvi__facts strong {
		color: #e8edf7;
	}

	.tvi__verdict {
		margin: 0;
		font-size: clamp(13px, 1.4vw, 16px);
		font-style: italic;
	}

	.tvi__verdict--old {
		color: #5b6678;
	}

	.tvi__verdict--new {
		color: #ff6b66;
	}

	@media (max-width: 760px) {
		.tvi__panes {
			grid-template-columns: 1fr;
		}
	}
</style>
