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
		gap: 16px;
		text-align: left;
	}

	.sob__card {
		background: #11151d;
		border: 1px solid #232b3b;
		border-radius: 12px;
		padding: 16px 20px;
	}

	.sob__label {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 12px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #5b6678;
		margin-bottom: 10px;
	}

	.sob__code {
		margin: 0;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: clamp(13px, 1.5vw, 17px);
		line-height: 1.65;
		color: #c9d3e4;
		overflow-x: auto;
	}

	.sob__prompt {
		color: #5b6678;
	}

	.sob__comment {
		color: #5b6678;
	}

	.sob__ok {
		color: #6ee7a0;
	}

	.sob__bad {
		color: #ff6b66;
		font-weight: 700;
	}

	.sob__caption {
		margin: 4px 0 0;
		text-align: center;
		font-size: clamp(15px, 1.7vw, 21px);
		color: #aab4c8;
	}

	.sob__caption strong {
		color: #ffb454;
	}
</style>
