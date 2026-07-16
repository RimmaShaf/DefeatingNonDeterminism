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
		gap: 18px;
		text-align: left;
	}

	.ca__row {
		display: flex;
		gap: 20px;
		align-items: flex-start;
		background: #f6f9fe;
		border: 1px solid #d7e3f4;
		border-radius: 14px;
		padding: 22px 28px;
		box-shadow: 0 10px 28px rgba(23, 58, 110, 0.06);
	}

	.ca__mark {
		font-size: clamp(24px, 2.6vw, 34px);
		line-height: 1.3;
	}

	.ca__mark--ok {
		color: #1d9e57;
	}

	.ca__mark--bad {
		color: #d6453d;
	}

	.ca__title {
		margin: 0 0 8px;
		font-size: clamp(20px, 2.2vw, 28px);
		color: #14356e;
	}

	.ca__desc {
		margin: 0;
		font-size: clamp(17px, 1.8vw, 23px);
		line-height: 1.55;
		color: #3c4f78;
	}

	.ca__mono {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 0.9em;
		color: #1d2c4e;
	}

	.ca__verdict {
		margin: 26px 0 0;
		font-size: clamp(21px, 2.4vw, 32px);
		line-height: 1.5;
		color: #1d2c4e;
	}

	.ca__verdict em {
		color: #2a7de1;
		font-style: normal;
		font-weight: 700;
	}
</style>
