<script lang="ts">
	import ArticleSection from '$lib/components/ArticleSection.svelte';
	import Citation from '$lib/components/Citation.svelte';
	import EquationBlock from '$lib/components/EquationBlock.svelte';
	import MarginalNote from '$lib/components/MarginalNote.svelte';
	import SimulationControlPanel from '$lib/components/SimulationControlPanel.svelte';
	import BatchInvarianceCostChart from '$lib/components/modules/BatchInvarianceCostChart.svelte';
	import DemoRecording from '$lib/components/modules/DemoRecording.svelte';
	import FloatingPointSandbox from '$lib/components/modules/FloatingPointSandbox.svelte';
	import KernelParallelismSimulator from '$lib/components/modules/KernelParallelismSimulator.svelte';
	import LiveDeterminismDemo from '$lib/components/modules/LiveDeterminismDemo.svelte';
	import PoemVarianceDemo from '$lib/components/modules/PoemVarianceDemo.svelte';
	import QuantAccumulatorDemo from '$lib/components/modules/QuantAccumulatorDemo.svelte';
	import WeightsFileGag from '$lib/components/modules/WeightsFileGag.svelte';
	import ProofBlock from '$lib/components/ProofBlock.svelte';
	import { CITATION_ORDER, getCitation } from '$lib/content';
</script>

<svelte:head>
	<title>The Determinism Gap</title>
	<meta
		name="description"
		content="An interactive article on LLM nondeterminism at temp=0 and batch invariance at the reduction level."
	/>
</svelte:head>

<header class="site-header">
	<div class="site-header__inner">
		<h1 class="site-title">The Determinism Gap</h1>
		<p class="site-subtitle">
			Article scaffold draft: typography, marginal notes, and slots for interactive demos.
		</p>
	</div>
</header>

<main class="article">
	<h2 class="article__title">Why LLM output drifts even at temperature = 0</h2>
	<p class="article__dek">
		This article is built around three ideas: non-associativity of float addition, how GPU work is distributed across SMs,
		and a fixed reduction tree as the price of determinism. Key references: <Citation citeId="defeating_nondeterminism_blog" /> and
		<Citation citeId="batch_invariant_ops" />.
	</p>

	<div class="article__meta">
		Status: MVP complete — math core (fp16/bf16, reductions), modules A/B/C, proof block.
	</div>

	<SimulationControlPanel />

	<ArticleSection sectionId="sec-weights" title="0. Open the weights file. Just look at it.">
		{#snippet body()}
			<p>
				The entire model is a file full of numbers. Billions of small numbers. Let's open it as text and…
				zoom out. <em>(Yes, we staged this — but the numbers are plausible.)</em>
			</p>
			<WeightsFileGag />
			<p>
				Here's the thing: these numbers are multiplied by the same numbers — and sometimes produce <strong>different</strong> results.
				Why?
			</p>
		{/snippet}
	</ArticleSection>

	<ArticleSection sectionId="sec-float" title="1. Floating-point is not just numbers">
		{#snippet body()}
			<p>
				In real-number arithmetic, addition is associative. In float — it isn't: the rounding order changes the result.
				The classic example: a sum of three numbers where one is "too small" to survive rounding next to a
				much larger neighbor.
			</p>
			<EquationBlock tex={'(a + b) + c \\neq a + (b + c)'} />
			<p>
				Reorder the operands yourself — and watch exactly where the 1 disappears.
			</p>
			<FloatingPointSandbox />
		{/snippet}
		{#snippet marginal()}
			<MarginalNote
				id="note-nonassoc"
				title="Key intuition"
				content={'Float has finite precision. Rounding after every operation turns algebra into a sequence of approximations.'}
			/>
		{/snippet}
	</ArticleSection>

	<ArticleSection sectionId="sec-gpu" title="2. GPU: one request can be split across SMs">
		{#snippet body()}
			<p>
				At small batch sizes, a single matrix operation can be split so that multiple streaming multiprocessors
				contribute partial sums to a shared accumulator. If the contribution order isn't fixed, the result can shift slightly
				due to rounding order — even when the model's "logic" is formally identical.
			</p>
			<p>
				At larger batch sizes the work distribution is more "straightforward": fewer shared reductions, fewer
				races over summation order.
			</p>
			<KernelParallelismSimulator />
		{/snippet}
		{#snippet marginal()}
			<MarginalNote
				id="note-atomic-story"
				title="Simplified model"
				content={'We are deliberately drawing a cartoon here: real kernels are more complex. The goal is to show where the dependence on reduction order originates.'}
			/>
		{/snippet}
	</ArticleSection>

	<ArticleSection sectionId="sec-quant" title='3. "But quantized models have fewer bits!"'>
		{#snippet body()}
			<p>
				The intuition is: if weights are stored in int8, there's "nothing to lose" in precision — no overflow possible.
				Let's test that. Take <em>the same</em> int8 weights and simply change the summation order.
			</p>
			<QuantAccumulatorDemo />
			<p>
				Quantization can actually <em>amplify</em> output drift: see <Citation citeId="quantization_instability" />.
			</p>
		{/snippet}
		{#snippet marginal()}
			<MarginalNote
				id="note-quant"
				title="Myth-bust"
				content={'Dequantization (int8 × scale) is an exact operation. Nondeterminism lives in the accumulator where partial sums are added in fp16/fp32.'}
			/>
		{/snippet}
	</ArticleSection>

	<ArticleSection
		sectionId="sec-invariance"
		title="4. Batch Invariance: the cost of bitwise-consistent reduction"
	>
		{#snippet body()}
			<p>
				The idea behind batch invariance is to force the reduction to follow a fixed tree regardless of batch size. This
				can lower peak throughput, but buys predictability: the same inputs with the same settings
				should always produce the same result.
			</p>
			<EquationBlock
				tex={'\\text{trade-off: peak FLOPS} \\rightarrow \\text{bitwise consistency}'}
				caption="Schematically: trading peak speed for a fixed reduction order."
			/>
			<p>
				A proof block in the spirit of the tests from <Citation citeId="batch_invariant_ops" />: run it and confirm that in
				invariant mode the divergence is strictly zero — bitwise.
			</p>
			<ProofBlock />
			<p>And here is the throughput cost of that determinism:</p>
			<BatchInvarianceCostChart />
		{/snippet}
		{#snippet marginal()}
			<MarginalNote
				id="note-dod"
				title="Readiness criterion"
				content={'The interactive modules should be wired to a single store: batchSize, precisionMode, isBatchInvariant. Any change should instantly update all modules.'}
			/>
		{/snippet}
	</ArticleSection>

	<ArticleSection sectionId="sec-finale" title="5. A deterministic LLM on your laptop — tonight">
		{#snippet body()}
			<p>
				Finale: two runs of the same model at temperature = 0. First — divergence under concurrent load;
				then — byte-identical output with a fixed seed, thread count, and a single isolated request.
			</p>
			<DemoRecording />
			<p>
				Script: <code>scripts/ollama-demo.sh</code> — run it at home, check the sha256 yourself.
			</p>
			<p>
				This one is not a recording. A real local server running GPT-2 is live below: click the button and the
				browser will send a request to an actual PyTorch process on your machine.
			</p>
			<p>
				Each click does exactly this — the same prompt, tokenized once, run through the model's <code
					>forward()</code
				>
				twice in a row, in <code>eval()</code> mode so dropout can't introduce its own randomness:
			</p>
			<pre class="code-block"><code>{`tokenizer = AutoTokenizer.from_pretrained("gpt2")
model = AutoModelForCausalLM.from_pretrained("gpt2")
model.eval()  # disable dropout — we want the deterministic path

inputs = tokenizer(prompt, return_tensors="pt")

with torch.no_grad():
    logits_1 = model(**inputs).logits   # forward pass #1
with torch.no_grad():
    logits_2 = model(**inputs).logits   # forward pass #2, same inputs

identical = torch.equal(logits_1, logits_2)  # bitwise comparison`}</code
				></pre>
			<p>
				<code>model(**inputs)</code> is the forward pass: the prompt's tokens flow through every transformer
				block — attention, then the MLP's matrix multiplies and reductions — and out comes a logits tensor, one
				row of scores over the vocabulary for every input position. Doing that twice, back to back, on the same
				CPU process with no other work interleaved, means the exact same kernels run in the exact same order
				both times. <code>torch.equal</code> checks every element of both tensors bit-for-bit — no tolerance, no
				rounding allowed.
			</p>
			<LiveDeterminismDemo />
			<p>
				What if you remove the local GPU from the equation and ask the same thing of a proprietary
				cloud API? Nondeterminism doesn't disappear — it just moves to the provider's side.
			</p>
			<PoemVarianceDemo />
		{/snippet}
		{#snippet marginal()}
			<MarginalNote
				id="note-finale"
				title="Why a recording"
				content={'The demo was recorded in advance: a conference stage and its Wi-Fi are the worst place for live inference. The script is reproducible locally.'}
			/>
		{/snippet}
	</ArticleSection>

	<section class="article-section article-section--references" aria-labelledby="sec-refs">
		<h3 class="article-section__title" id="sec-refs">References</h3>
		<ol class="references-list">
			{#each CITATION_ORDER as citeKey (citeKey)}
				{@const record = getCitation(citeKey)}
				<li class="references-list__item">
					<a
						class="references-list__link"
						href={record.href}
						rel="noopener noreferrer"
						target="_blank"
					>
						{record.title}
					</a>
					<span class="references-list__sep"> — </span>
					<span class="references-list__url">{record.href}</span>
				</li>
			{/each}
		</ol>
	</section>
</main>

<style>
	.code-block {
		max-width: var(--max-text);
		margin: 16px 0;
		padding: 16px 20px;
		border: 1px solid var(--hairline);
		border-radius: 8px;
		background: #1d2230;
		color: #e0e0e0;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 13px;
		line-height: 1.6;
		overflow-x: auto;
	}

	.article-section__body code {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 0.9em;
	}

	.article-section--references {
		margin-top: 48px;
		padding-top: 24px;
		border-top: 1px solid var(--hairline);
	}

	.references-list {
		margin: 0;
		padding-left: 1.25rem;
		max-width: var(--max-text);
		font-size: 15px;
		line-height: 1.55;
		color: var(--muted);
		font-family:
			ui-sans-serif,
			system-ui,
			-apple-system,
			Segoe UI,
			Roboto,
			Helvetica,
			Arial,
			'Apple Color Emoji',
			'Segoe UI Emoji';
	}

	.references-list__item {
		margin-bottom: 10px;
	}

	.references-list__item:last-child {
		margin-bottom: 0;
	}

	.references-list__link {
		color: var(--accent);
		font-weight: 600;
	}

	.references-list__url {
		word-break: break-all;
		font-size: 13px;
	}

	.references-list__sep {
		color: var(--muted);
	}
</style>
