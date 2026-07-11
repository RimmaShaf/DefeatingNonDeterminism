<!--
	Beat: "Fact-check #3 — CPUs are immune." Immunity by lack of
	parallelism is not immunity.
-->
<div class="ca">
	<div class="ca__rows">
		<div class="ca__row">
			<span class="ca__mark ca__mark--ok">✓</span>
			<div class="ca__body">
				<h4 class="ca__title">One thread, one machine</h4>
				<p class="ca__desc">
					One accumulator, one order of additions — the same bits every run. Nothing to report.
				</p>
			</div>
		</div>
		<div class="ca__row">
			<span class="ca__mark ca__mark--bad">✗</span>
			<div class="ca__body">
				<h4 class="ca__title">Many threads</h4>
				<p class="ca__desc">
					OpenMP splits the sum across cores — partial sums merge in whatever order the
					scheduler delivers them. Change <span class="ca__mono">OMP_NUM_THREADS</span>, change the answer.
				</p>
			</div>
		</div>
		<div class="ca__row">
			<span class="ca__mark ca__mark--bad">✗</span>
			<div class="ca__body">
				<h4 class="ca__title">A different machine</h4>
				<p class="ca__desc">
					AVX2 vs AVX-512 vector widths, FMA fusion, libm versions — same math, different
					results. PyTorch won't even promise CPU and GPU agree with identical seeds.
				</p>
			</div>
		</div>
	</div>

	<p class="ca__verdict">
		CPUs aren't immune — they're just usually <em>alone</em>.<br />
		Same arithmetic, fewer threads.
	</p>
</div>

<style>
	.ca {
		width: 100%;
	}

	.ca__rows {
		display: grid;
		gap: 14px;
		text-align: left;
	}

	.ca__row {
		display: flex;
		gap: 16px;
		align-items: flex-start;
		background: #11151d;
		border: 1px solid #232b3b;
		border-radius: 12px;
		padding: 16px 20px;
	}

	.ca__mark {
		font-size: clamp(18px, 2vw, 24px);
		line-height: 1.3;
	}

	.ca__mark--ok {
		color: #6ee7a0;
	}

	.ca__mark--bad {
		color: #ff6b66;
	}

	.ca__title {
		margin: 0 0 6px;
		font-size: clamp(15px, 1.6vw, 20px);
		color: #e8edf7;
	}

	.ca__desc {
		margin: 0;
		font-size: clamp(13px, 1.4vw, 16px);
		line-height: 1.55;
		color: #aab4c8;
	}

	.ca__mono {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 0.9em;
		color: #c9d3e4;
	}

	.ca__verdict {
		margin: 22px 0 0;
		font-size: clamp(16px, 1.9vw, 24px);
		line-height: 1.5;
		color: #c9d3e4;
	}

	.ca__verdict em {
		color: #ffb454;
		font-style: normal;
	}
</style>
