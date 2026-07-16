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
		gap: 20px;
		text-align: left;
	}

	.er__guest {
		background: #f6f9fe;
		border: 1px solid #d7e3f4;
		border-radius: 14px;
		padding: 24px 26px;
		box-shadow: 0 10px 28px rgba(23, 58, 110, 0.06);
	}

	.er__num {
		width: 38px;
		height: 38px;
		border-radius: 50%;
		border: 2px solid #2a7de1;
		color: #2a7de1;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 18px;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 12px;
	}

	.er__title {
		margin: 0 0 10px;
		font-size: clamp(20px, 2.2vw, 28px);
		color: #14356e;
	}

	.er__desc {
		margin: 0;
		font-size: clamp(16px, 1.7vw, 22px);
		line-height: 1.55;
		color: #3c4f78;
	}

	.er__desc strong {
		color: #14356e;
	}

	.er__desc em {
		color: #2a7de1;
		font-style: normal;
		font-weight: 600;
	}

	.er__mono {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 0.9em;
		color: #1d2c4e;
	}

	.er__verdict {
		margin: 26px auto 0;
		max-width: 62ch;
		font-size: clamp(18px, 2vw, 26px);
		line-height: 1.55;
		color: #3c4f78;
	}

	.er__verdict strong {
		color: #1d9e57;
	}

	.er__verdict-x {
		color: #d6453d;
	}

	.er__verdict-ok {
		color: #1d9e57;
	}

	@media (max-width: 860px) {
		.er__guests {
			grid-template-columns: 1fr;
		}
	}
</style>
