<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';

	import ColdOpenDivergence from '$lib/talk/ColdOpenDivergence.svelte';
	import TrainingVsInference from '$lib/talk/TrainingVsInference.svelte';
	import SameOpBitwise from '$lib/talk/SameOpBitwise.svelte';
	import EmptyRestaurant from '$lib/talk/EmptyRestaurant.svelte';
	import CpuFactCheck from '$lib/talk/CpuFactCheck.svelte';
	import GroqLpu from '$lib/talk/GroqLpu.svelte';
	import ExhibitFrame from '$lib/talk/ExhibitFrame.svelte';
	import WeightsPromptsMatrix from '$lib/talk/WeightsPromptsMatrix.svelte';
	import BatchInvarianceCostChart from '$lib/components/modules/BatchInvarianceCostChart.svelte';
	import DemoRecording from '$lib/components/modules/DemoRecording.svelte';
	import KernelParallelismSimulator from '$lib/components/modules/KernelParallelismSimulator.svelte';
	import LiveDeterminismDemo from '$lib/components/modules/LiveDeterminismDemo.svelte';
	import LiveDeterminismTalkDemo from '$lib/components/modules/LiveDeterminismTalkDemo.svelte';
	import PoemVarianceDemo from '$lib/components/modules/PoemVarianceDemo.svelte';
	import PoemVarianceGroqDemo from '$lib/components/modules/PoemVarianceGroqDemo.svelte';
	import PoemVarianceVllmDemo from '$lib/components/modules/PoemVarianceVllmDemo.svelte';
	import PoemVarianceVllmTempDemo from '$lib/components/modules/PoemVarianceVllmTempDemo.svelte';
	import QuantAccumulatorDemo from '$lib/components/modules/QuantAccumulatorDemo.svelte';
	import WeightsFileGag from '$lib/components/modules/WeightsFileGag.svelte';
	import ProofBlock from '$lib/components/ProofBlock.svelte';
	import SimulationControlPanel from '$lib/components/SimulationControlPanel.svelte';
	import { initTalkMode, setCurrentBeat, talkMode } from '$lib/stores/talkMode';
	import { CITATION_ORDER, getCitation } from '$lib/content/citations';

	// Beats are numbered by DOM order — add/move/remove <section class="beat">
	// freely, just keep TOTAL_BEATS equal to the number of sections.
	const TOTAL_BEATS = 29;

	const THINKING_MACHINES_IDS = new Set(['defeating_nondeterminism_blog', 'batch_invariant_ops']);

	// Decorative line-art pattern, used sparingly (cold open + epilogue).
	const patternStyle = `--pattern: url('${base}/talk-assets/pattern-blue.jpg')`;
	initTalkMode(true, TOTAL_BEATS);

	let deckEl: HTMLElement;

	// "Squished" = layout adjusted for rooms where the bottom third of the
	// screen is cut off (e.g. by a lectern or a low projector edge).
	// Toggle with the "S" key or the on-screen button; persists across reloads.
	let squished = $state(false);

	function setSquished(value: boolean): void {
		squished = value;
		try {
			localStorage.setItem('talk-squished', value ? '1' : '0');
		} catch {
			// localStorage may be unavailable (e.g. private browsing); ignore.
		}
	}

	function toggleSquished(): void {
		setSquished(!squished);
	}

	function beatElements(): HTMLElement[] {
		return Array.from(deckEl.querySelectorAll<HTMLElement>('.beat'));
	}

	function goTo(beat: number): void {
		const clamped = Math.min(Math.max(beat, 1), TOTAL_BEATS);
		beatElements()[clamped - 1].scrollIntoView({ behavior: 'smooth' });
	}

	function onKeydown(event: KeyboardEvent): void {
		if (event.key === 'ArrowDown' || event.key === 'ArrowRight' || event.key === 'PageDown') {
			event.preventDefault();
			goTo($talkMode.currentBeat + 1);
		} else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft' || event.key === 'PageUp') {
			event.preventDefault();
			goTo($talkMode.currentBeat - 1);
		} else if (event.key === 'Home') {
			event.preventDefault();
			goTo(1);
		} else if (event.key === 'End') {
			event.preventDefault();
			goTo(TOTAL_BEATS);
		} else if (event.key === 's' || event.key === 'S') {
			event.preventDefault();
			toggleSquished();
		}
	}

	onMount(() => {
		try {
			setSquished(localStorage.getItem('talk-squished') === '1');
		} catch {
			// localStorage may be unavailable (e.g. private browsing); ignore.
		}

		const els = beatElements();
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						setCurrentBeat(els.indexOf(entry.target as HTMLElement) + 1);
					}
				}
			},
			{ root: deckEl, threshold: 0.55 }
		);
		for (const el of els) observer.observe(el);
		return () => observer.disconnect();
	});
</script>

<svelte:head>
	<title>The Determinism Gap — Talk</title>
</svelte:head>

<svelte:window onkeydown={onKeydown} />

<div class="deck" class:squished bind:this={deckEl}>
	<!-- ═══════════ TITLE ═══════════ -->

	<!-- OPENING SLIDE -->
	<section class="beat beat--title">
		<div class="beat__title-copy">
			<h1 class="beat__title-statement">
				Why Exactly are LLMs Non-Deterministic? <span class="hl"><br>Can We Tame This Probabilistic Beast?</span>
			</h1>
			<div class="beat__title-byline">
				<p class="beat__title-name">Rimma Shafikova</p>
				<p class="beat__title-role">Senior Data Scientist @ VGW</p>
			</div>
		</div>
		<div class="beat__title-art-wrap">
			<img
				class="beat__title-art"
				src="{base}/talk-assets/hero-image.jpg"
				alt=""
			/>
			<a
				class="beat__title-credit"
				href="https://www.behance.net/brianomolo"
				target="_blank"
				rel="noreferrer"
			>
				Design inspiration: behance.net/brianomolo
			</a>
		</div>
		<div class="beat__title-qr">
			<img
				class="beat__title-qr-img"
				src="{base}/talk-assets/mrx2jf6j-qr.png"
				alt="QR code linking to the talk materials"
			/>
			<a class="beat__title-qr-link" href="https://tinyurl.com/mrx2jf6j" target="_blank" rel="noreferrer">
				tinyurl.com/mrx2jf6j
			</a>
		</div>
	</section>

	<!-- ═══════════ ACT I · THE ANOMALY ═══════════ -->

	<!-- COLD OPEN -->
	<section class="beat beat--pattern" style={patternStyle}>
		<p class="beat__kicker">Act I · The anomaly</p>
		<h1 class="beat__statement beat__statement">
			Nobody touched <span class="hl">anything</span>.
		</h1>
		<div class="beat__demo beat__demo--bare">
			<ColdOpenDivergence />
		</div>
	</section>

		<!-- LIVE EVIDENCE — 100× to the cloud, temperature 0 -->
	<section class="beat">
		<p class="beat__kicker">Act I · Live evidence</p>
		<h1 class="beat__statement">Temperature = 0 is not the fix</h1>
		<!-- <p class="beat__sub">
			<span class="mono">claude-sonnet-4-6</span>, one prompt, <span class="hl">100 calls</span>,
			temperature 0 — formally the “deterministic” mode.
		</p> -->
		<details class="beat__code">
			<summary>Show the exact API call</summary>
			<pre><code>{`import Anthropic from '@anthropic-ai/sdk';

const PROMPT =
'Write a highly creative four-line poem about a clock that counts backward.';

for (let i = 0; i < 100; i++) {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 200,
    temperature: 0, // the "deterministic" mode
    thinking: { type: 'disabled' },
    messages: [{ role: 'user', content: PROMPT }]
  });
}`}</code></pre>
		</details>
		<div class="beat__demo beat__demo--wide">
			<PoemVarianceDemo />
		</div>
	
	</section>


	<!-- SKEPTICS — three quick objections, one slide -->
	<section class="beat">
		<p class="beat__kicker">Act I · The skeptics</p>
		<h1 class="beat__statement">Three <span class="hl">objections</span>, before we start.</h1>
		<div class="beat__demo beat__demo--bare beat__demo--wide beat__triad">
			<div class="skeptic-card">
				<p class="skeptic-card__quote">
					“You shouldn't <span class="hl">want</span> deterministic answers.”
				</p>
				<p class="skeptic-card__body">
					“Deterministic AI is what we had pre-2017... funny how people forgot.”<br />
					“If you want LLMs to do determinism, you're not using them properly.”
				</p>
			</div>
			<div class="skeptic-card">
				<p class="skeptic-card__quote">
					“That's just the <span class="hl">reproducibility crisis</span>. Old news.”
				</p>
				<p class="skeptic-card__body">
					<em>“Can Neural Nets Learn the Same Model Twice?”</em> (Somepalli et al., CVPR 2022) —
					train the same net twice, get visibly different decision boundaries.
					<span class="hl">“Deep learning rolls dice. Go do something else.”</span>
				</p>
			</div>
			<div class="skeptic-card">
				<p class="skeptic-card__quote">“GPUs are just <span class="hl">random</span>.”</p>
				<p class="skeptic-card__body">
					Case closed. Accept and move on.
					<span class="hl">“The vendors confessed years ago. But confession is not an explanation.”</span>
				</p>
			</div>
		</div>
	</section>



	

	<!-- THE STAKES 1/3 — TRUST -->
	<section class="beat">
		<p class="beat__kicker">Act I · What's at stake — Trust</p>
		<h1 class="beat__statement">A glitch in the <span class="hl">matrix</span></h1>
		<div class="beat__demo beat__demo--bare beat__demo--wide stake-solo">
			<img
				class="stake-solo__art"
				src="{base}/talk-assets/robot-temp0.jpg"
				alt="Friendly robot with a factory-reset dial set to temperature 0"
			/>
			<div class="stake-solo__body">
				<p class="stake-solo__caption">
					Factory reset to <span class="mono">deterministic mode</span> — replay the exact
					failure, get the exact same answer, <span class="hl">actually debug it</span>.
					Without determinism, “reproduce the bug” stops meaning anything — every rerun is a fresh roll of the dice.
				</p>
				<!-- <ul class="stake-solo__list">
					<li>
						A user reports a bad answer. You rerun the same prompt and get something
						<span class="hl">different</span>. Did you fix it, or just get lucky?
					</li>
					<li>
						An agent reasons about which tool to call. Decides to call 'Websearching' instead of 'Websearch'
					</li>
					<li>
						Deterministic replay turns “it happened once” into “here's exactly why”.
					</li>
				</ul> -->
			</div>
		</div>
	</section>

	<!-- THE STAKES 2/3 — BENCHMARKS -->
	<section class="beat">
		<p class="beat__kicker">Act I · What's at stake — Benchmarks</p>
		<h1 class="beat__statement">An eval score should be a <span class="hl">fact</span>, not a guess.</h1>
		<div class="beat__demo beat__demo--bare beat__demo--wide stake-solo">
			<img
				class="stake-solo__art"
				src="{base}/talk-assets/bf16-aime24-boxplot.png"
				alt="Box plot: AIME'24 accuracy of four models varies run to run under BFloat16"
			/>
			<div class="stake-solo__body">
				<p class="stake-solo__caption">
					Same model, same questions — and accuracy is a <span class="hl">box plot</span>.
					Determinism makes an eval score a fact, not a distribution.
				</p>
				<!-- <ul class="stake-solo__list">
					<li>
						Leaderboards report a single number. Underneath, that number moved every time
						someone reran the benchmark.
					</li>
					<li>
						Two models a point apart on a leaderboard might just be two draws from
						<span class="hl">overlapping distributions</span>.
					</li>
					<li>
						Non-determinism doesn't just add noise — it erodes what “state of the art” is even
						supposed to mean.
					</li>
				</ul> -->
				<p class="stake-solo__source">“Give Me FP32 or Give Me Death?” · Yuan et al., 2025</p>
			</div>
		</div>
	</section>

	<!-- THE STAKES 3/3 — SAFETY-CRITICAL -->
	<section class="beat">
		<p class="beat__kicker">Act I · What's at stake — Safety-critical</p>
		<h3 class="beat__statement">Determinism makes a model <span class="strike">correct</span> accountable.</h3>
		<div class="beat__demo beat__demo--bare beat__demo--wide stake-solo">
			<img
				class="stake-solo__art"
				src="{base}/talk-assets/medical_brain.jpg"
				alt="Medical AI device analyzing a brain scan"
			/>
			<div class="stake-solo__body">
				<p class="stake-solo__caption">
					A diagnostic model on a hospital device: same scan, <span class="hl">same answer,
					every run</span>. It could at least be run-to-run deterministic.
				</p>
				<ul class="stake-solo__list">
					<!-- <li>
						Regulatory approval assumes a fixed, auditable pipeline — not one that quietly
						reshuffles floating-point operations under load.
					</li>
					<li>
						“The model said something different on the retest” is not an answer a clinician —
						or a court — will accept.
					</li> -->
					<li>
						FDA cleared first patient-facing GenAI app.<span class="hl">Is it really so?</span>.
					</li>
				</ul>
			</div>
		</div>
	</section>

	<!-- REFERENCES -->
	<section class="beat">
		<p class="beat__kicker">References</p>
		<h3 class="beat__statement">Work of the <span class="hl">Thinking Machines'</span></h3>
		<p class="beat__sub">
			This talk inspiration is one team's research and the engineering they shipped
			to fix it.
		</p>
		<ul class="refs">
			{#each CITATION_ORDER as citeKey (citeKey)}
				{@const record = getCitation(citeKey)}
				{@const featured = THINKING_MACHINES_IDS.has(citeKey)}
				<li class="refs__item" class:refs__item--featured={featured}>
					{#if featured}
						<span class="refs__badge">Thinking Machines</span>
					{/if}
					<a class="refs__link" href={record.href} target="_blank" rel="noreferrer">
						{record.title}
					</a>
					<span class="refs__url">{record.href}</span>
				</li>
			{/each}
		</ul>
	</section>
	


	<!-- THE EVIDENCE -->
	<section class="beat">
		<p class="beat__kicker">Act I · Ghost in the machine</p>
		<h2 class="beat__statement">The weights <span class="hl">never change</span>.</h2>
		<div class="beat__demo beat__demo--bare beat__demo--wide">
			<WeightsFileGag />
		</div>
		<!-- <p class="beat__sub">I downloaded gemma4 weights. It is a file of numbers. Frozen. So who's changing the answer?</p> -->
	</section>

	<!-- ═══════════ ACT II · THE MECHANISM ═══════════ -->

	<!-- FIRST CRACK — 0.1 + 0.2, live Python -->
	 <!--note="Real Python (Pyodide/WASM) — loads from CDN, give it a few seconds on stage."/-->
	<section class="beat">
		<p class="beat__kicker">Act II · CS crushes your soul</p>
		<h2 class="beat__statement">
			<span class="mono">What is <span class="hl"> 0.1 + 0.2</span> ?</span>
		</h2>
		<div class="beat__demo beat__demo--bare beat__demo--wide">
			<ExhibitFrame
				src="/talk-embeds/python-terminal.html"
				title="Live Python in the browser — type 0.1 + 0.2 yourself"/>
			
			
		</div>
		<p class="beat__sub">
			Real numbers can't be faithfully represented with floating point arithmetics.
		</p>
	</section>

	<!-- UNDER THE HOOD — how a float is actually stored -->
	<section class="beat">
		<p class="beat__kicker">Act II · Under the hood</p>
		<h3 class="beat__statement">Floating points lead to <span class="hl">rounding errors</span></h3>
		<div class="beat__demo beat__demo--bare fp-anatomy">
			<p class="fp-anatomy__formula">
				value = <span class="fp-s">±1</span> · 2<sup><span class="fp-e">E−1023</span></sup> ·
				<span class="fp-m">1.mantissa</span>
			</p>
			<div class="fp-anatomy__layout">
				<div class="fp-seg fp-seg--s">1<span>sign</span></div>
				<div class="fp-seg fp-seg--e">11<span>exponent</span></div>
				<div class="fp-seg fp-seg--m">52<span>mantissa</span></div>
			</div>
			<p class="fp-anatomy__note">
				float64 — the default in Python, JavaScript, NumPy. 52 mantissa bits, then the cliff.
			</p>
			<div class="fp-anatomy__expansion mono">
				0.1&nbsp;=&nbsp;0.<span class="fp-kept"
					>0001100110011001100110011001100110011001100110011001100</span
				><span class="fp-edge"></span><span class="fp-lost">110011001100… forever</span>
			</div>
			<p class="fp-anatomy__note">
				In binary, 0.1 repeats <span class="hl">forever</span> — like ⅓ in decimal. The register
				keeps 52 bits and rounds: what's stored is
				<span class="mono">0.10000000000000000555…</span>
			</p>
			<div class="fp-anatomy__sum mono">
				0.1 + 0.2 = <span class="fp-lost-strong">0.30000000000000004</span>
			</div>
		</div>
		<p class="beat__sub">
			Two rounded inputs, one rounded sum — one wrong answer.<br />
			<span class="hl">Has it caused trouble before?</span>
		</p>
	</section>

	<!-- CASE FILE — the Patriot clock, 1991 -->
	<section class="beat">
		<p class="beat__kicker">Act II · Case file, 1991</p>
		<h1 class="beat__statement">The clock that <span class="hl">chopped 0.1</span>.</h1>
		<div class="beat__demo beat__demo--bare beat__demo--wide">
			<ExhibitFrame
				src="/talk-embeds/patriot-clock.html"
				title="The Patriot bug — 0.1 is not a binary number"
			/>
		</div>
		<!-- <p class="beat__sub">
			The Patriot's 24-bit register chopped 0.1's infinite tail — losing
			<span class="mono">9.5×10⁻⁸ s</span> every tick,
			<span class="hl">always in the same direction</span>, ten times a second. After 100 hours
			of uptime the clock was 0.34 s slow, and the radar's range gate looked half a kilometer
			from the target. 28 people died of a truncation error.
		</p> -->
	</section>

	<!-- EXHIBIT A — inside a bf16 add -->
	<section class="beat">
		<p class="beat__kicker">Act II · Exhibit A</p>
		<h1 class="beat__statement">Summing up trouble leads to <span class="hl">more trouble</span></h1>
		<div class="beat__demo beat__demo--bare beat__demo--wide">
			<ExhibitFrame
				src="/talk-embeds/fp-cubes.html"
				title="Inside a BF16 add — where the mantissa falls off the shelf"
			/>
		</div>
	</section>

	<!-- THE MECHANISM -->
	<section class="beat">
		<p class="beat__kicker">Act II · The mechanism</p>
		<h1 class="beat__statement">
			<span class="mono">(a + b) + c&nbsp;≠&nbsp;a + (b + c)</span>
		</h1>
		<!-- <p class="beat__sub">
			Floating-point addition is <span class="hl">not associative</span>.
		</p> -->
		<div class="beat__demo beat__demo--bare beat__demo--wide">
			<ExhibitFrame
				src="/talk-embeds/fp-grid.html"
				title="100 shuffled sums of the same 8 numbers, each mathematically zero"
			/>
		</div>
	</section>

	<!-- ATOMIC ADD — guarantees delivery, not order -->
	<section class="beat">
		<p class="beat__kicker">Act II · Blame the GPUs</p>
		<h1 class="beat__statement">
			Atomic add guarantees <span class="hl">delivery</span>, not <span class="hl">order</span>.
		</h1>
		<!-- <p class="beat__sub">
			When many cores must accumulate into one shared value, the kernel reaches for an
			<span class="mono">atomic add</span>. It guarantees every core's contribution lands — it makes
			<span class="hl">no promise about the order</span> they arrive in.
		</p> -->
		<div class="beat__demo beat__demo--bare beat__demo--wide">
			<ExhibitFrame
				src="/talk-embeds/atomic-add-figure2.html"
				title=""
			/>
		</div>
		
	</section>

		
	<!-- THE TWIST — the math alone checks out -->
	<section class="beat">
		<p class="beat__kicker">Act II · The twist</p>
		<h1 class="beat__statement">
		Atomic adds aren't used anywhere! 
		</h1>
		<p class="beat__sub">
		The forward pass of an LLM involves no operations that require atomic adds. 
        The forward pass in an LLM is in fact <span class="hl">“run-to-run deterministic”</span>. 
		</p>
	</section>

	<!-- LIVE, LOCAL — GPT-2 forward pass determinism, with a safe fallback -->
	<section class="beat">
		<p class="beat__kicker">Act II · Proof, live</p>
		<h1 class="beat__statement">Barebones LLM <span class="hl">inference</span></h1>
		<!-- <p class="beat__sub">
			A real FastAPI + PyTorch process on this machine loads <span class="mono">gpt2</span>, runs
			the same prompt twice, and compares the logits <span class="hl">bitwise</span>.
		</p> -->
		<details class="beat__code">
			<summary>Show the exact server code</summary>
			<pre><code>{`tokenizer = AutoTokenizer.from_pretrained("gpt2")
model = AutoModelForCausalLM.from_pretrained("gpt2")
model.eval()  # disable dropout — we want the deterministic path

inputs = tokenizer(prompt, return_tensors="pt")

with torch.no_grad():
    logits_1 = model(**inputs).logits   # forward pass #1
with torch.no_grad():
    logits_2 = model(**inputs).logits   # forward pass #2, same inputs

identical = torch.equal(logits_1, logits_2)  # bitwise comparison`}</code></pre>
		</details>
		<div class="beat__demo beat__demo--wide">
			<LiveDeterminismTalkDemo />
		</div>
		<!-- <p class="beat__sub">
			CPU, no batching, no concurrent requests — the same graph executes the same way, every
			time. <span class="hl">Run-to-run deterministic</span>, exactly as claimed.
		</p> -->
	</section>

	<!-- MATMUL MECHANICS — what matrix multiplication actually does -->
	<section class="beat">
		<p class="beat__kicker">Act II · The traitor</p>
		<h1 class="beat__statement">
			Batch invariance
		</h1>
		<div class="beat__demo beat__demo--bare beat__demo--wide">
			<ExhibitFrame
				src="/talk-embeds/matmul-basics.html"
				title="How matrix multiplication works — full batch vs. just row 0, same answer either way"
			/>
		</div>
	</section>

	<!-- BATCH INVARIANCE — matmul is deterministic, not batch-invariant -->
	<section class="beat">
		<p class="beat__kicker">Act II · Under the hood</p>
		<h1 class="beat__statement">
			Matmul is deterministic. <span class="hl">Batch-invariant</span>, it is not.
		</h1>
		<!-- <p class="beat__sub">
			Row 0 of the output should depend only on row 0 of the input. Empirically,
			<span class="hl">it doesn't</span> — the batch size changes which kernel runs, and
			each kernel groups the same sum differently.
		</p> -->

		<details class="beat__code">
			<summary>Show the exact matmul code</summary>
			<pre class="code-card"><code>
B = <span class="num">2048</span>
D = <span class="num">4096</span>
a = torch.linspace(-<span class="num">1000</span>, <span class="num">1000</span>, B*D).reshape(B, D)
b = torch.linspace(-<span class="num">1000</span>, <span class="num">1000</span>, D*D).reshape(D, D)

<span class="cmt"># matrix-vector: take the first row of the batch, then multiply</span>
out1 = torch.mm(a[:<span class="num">1</span>], b)

<span class="cmt"># matrix-matrix: multiply the whole batch, then take the first row</span>
out2 = torch.mm(a, b)[:<span class="num">1</span>]
abs_diff = (out1 - out2).abs()
percentage_difference = ((out1 - out2).abs() / out1.abs()) * <span class="num">100</span>
<span class="cmt">
#Value from out1 (a[:1] @ b): 1,382,144.00
#Value from out2 (a @ b)[:1]: 1,382,784.00</span>
#Absolute Difference:         640.00
#Relative Difference:         0.0463%</code></pre>
		</details>


		<div class="beat__demo beat__demo--bare beat__demo--wide">
			<WeightsPromptsMatrix />
		</div>
	</section>



	<!-- FOLLOW THE BATCH -->
	<section class="beat">
		<p class="beat__kicker">Act II · Follow the batch</p>
		<h1 class="beat__statement">The <span class="hl">batch</span> picks the order.</h1>
		<p class="beat__sub">
			Low batch → Split-K: many cores share one accumulator, order varies.<br />
			Someone else's request changes <span class="hl">your</span> answer.
		</p>
		<div class="beat__demo beat__demo--wide beat__demo--duo">
			<SimulationControlPanel />
			<KernelParallelismSimulator />
		</div>
	</section>
	

	<!-- THE FIX — batch invariance on a GPU you control -->
	<section class="beat beat--pattern" style={patternStyle}>
		<p class="beat__kicker">Epilogue · The fix</p>
		<h1 class="beat__statement">So <span class="hl">fix the batching.</span></h1>
		<p class="beat__sub">
			Same 100-call experiment, self-hosted <span class="mono">Llama-3.1-8B-Instruct</span> on a
			single GPU via <span class="mono">vLLM</span>, with
			<span class="hl">batch invariance</span> switched on — deterministic reduction kernels
			instead of whichever one is fastest for the batch shape you happen to land in.
		</p>
		<details class="beat__code">
			<summary>Show the exact experiment code</summary>
			<pre><code>{`import os
os.environ["VLLM_BATCH_INVARIANT"] = "1"  # the fix

from vllm import LLM, SamplingParams

PROMPT = "Write a highly creative four-line poem about a clock that counts backward."

llm = LLM(model="meta-llama/Llama-3.1-8B-Instruct")
sampling = SamplingParams(temperature=0.0, max_tokens=200, seed=42)

outputs = llm.generate([PROMPT] * 100, sampling)
for out in outputs:
    print(out.outputs[0].text.strip())`}</code></pre>
		</details>
		<div class="beat__demo beat__demo--wide">
			<PoemVarianceVllmDemo />
		</div>
		<!-- <p class="beat__sub">
			Same dynamic batching that broke every other demo tonight — this time it doesn't matter.
			<span class="hl">One poem, 100 times.</span><br />
			Nondeterminism was never inevitable. It was a
			<span class="hl">performance trade-off</span> nobody told you they were making.
		</p> -->
	</section>

	<!-- EPILOGUE — cranking temperature doesn't break the fix -->
	<section class="beat beat--pattern" style={patternStyle}>
		<p class="beat__kicker">Epilogue · Turning up the heat</p>
		<h1 class="beat__statement">Deterministic does not mean <span class="hl">predictable</span></h1>
		<!-- <p class="beat__sub">
			Temperature 0 is greedy decoding — barely any randomness to begin with. Does batch
			invariance still hold once the sampler is actually <span class="hl">sampling</span>?
			Same setup, same pinned <span class="mono">seed=42</span>, temperature swept from
			<span class="mono">0.3</span> to <span class="mono">1.0</span>.
		</p> -->
		<div class="beat__demo beat__demo--wide">
			<PoemVarianceVllmTempDemo />
		</div>
		<!-- <p class="beat__sub">
			At <span class="mono">temperature=1.0</span> the model's grip on the prompt slips — it
			degenerates into <span class="hl">near-gibberish</span>. But it's the
			<span class="hl">same gibberish, all 30 times.</span> A fixed seed plus deterministic
			kernels pins down every draw, however noisy the distribution gets.<br />
			<span class="hl">The randomness you asked for. Nothing more.</span>
		</p> -->
	</section>

	<!-- EPILOGUE — the gotcha: determinism is pinned to one stack -->
	<section class="beat">
		<p class="beat__kicker">Epilogue · The fine print</p>
		<h1 class="beat__statement">There's a <span class="hl">massive gotcha</span></h1>
		<p class="beat__sub">
			Everything tonight is <span class="hl">run-to-run</span> determinism — same box,
			same GPU, same software stack, same weights, every single time.
		</p>
		<p class="beat__sub">
			Bump the <span class="mono">vLLM</span> version. Switch to a different GPU. Same seed,
			same prompt — and you get a <span class="hl">different set of numbers</span> in the
			logits.
		</p>
	</section>

	<!-- ANOTHER WAY — GROQ LPU -->
	<section class="beat">
		<p class="beat__kicker">Act IV · Another way</p>
		<h1 class="beat__statement">
			Deterministic <span class="hl">hardware</span>
		</h1>
		<div class="beat__demo beat__demo--bare beat__demo--wide">
			<GroqLpu />
		</div>
	</section>

	<!-- ═══════════ ACT III · THE FACT-CHECKS ═══════════ -->

	<!-- FACT-CHECK #1 — QUANTIZATION -->
	<!-- <section class="beat">
		<p class="beat__kicker">Act III · Fact-check #1</p>
		<h1 class="beat__statement">
			<span class="strike">“Quantized models are immune — int8 is exact!”</span>
		</h1>
		<p class="beat__sub">
			The weights <em>are</em> int8. But nobody sums in int8: dequantization is exact, and the
			<span class="hl">accumulator</span> — fp16/fp32 — is where the rounding happens.
			Fewer bits don't calm the noise — they <span class="hl">amplify</span> it.
		</p>
		<div class="beat__demo beat__demo--wide">
			<QuantAccumulatorDemo />
		</div>
	</section> -->

	<!-- <section class="beat">
		<p class="beat__kicker">Act III · Fact-check #2</p>
		<h1 class="beat__statement">
			<span class="strike">“I serve it myself. I'm the only customer.”</span>
		</h1>
		<p class="beat__sub">Who are you batching with, in an empty restaurant?</p>
		<div class="beat__demo beat__demo--bare beat__demo--wide">
			<EmptyRestaurant />
		</div>
	</section>

	
	<section class="beat">
		<p class="beat__kicker">Act III · Fact-check #3</p>
		<h1 class="beat__statement">
			<span class="strike">“CPUs are immune.”</span>
		</h1>
		<div class="beat__demo beat__demo--bare beat__demo--wide">
			<CpuFactCheck />
		</div>
	</section> -->


	

	<!-- ═══════════ ACT IV · THE RESOLUTION ═══════════ -->

	<!-- THE FIX & THE PRICE -->
	<!-- <section class="beat">
		<p class="beat__kicker">Act IV · The fix &amp; the price</p>
		<h1 class="beat__statement">Fix the <span class="hl">order</span>, pay in throughput.</h1>
		<p class="beat__sub">
			Batch-invariant kernels: one reduction tree, every batch size. Bitwise equal.<br />
			1000 requests on Qwen-3-8B: vLLM <span class="mono">26s</span> → deterministic
			<span class="mono">55s</span> → tuned <span class="mono">42s</span>.<br />
			Who pays that price? Debugging, audits — and truly <span class="hl">on-policy RL</span>,
			where sampler and trainer finally agree, KL = 0.
		</p>
		<div class="beat__demo beat__demo--wide beat__demo--duo">
			<ProofBlock />
			<BatchInvarianceCostChart />
		</div>
	</section> -->

	

	<!-- TONIGHT, AT HOME -->
	<!-- <section class="beat">
		<p class="beat__kicker">Act IV · Tonight, at home</p>
		<h1 class="beat__statement">Determinism on <span class="hl">your laptop</span>.</h1>
		<div class="beat__demo beat__demo--wide">
			<DemoRecording />
		</div>
		<p class="beat__sub mono">scripts/ollama-demo.sh — diverge, pin, sha256 match.</p>
	</section> -->

	<!-- LIVE, LOCAL — not a recording -->
	<!-- <section class="beat">
		<p class="beat__kicker">Act IV · Live on stage</p>
		<h1 class="beat__statement">This is <span class="hl">not</span> a recording.</h1>
		<p class="beat__sub">
			A real FastAPI + PyTorch process on this machine loads <span class="mono">gpt2</span>,
			runs the same prompt through two forward passes in <span class="mono">eval()</span>,
			and compares the logits <span class="hl">bitwise</span> — <span class="mono">torch.equal</span>.
		</p>
		<div class="beat__demo beat__demo--wide">
			<LiveDeterminismDemo />
		</div>
		<p class="beat__sub">
			CPU, no batching, no concurrent requests — the same graph executes the same way, every
			time. The nondeterminism was never in the <span class="hl">math</span>. It's in the
			<span class="hl">execution conditions</span>: batch parallelism, shape-dependent kernels,
			concurrent load.
		</p>
		<p class="beat__sub">
			And those 100 poems from the opening? On your GPU it's batching and kernel choice — in the
			cloud, add <span class="hl">MoE routing</span>, strangers' requests in your batch,
			distributed inference. Nondeterminism doesn't disappear; it moves to the provider's side.<br />
			<span class="hl">The mystery is solved. The story continues.</span>
		</p>
	</section> -->

	

	<!-- RECAP -->
	<section class="beat">
		<p class="beat__kicker">Recap</p>
		<h1 class="beat__statement">How we got <span class="hl">non-deterministic</span> answers.</h1>
		<ol class="recap-chain">
			<li>
				<span class="recap-chain__num">1</span>
				<span class="recap-chain__text">
					Floating-point numbers are approximations — every add or multiply can carry a
					<span class="hl">rounding error</span>.
				</span>
			</li>
			<li>
				<span class="recap-chain__num">2</span>
				<span class="recap-chain__text">
					Floating-point addition isn't associative, so the
					<span class="hl">order of operations</span> changes the result.
				</span>
			</li>
			<li>
				<span class="recap-chain__num">3</span>
				<span class="recap-chain__text">
					While GPUs are random due to atomic adds and more, 
					forward pass is deterministic.
				</span>
			</li>
			<li>
				<span class="recap-chain__num">4</span>
				<span class="recap-chain__text">
					Matmul and friends aren't <span class="hl">batch-invariant</span> — the kernel
					picks a different reduction order depending on what else is in the batch.
				</span>
			</li>
		</ol>
		<p class="recap-chain__so">So either:</p>
		<div class="recap-split">
			<div class="recap-split__card">
				<h3 class="recap-split__title">Hamstring the GPU</h3>
				<p class="recap-split__body">
					Fix the batch, disable the fast kernels, pin the schedule — determinism as a
					<span class="hl">tax you pay</span> at runtime.
				</p>
			</div>
			<div class="recap-split__card recap-split__card--accent">
				<h3 class="recap-split__title">Or use deterministic software</h3>
				<p class="recap-split__body">
					Batch-invariant kernels (or an architecture like Groq's LPU) give you the
					<span class="hl">same bits by construction</span> — no tax required.
				</p>
			</div>
		</div>
	</section>



		<!-- EPILOGUE — same experiment, different provider -->
	<section class="beat beat--pattern" style={patternStyle}>
		<p class="beat__kicker">Epilogue · Same experiment, different provider</p>
		<h1 class="beat__statement">And on <span class="hl">Groq</span>?</h1>
		<!-- <p class="beat__sub">
			The same 100-call experiment against <span class="mono">openai/gpt-oss-120b</span> on Groq —
			this time with a fixed <span class="mono">seed</span> on top of temperature 0.
		</p> -->
		<details class="beat__code">
			<summary>Show the exact API call</summary>
			<pre><code>{`const PROMPT =
  'Write a highly creative four-line poem about a clock that counts backward.';

for (let i = 0; i < 100; i++) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + process.env.GROQ_API_KEY
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      max_completion_tokens: 1024,
      reasoning_effort: 'low',
      temperature: 0,
      seed: 700, // pinned seed, on top of temperature 0
      messages: [{ role: 'user', content: PROMPT }]
    })
  });
  const data = await res.json();
  console.log(data.choices[0].message.content);
}`}</code></pre>
		</details>
		<div class="beat__demo beat__demo--wide">
			<PoemVarianceGroqDemo />
		</div>
		<p class="beat__sub">
			100 runs, seed pinned — still <span class="hl">three different poems</span>. Identical
			through line 3, splitting at <span class="hl">one near-tied token</span> in line 4. Dense
			<span class="mono">llama-3.3-70b</span>, same test: one word flips
			(<span class="mono">noon → dawn</span>) — but never within a burst. 46 simultaneous calls:
			identical. Spread across minutes: drift. The divergence follows the
			<span class="hl">batching windows</span>, not the model.<br />
			<span class="hl">Deterministic hardware ≠ deterministic API.</span>
		</p>
	</section>
</div>

<div class="deck-counter" class:squished aria-live="polite">{$talkMode.currentBeat} / {TOTAL_BEATS}</div>

<button
	class="squish-toggle"
	class:squished
	type="button"
	onclick={toggleSquished}
	title="Toggle squished layout (S) — for rooms where the bottom of the screen is cut off"
>
	{squished ? 'S' : 'O'}
</button>

<style>
	:global(body:has(.deck)) {
		background: #ffffff;
		overflow: hidden;
	}

	.deck {
		/* Deck-wide demo sizing — change these values to resize every demo.
		   --demo-zoom scales the article-style modules up for projection. */
		--demo-width: min(1360px, 96vw);
		--demo-width-wide: min(1660px, 98vw);
		--demo-zoom: 1.3;
		/* Projector-friendly light palette (white bg, navy ink, blue/red accents). */
		--ink: #1d2c4e;
		--heading: #14356e;
		--accent: #2a7de1;
		--red: #d6453d;
		--muted: #5f739c;
		--line: #d7e3f4;
		--panel: #f6f9fe;
		position: fixed;
		inset: 0;
		overflow-y: auto;
		scroll-snap-type: y mandatory;
		background: #ffffff;
		color: var(--ink);
	}

	.beat {
		min-height: 100vh;
		scroll-snap-align: start;
		scroll-snap-stop: always;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 32px;
		padding: 48px clamp(20px, 4vw, 72px);
		box-sizing: border-box;
		text-align: center;
	}

	/* Decorative line-art pattern, kept faint under a white wash. */
	.beat--pattern {
		background-image:
			linear-gradient(rgba(255, 255, 255, 0.87), rgba(255, 255, 255, 0.87)),
			var(--pattern);
		background-size:
			auto,
			min(880px, 100vw) auto;
		background-repeat: repeat;
	}

	.beat__kicker {
		margin: 0;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: clamp(15px, 1.5vw, 21px);
		letter-spacing: 0.26em;
		text-transform: uppercase;
		color: var(--accent);
	}

	.beat__statement {
		margin: 0;
		font-size:clamp(36px, 4.8vw, 74px);
		line-height: 1.1;
		font-weight: 800;
		letter-spacing: -0.015em;
		max-width: 22ch;
		color: var(--heading);
	}

	/* .beat__statement--xl {
		font-size: clamp(42px, 6vw, 90px);
	} */

	.beat__sub {
		margin: 0;
		font-size: clamp(21px, 2.2vw, 32px);
		line-height: 1.5;
		color: #3c4f78;
		max-width: 54ch;
	}

	/* Squished mode: keep act kickers out of the bottom third by pinning them
	   near the top, out of the centered flex flow. */
	.deck.squished .beat {
		position: relative;
	}


	.deck.squished .beat__kicker {
		position: absolute;
		top: 20px;
		left: 0;
		right: 0;
		margin: 0;
	}

	/* The kicker is pulled out of flow, but the rest of the content beats
	   still centered as if it had the full 100vh — leaving a big empty gap
	   under the kicker. Pull the remaining content up so it sits just below
	   the kicker instead. Title slide is laid out as a row, so it's excluded
	   and handled on its own below. */
	.deck.squished .beat:not(.beat--title) {
		justify-content: flex-start;
		padding-top: 80px;
	}

	/* Squished mode: title slide gets nudged up and enlarged a bit since it's
	   otherwise vertically centered and its lower half falls in the cut-off
	   bottom third. */
	.deck.squished .beat--title {
		transform: translateY(-60px);
	}

	.deck.squished .beat__title-statement {
		font-size: clamp(28px, 3vw, 40px);
	}

	.hl {
		color: var(--accent);
	}

	.strike {
		text-decoration: line-through;
		text-decoration-color: var(--red);
		text-decoration-thickness: 0.08em;
		color: #7d8db0;
	}

	.mono {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	}

	.beat__demo {
		width: var(--demo-width);
		max-width: 100%;
		background: #ffffff;
		border-radius: 18px;
		padding: 24px 28px;
		box-shadow:
			0 0 0 1px var(--line),
			0 18px 44px rgba(23, 58, 110, 0.08);
		text-align: left;
		color: var(--ink);
	}

	/* Article-style modules keep their own compact px sizing — scale the whole
	   card up for the projector. Width divides by the zoom so the visual
	   footprint still equals --demo-width. */
	.beat__demo:not(.beat__demo--bare) {
		zoom: var(--demo-zoom);
		width: calc(var(--demo-width) / var(--demo-zoom));
		border-radius: 14px;
		padding: 20px 24px;
	}

	.beat__demo--bare {
		background: transparent;
		box-shadow: none;
		padding: 0;
		color: inherit;
		text-align: center;
	}

	.beat__demo--wide {
		width: var(--demo-width-wide);
	}

	.beat__demo--wide:not(.beat__demo--bare) {
		width: calc(var(--demo-width-wide) / var(--demo-zoom));
	}

	.beat__triad {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 28px;
		align-items: stretch;
	}

	.code-card {
		width: 100%; max-width: 760px;
		background: #1d2230; color: #e0e0e0;
		border-radius: 14px; border: 1px solid #2a3040;
		box-shadow: 0 10px 28px rgba(23, 58, 110, 0.12);
		padding: clamp(16px,2.4vw,26px);
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: clamp(11px, 1.35vw, 15px);
		line-height: 1.65;
		overflow-x: auto;
		white-space: pre;
		text-align: left;
  	}

	.code-card .cmt { color: #8890a8; }
 	/* .code-card .kw  { color: #7ab8ff; }
    .code-card .fn  { color: #9fdcb4; } */
    .code-card .num { color: #ffd166; }


	.stake-solo {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 40px;
		align-items: center;
	}

	.stake-solo__art {
		width: 100%;
		max-height: 56vh;
		object-fit: contain;
		border-radius: 16px;
	}

	.stake-solo__body {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		text-align: left;
		gap: 18px;
	}

	.stake-solo__caption {
		margin: 0;
		font-size: clamp(18px, 1.8vw, 25px);
		line-height: 1.45;
		color: #3c4f78;
	}

	.stake-solo__list {
		margin: 0;
		padding-left: 1.2em;
		display: flex;
		flex-direction: column;
		gap: 12px;
		font-size: clamp(14px, 1.3vw, 18px);
		line-height: 1.6;
		color: var(--muted);
	}

	.stake-solo__source {
		margin: 0;
		font-size: clamp(12px, 1vw, 15px);
		color: var(--muted);
	}

	@media (max-width: 1100px) {
		.stake-solo {
			grid-template-columns: 1fr;
		}
	}

	.recap-chain {
		list-style: none;
		margin: 0 auto;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 18px;
		width: min(900px, 92vw);
		text-align: left;
	}

	.recap-chain li {
		display: flex;
		align-items: flex-start;
		gap: 16px;
		font-size: clamp(19px, 2vw, 26px);
		line-height: 1.5;
		color: var(--ink);
	}

	.recap-chain__text {
		flex: 1 1 auto;
	}

	.recap-chain__num {
		flex: none;
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--panel);
		border: 1px solid var(--line);
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 16px;
		font-weight: 700;
		color: var(--accent);
	}

	.recap-chain__so {
		margin: 22px auto 14px;
		width: fit-content;
		text-align: center;
		font-size: clamp(19px, 2vw, 24px);
		font-weight: 600;
		color: var(--muted);
	}

	.recap-split {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;
		width: min(1000px, 92vw);
		margin: 0 auto;
		text-align: left;
	}

	.recap-split__card {
		background: var(--panel);
		border: 1px solid var(--line);
		border-radius: 14px;
		padding: 22px 26px;
	}

	.recap-split__card--accent {
		border: 2px solid var(--accent);
		background: #eaf2fd;
	}

	.recap-split__title {
		margin: 0 0 8px;
		font-size: clamp(21px, 2.2vw, 27px);
		color: var(--heading);
	}

	.recap-split__body {
		margin: 0;
		font-size: clamp(16px, 1.7vw, 21px);
		line-height: 1.5;
		color: var(--muted);
	}

	@media (max-width: 760px) {
		.recap-split {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 1100px) {
		.beat__triad {
			grid-template-columns: 1fr;
		}
	}

	.skeptic-card {
		background: #ffffff;
		border-radius: 18px;
		box-shadow:
			0 0 0 1px var(--line),
			0 18px 44px rgba(23, 58, 110, 0.08);
		padding: 26px 24px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		text-align: left;
		gap: 14px;
	}

	.skeptic-card__quote {
		margin: 0;
		font-size: clamp(19px, 1.8vw, 25px);
		font-weight: 700;
		line-height: 1.35;
		color: var(--heading);
	}

	.skeptic-card__body {
		margin: 0;
		font-size: clamp(14px, 1.25vw, 18px);
		line-height: 1.6;
		color: var(--muted);
	}

	/* FP anatomy — sign/exponent/mantissa "cubes", palette and 3D shelf
	   shadow borrowed from static/talk-embeds/fp-cubes.html so this static
	   float64 diagram reads as the same visual language as Exhibit A. */
	.fp-anatomy {
		--fp-sign: #a63d8f;
		--fp-sign-bg1: #f0b3e0;
		--fp-sign-bg2: #d98cc5;
		--fp-exp: #1e63b8;
		--fp-exp-bg1: #9ec7f0;
		--fp-exp-bg2: #6ba3dd;
		--fp-mant: #1d7a43;
		--fp-mant-bg1: #9fdcb4;
		--fp-mant-bg2: #6fc08d;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 22px;
		width: min(880px, 92vw);
	}

	.fp-anatomy__formula {
		margin: 0;
		font-family: ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif;
		font-style: italic;
		font-size: clamp(24px, 2.6vw, 36px);
		color: var(--heading);
	}

	.fp-s {
		color: var(--fp-sign);
	}

	.fp-e {
		color: var(--fp-exp);
	}

	.fp-m {
		color: var(--fp-mant);
	}

	.fp-anatomy__layout {
		display: flex;
		align-items: flex-end;
		gap: 10px;
	}

	.fp-seg {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		border-radius: 14%;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-weight: 800;
		font-size: clamp(18px, 2vw, 26px);
		box-shadow:
			inset 0 0.25em 0 rgba(255, 255, 255, 0.4),
			inset 0 -0.25em 0 rgba(0, 0, 0, 0.28),
			0 0.28em 0 rgba(0, 0, 0, 0.32);
	}

	.fp-seg span {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-weight: 700;
		font-size: clamp(10px, 1vw, 13px);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0.85;
	}

	.fp-seg--s {
		width: clamp(64px, 7vw, 84px);
		height: clamp(64px, 7vw, 84px);
		background: linear-gradient(145deg, var(--fp-sign-bg1), var(--fp-sign-bg2));
		color: var(--fp-sign);
	}

	.fp-seg--e {
		width: clamp(96px, 10vw, 128px);
		height: clamp(80px, 8.5vw, 104px);
		background: linear-gradient(145deg, var(--fp-exp-bg1), var(--fp-exp-bg2));
		color: #0d2c55;
	}

	.fp-seg--m {
		width: clamp(180px, 20vw, 260px);
		height: clamp(96px, 10vw, 124px);
		background: linear-gradient(145deg, var(--fp-mant-bg1), var(--fp-mant-bg2));
		color: #0c3d22;
	}

	.fp-anatomy__note {
		margin: 0;
		font-size: clamp(15px, 1.5vw, 19px);
		line-height: 1.5;
		color: var(--muted);
		max-width: 62ch;
		text-align: center;
	}

	.fp-anatomy__expansion {
		font-size: clamp(16px, 1.7vw, 22px);
		background: var(--panel);
		border: 1px solid var(--line);
		border-radius: 12px;
		padding: 12px 20px;
	}

	.fp-kept {
		color: var(--ink);
	}

	.fp-edge {
		display: inline-block;
		width: 2px;
		height: 1em;
		vertical-align: middle;
		margin: 0 3px;
		background: var(--red);
		box-shadow: 0 0 6px rgba(214, 69, 61, 0.5);
	}

	.fp-lost {
		color: var(--red);
		opacity: 0.75;
	}

	.fp-anatomy__sum {
		font-size: clamp(20px, 2.1vw, 28px);
		background: var(--panel);
		border: 1px solid var(--line);
		border-radius: 12px;
		padding: 10px 22px;
	}

	.fp-lost-strong {
		color: var(--red);
		font-weight: 800;
	}

	.beat__code {
		width: min(880px, 92vw);
		text-align: left;
	}

	.beat__code summary {
		cursor: pointer;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: clamp(15px, 1.5vw, 20px);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--accent);
		text-align: center;
		list-style-position: inside;
	}

	.beat__code summary:hover {
		color: var(--heading);
	}

	.beat__code pre {
		margin: 14px 0 0;
		padding: 18px 22px;
		background: var(--panel);
		border-radius: 14px;
		box-shadow: 0 0 0 1px var(--line);
		overflow-x: auto;
	}

	.beat__code pre.code-card {
		background: #1d2230;
		box-shadow: 0 10px 28px rgba(23, 58, 110, 0.12);
	}

	.beat__code pre.code-card code {
		color: #e0e0e0;
	}

	.beat__code code {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: clamp(14px, 1.3vw, 19px);
		line-height: 1.55;
		color: var(--ink);
		white-space: pre;
	}

	/* Two modules side by side so the beat fits one screen. */
	.beat__demo--duo {
		display: grid;
		grid-template-columns: minmax(300px, 5fr) 7fr;
		gap: 24px;
		align-items: start;
	}

	.beat__demo--duo > :global(*) {
		margin: 0;
	}

	.beat--title {
		position: relative;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: clamp(24px, 4vw, 64px);
		text-align: left;
		padding: 32px clamp(20px, 3vw, 56px);
	}

	.beat__title-qr {
		position: absolute;
		top: clamp(80px, 10vw, 140px);
		right: clamp(20px, 3vw, 40px);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}

	.beat__title-qr-img {
		width: clamp(110px, 12vw, 170px);
		height: auto;
		border-radius: 8px;
		box-shadow: 0 6px 18px rgba(23, 58, 110, 0.12);
	}

	.beat__title-qr-link {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: clamp(12px, 1vw, 14px);
		color: var(--muted);
		text-decoration: none;
	}

	.beat__title-qr-link:hover {
		text-decoration: underline;
	}

	.beat__title-copy {
		flex: 0 0 auto;
		width: min(420px, 34vw);
	}

	.beat__title-art-wrap {
		flex: 1 1 auto;
		display: flex;
		align-items: center;
		gap: 12px;
		max-width: 46vw;
	}

	.beat__title-art {
		flex: 1 1 auto;
		width: min(1050px, 46vw);
		max-width: 100%;
		height: auto;
	}

	.beat__title-credit {
		flex: none;
		align-self: flex-end;
		margin-bottom: clamp(20px, 4vw, 60px);
		writing-mode: vertical-rl;
		transform: rotate(180deg);
		white-space: nowrap;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: clamp(11px, 1vw, 13px);
		letter-spacing: 0.04em;
		color: var(--muted);
		text-decoration: none;
	}

	.beat__title-credit:hover {
		text-decoration: underline;
	}

	.beat__title-statement {
		margin: 0;
		font-size: clamp(24px, 2.4vw, 34px);
		line-height: 1.25;
		font-weight: 800;
		letter-spacing: -0.01em;
		max-width: 20ch;
		color: var(--heading);
	}

	.beat__title-byline {
		margin-top: 20px;
	}

	.beat__title-name {
		margin: 0;
		font-size: clamp(19px, 1.9vw, 26px);
		font-weight: 700;
		color: var(--ink);
	}

	.beat__title-role {
		margin: 4px 0 0;
		font-size: clamp(15px, 1.4vw, 19px);
		color: var(--muted);
	}

	@media (max-width: 860px) {
		.beat--title {
			flex-direction: column;
			text-align: center;
		}

		.beat__title-copy {
			width: 100%;
		}

		.beat__title-art-wrap {
			max-width: 100%;
			justify-content: center;
		}

		.beat__title-art {
			width: min(560px, 65vw);
			max-width: 100%;
		}
	}

	.deck-counter {
		position: fixed;
		right: 20px;
		bottom: 18px;
		z-index: 10;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 17px;
		color: #8296bb;
	}

	.deck-counter.squished {
		bottom: auto;
		top: 18px;
	}

	.squish-toggle {
		position: fixed;
		right: 90px;
		bottom: 16px;
		z-index: 10;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 11px;
		letter-spacing: 0.02em;
		color: #8296bb;
		background: transparent;
		border: 1px solid #d7e3f4;
		border-radius: 4px;
		padding: 3px 8px;
		cursor: pointer;
		opacity: 0.55;
	}

	.squish-toggle:hover {
		opacity: 1;
	}

	.squish-toggle.squished {
		color: #2a7de1;
		border-color: #2a7de1;
	}

	.refs {
		list-style: none;
		margin: 8px 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
		width: min(880px, 92vw);
		text-align: left;
	}

	.refs__item {
		position: relative;
		padding: 14px 18px;
		border: 1px solid var(--line);
		border-radius: 10px;
		background: var(--panel);
	}

	.refs__item--featured {
		border-color: var(--accent);
		border-width: 2px;
		background: #eaf2fd;
		padding-left: 16px;
	}

	.refs__badge {
		display: inline-block;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		color: white;
		background: var(--accent);
		border-radius: 999px;
		padding: 2px 9px;
		margin-bottom: 6px;
	}

	.refs__link {
		display: block;
		font-size: clamp(16px, 1.6vw, 19px);
		font-weight: 600;
		color: var(--heading);
		text-decoration: none;
	}

	.refs__item--featured .refs__link {
		font-size: clamp(18px, 1.9vw, 22px);
	}

	.refs__link:hover {
		text-decoration: underline;
	}

	.refs__url {
		display: block;
		margin-top: 4px;
		font-size: 13px;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		color: var(--muted);
		word-break: break-all;
	}
</style>
