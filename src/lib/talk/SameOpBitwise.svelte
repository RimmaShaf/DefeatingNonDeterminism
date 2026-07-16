<!--
	Beat: "The twist". Kills the lazy "concurrency + floating point" theory:
	the same kernel on the same input is bitwise identical run after run.
	Numbers reproduce the experiment from the Thinking Machines blog post.
-->
<div class="sob">
	<div class="sob__card">
		<div class="sob__label">experiment 1 — run the same op 1000 times</div>
		<pre class="sob__code"><span class="sob__prompt">&gt;&gt;&gt;</span> A = torch.randn(2048, 2048, device='cuda')
<span class="sob__prompt">&gt;&gt;&gt;</span> ref = A @ B
<span class="sob__prompt">&gt;&gt;&gt;</span> max((A @ B - ref).abs().max() for _ in range(1000))
<span class="sob__ok">tensor(0., device='cuda:0')   # 1000 / 1000 bitwise identical</span></pre>
	</div>

	<div class="sob__card">
		<div class="sob__label">experiment 2 — same row, different batch</div>
		<pre class="sob__code"><span class="sob__prompt">&gt;&gt;&gt;</span> out1 = torch.mm(a[:1], b)      <span class="sob__comment"># the row, alone</span>
<span class="sob__prompt">&gt;&gt;&gt;</span> out2 = torch.mm(a, b)[:1]      <span class="sob__comment"># the same row, inside a batch</span>
<span class="sob__prompt">&gt;&gt;&gt;</span> (out1 - out2).abs().max()
<span class="sob__bad">tensor(1669.2500, device='cuda:0')</span></pre>
	</div>

	<p class="sob__caption">
		Run-to-run, the GPU is a machine of perfect habit. Change the <strong>batch</strong> — and the
		kernel changes its plan.
	</p>
</div>

<style>
	.sob {
		width: 100%;
		display: grid;
		gap: 20px;
		text-align: left;
	}

	.sob__card {
		background: #f6f9fe;
		border: 1px solid #d7e3f4;
		border-radius: 14px;
		padding: 22px 28px;
		box-shadow: 0 10px 28px rgba(23, 58, 110, 0.06);
	}

	.sob__label {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: clamp(14px, 1.4vw, 17px);
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #2a7de1;
		margin-bottom: 12px;
	}

	.sob__code {
		margin: 0;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: clamp(17px, 1.9vw, 25px);
		line-height: 1.65;
		color: #1d2c4e;
		overflow-x: auto;
	}

	.sob__prompt {
		color: #7d8db0;
	}

	.sob__comment {
		color: #7d8db0;
	}

	.sob__ok {
		color: #1d9e57;
		font-weight: 700;
	}

	.sob__bad {
		color: #d6453d;
		font-weight: 700;
	}

	.sob__caption {
		margin: 6px 0 0;
		text-align: center;
		font-size: clamp(20px, 2.2vw, 29px);
		color: #3c4f78;
	}

	.sob__caption strong {
		color: #2a7de1;
	}
</style>
