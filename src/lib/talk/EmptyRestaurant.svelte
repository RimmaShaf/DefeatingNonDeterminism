<!--
	Beat: "Fact-check #2 — I serve the model myself, I'm the only customer."
	Being alone is not the same as batch of one: three hidden co-batchers.
-->
<div class="er">
	<div class="er__guests">
		<div class="er__guest">
			<div class="er__num">1</div>
			<h4 class="er__title">Your own prompt</h4>
			<p class="er__desc">
				<strong>Chunked prefill</strong> splits a long prompt into pieces and batches them —
				you are sharing the table <em>with yourself</em>. Prompt length changes the split;
				the split changes the reduction.
			</p>
		</div>
		<div class="er__guest">
			<div class="er__num">2</div>
			<h4 class="er__title">Empty seats</h4>
			<p class="er__desc">
				Servers keep parallel slots warm (<span class="er__mono">OLLAMA_NUM_PARALLEL</span>,
				vLLM scheduler). The kernel is chosen for the <em>table size</em>, not for how many
				seats are taken.
			</p>
		</div>
		<div class="er__guest">
			<div class="er__num">3</div>
			<h4 class="er__title">The kitchen</h4>
			<p class="er__desc">
				Thread count, KV-cache layout, speculative decoding — the runtime re-plans the work
				under the hood, and every plan is a different <em>order of additions</em>.
			</p>
		</div>
	</div>

	<p class="er__verdict">
		<span class="er__verdict-x">✗</span> Alone ≠ deterministic by default.&nbsp;&nbsp;
		<span class="er__verdict-ok">✓</span> But pin the config — one request, fixed threads, fixed
		slots — and the run is <strong>bitwise reproducible</strong>. Locally, you control the whole restaurant.
	</p>
</div>

<style>
	.er {
		width: 100%;
	}

	.er__guests {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
		text-align: left;
	}

	.er__guest {
		background: #11151d;
		border: 1px solid #232b3b;
		border-radius: 12px;
		padding: 18px 20px;
	}

	.er__num {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		border: 1px solid #34405a;
		color: #ffb454;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 10px;
	}

	.er__title {
		margin: 0 0 8px;
		font-size: clamp(15px, 1.6vw, 20px);
		color: #e8edf7;
	}

	.er__desc {
		margin: 0;
		font-size: clamp(13px, 1.35vw, 16px);
		line-height: 1.55;
		color: #aab4c8;
	}

	.er__desc strong {
		color: #e8edf7;
	}

	.er__desc em {
		color: #ffb454;
		font-style: normal;
	}

	.er__mono {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 0.9em;
		color: #c9d3e4;
	}

	.er__verdict {
		margin: 20px auto 0;
		max-width: 62ch;
		font-size: clamp(14px, 1.6vw, 19px);
		line-height: 1.55;
		color: #aab4c8;
	}

	.er__verdict strong {
		color: #6ee7a0;
	}

	.er__verdict-x {
		color: #ff6b66;
	}

	.er__verdict-ok {
		color: #6ee7a0;
	}

	@media (max-width: 860px) {
		.er__guests {
			grid-template-columns: 1fr;
		}
	}
</style>
