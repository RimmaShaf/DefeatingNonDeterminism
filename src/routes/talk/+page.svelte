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
	import BatchInvarianceCostChart from '$lib/components/modules/BatchInvarianceCostChart.svelte';
	import DemoRecording from '$lib/components/modules/DemoRecording.svelte';
	import FloatingPointSandbox from '$lib/components/modules/FloatingPointSandbox.svelte';
	import KernelParallelismSimulator from '$lib/components/modules/KernelParallelismSimulator.svelte';
	import LiveDeterminismDemo from '$lib/components/modules/LiveDeterminismDemo.svelte';
	import PoemVarianceDemo from '$lib/components/modules/PoemVarianceDemo.svelte';
	import PoemVarianceGroqDemo from '$lib/components/modules/PoemVarianceGroqDemo.svelte';
	import QuantAccumulatorDemo from '$lib/components/modules/QuantAccumulatorDemo.svelte';
	import WeightsFileGag from '$lib/components/modules/WeightsFileGag.svelte';
	import ProofBlock from '$lib/components/ProofBlock.svelte';
	import SimulationControlPanel from '$lib/components/SimulationControlPanel.svelte';
	import { initTalkMode, setCurrentBeat, talkMode } from '$lib/stores/talkMode';

	// Beats are numbered by DOM order — add/move/remove <section class="beat">
	// freely, just keep TOTAL_BEATS equal to the number of sections.
	const TOTAL_BEATS = 20;

	// Decorative line-art pattern, used sparingly (cold open + epilogue).
	const patternStyle = `--pattern: url('${base}/talk-assets/pattern-blue.jpg')`;
	initTalkMode(true, TOTAL_BEATS);

	let deckEl: HTMLElement;

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
		}
	}

	onMount(() => {
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

<div class="deck" bind:this={deckEl}>
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
		<img
			class="beat__title-art"
			src="{base}/talk-assets/hero-image.jpg"
			alt=""
		/>
	</section>

	<!-- ═══════════ ACT I · THE ANOMALY ═══════════ -->

	<!-- COLD OPEN -->
	<section class="beat beat--pattern" style={patternStyle}>
		<p class="beat__kicker">Act I · The anomaly</p>
		<h1 class="beat__statement beat__statement--xl">
			Nobody touched <span class="hl">anything</span>.
		</h1>
		<div class="beat__demo beat__demo--bare">
			<ColdOpenDivergence />
		</div>
	</section>

	<!-- LIVE EVIDENCE — 100× to the cloud, temperature 0 -->
	<section class="beat">
		<p class="beat__kicker">Act I · Live evidence</p>
		<h1 class="beat__statement">Don't take my word for it.</h1>
		<p class="beat__sub">
			<span class="mono">claude-sonnet-4-6</span>, one prompt, <span class="hl">100 calls</span>,
			temperature 0 — formally the “deterministic” mode. Every line is colored by which variant
			of the text this run happened to get.
		</p>
		<div class="beat__demo beat__demo--wide">
			<PoemVarianceDemo />
		</div>
		<p class="beat__sub">
			One question, asked 100 times. <span class="hl">Different poems.</span><br />
			The rest of tonight is about <span class="hl">why</span>.
		</p>
	</section>

	<!-- SKEPTIC #1 — "just the ML reproducibility crisis, old news" -->
	<section class="beat">
		<p class="beat__kicker">Act I · Skeptic #1</p>
		<h1 class="beat__statement">
			“That's just the <span class="hl">reproducibility crisis</span>. Old news.”
		</h1>
		<p class="beat__sub">
			 <em>“Can Neural Nets Learn the Same Model Twice?”</em> (Somepalli et al.,
			CVPR 2022) — train the same net twice, get visibly different decision boundaries. Retrain a
			GraphSAGE GNN with nothing changed but the seed, and the embeddings reshuffle (Schumacher et
			al.). <span class="hl">“Deep learning rolls dice. Go do something else.”</span>
		</p>
		<!-- <div class="beat__demo beat__demo--bare beat__demo--wide">
			<TrainingVsInference />
		</div> -->
		<p class="beat__sub">
			<!-- He's right — about <span class="hl">training</span>. But nobody trained anything tonight. -->
		</p>
	</section>

	<!-- SKEPTIC #2 — "the vendors already confessed, case closed" -->
	<section class="beat">
		<p class="beat__kicker">Act I · Skeptic #2</p>
		<h1 class="beat__statement">“It's in the <span class="hl">docs</span>. Case closed.”</h1>
		<p class="beat__sub">
			She reads them aloud. PyTorch, reproducibility note: <em
				>“Completely reproducible results are not guaranteed across PyTorch releases, individual
				commits, or different platforms… even when using identical seeds.”</em
			>
			OpenAI, on the <span class="mono">seed</span> parameter:
			<em>“Determinism is not guaranteed.”</em>
		</p>
		<p class="beat__sub">
			<span class="hl">“The vendors confessed years ago. What's left to investigate?”</span><br />
			A confession is not an <span class="hl">explanation</span>. Not guaranteed —
			<span class="hl"></span>?
		</p>
	</section>

	<!-- SKEPTIC #3 — "variance is the product, determinism doesn't pay" -->
	<section class="beat">
		<p class="beat__kicker">Act I · Skeptic #3</p>
		<h1 class="beat__statement">
			“Variety is the <span class="hl">feature</span>. Nobody pays for sameness.”
		</h1>
		<p class="beat__sub">
			“You <em>sample</em> from these models on purpose. And forcing determinism is expensive —
			deterministic kernels have been clocked at up to <span class="hl">10×</span> slower. Even if
			you solve the mystery, nobody ships the fix. <span class="hl">Walk away.</span>”
		</p>
		<!-- <p class="beat__sub">
			Except we set temperature <span class="hl">0</span>. The dice were supposed to be
			<span class="hl">off</span> — and something rolled them anyway.
		</p> -->
	</section>

	<!-- THE EVIDENCE -->
	<section class="beat">
		<p class="beat__kicker">Act I · On the record</p>
		<h1 class="beat__statement">The weights <span class="hl">never change</span>.</h1>
		<div class="beat__demo beat__demo--bare beat__demo--wide">
			<WeightsFileGag />
		</div>
		<p class="beat__sub">I downloaded gemma4 weights. It is a file of numbers. Frozen. So who's changing the answer?</p>
	</section>

	<!-- THE LAZY ANSWER -->
	<section class="beat">
		<p class="beat__kicker">Act I · The official line</p>
		<h1 class="beat__statement">
			<span class="strike">“GPUs are just&nbsp;random.”</span>
		</h1>
		<p class="beat__sub">
			The internet's favorite explanation: <em>“concurrency + floating point.”</em><br />
			<!-- Too convenient. Tonight we fact-check it properly. -->
		</p>
	</section>

	<!-- ═══════════ ACT II · THE MECHANISM ═══════════ -->

	<!-- FIRST CRACK — 0.1 + 0.2, live Python -->
	<section class="beat">
		<p class="beat__kicker">Act II · The first crack</p>
		<h1 class="beat__statement">
			<span class="mono">0.1 + 0.2</span> isn't even <span class="hl">0.3</span>.
		</h1>
		<div class="beat__demo beat__demo--bare beat__demo--wide">
			<ExhibitFrame
				src="/talk-embeds/python-terminal.html"
				title="Live Python in the browser — type 0.1 + 0.2 yourself"
				note="Real Python (Pyodide/WASM) — loads from CDN, give it a few seconds on stage."
			/>
		</div>
		<p class="beat__sub">
			Binary floats can't write 0.1 exactly — the same way decimal can't write ⅓. If the
			arithmetic lies on a kindergarten sum, what did you expect from
			<span class="hl">ten billion additions</span>?
		</p>
	</section>

	<!-- EXHIBIT A — inside a bf16 add -->
	<section class="beat">
		<p class="beat__kicker">Act II · Exhibit A</p>
		<h1 class="beat__statement">Watch the bit <span class="hl">fall off</span>.</h1>
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
		<p class="beat__sub">
			Floating-point addition is <span class="hl">not associative</span>. At 2048, fp16's gap
			between representable numbers is 2 — add a 1 and it simply <span class="hl">disappears</span>.
		</p>
		<div class="beat__demo beat__demo--wide">
			<FloatingPointSandbox />
		</div>
	</section>

	<!-- THE TWIST — the math alone checks out -->
	<section class="beat">
		<p class="beat__kicker">Act II · The twist</p>
		<h1 class="beat__statement">The math <span class="hl">checks out</span>.</h1>
		<div class="beat__demo beat__demo--bare beat__demo--wide">
			<SameOpBitwise />
		</div>
		<p class="beat__sub">
			Same op, same data: <span class="hl">bitwise identical</span>, a thousand times over.<br />
			The mechanism is real — but something else has to <span class="hl">shuffle the order</span>.
		</p>
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

	<!-- ═══════════ ACT III · THE FACT-CHECKS ═══════════ -->

	<!-- FACT-CHECK #1 — QUANTIZATION -->
	<section class="beat">
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
	</section>

	<!-- FACT-CHECK #2 — LOCAL SERVING -->
	<section class="beat">
		<p class="beat__kicker">Act III · Fact-check #2</p>
		<h1 class="beat__statement">
			<span class="strike">“I serve it myself. I'm the only customer.”</span>
		</h1>
		<p class="beat__sub">Who are you batching with, in an empty restaurant?</p>
		<div class="beat__demo beat__demo--bare beat__demo--wide">
			<EmptyRestaurant />
		</div>
	</section>

	<!-- FACT-CHECK #3 — CPUs -->
	<section class="beat">
		<p class="beat__kicker">Act III · Fact-check #3</p>
		<h1 class="beat__statement">
			<span class="strike">“CPUs are immune.”</span>
		</h1>
		<div class="beat__demo beat__demo--bare beat__demo--wide">
			<CpuFactCheck />
		</div>
	</section>

	<!-- ═══════════ ACT IV · THE RESOLUTION ═══════════ -->

	<!-- THE FIX & THE PRICE -->
	<section class="beat">
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
	</section>

	<!-- ANOTHER WAY — GROQ LPU -->
	<section class="beat">
		<p class="beat__kicker">Act IV · Another way</p>
		<h1 class="beat__statement">
			Or build a machine that <span class="hl">never improvises</span>.
		</h1>
		<div class="beat__demo beat__demo--bare beat__demo--wide">
			<GroqLpu />
		</div>
	</section>

	<!-- TONIGHT, AT HOME -->
	<section class="beat">
		<p class="beat__kicker">Act IV · Tonight, at home</p>
		<h1 class="beat__statement">Determinism on <span class="hl">your laptop</span>.</h1>
		<div class="beat__demo beat__demo--wide">
			<DemoRecording />
		</div>
		<p class="beat__sub mono">scripts/ollama-demo.sh — diverge, pin, sha256 match.</p>
	</section>

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

	<!-- EPILOGUE — same experiment, different provider -->
	<section class="beat beat--pattern" style={patternStyle}>
		<p class="beat__kicker">Epilogue · Same experiment, different provider</p>
		<h1 class="beat__statement">And on <span class="hl">Groq</span>?</h1>
		<p class="beat__sub">
			The same 100-call experiment against <span class="mono">openai/gpt-oss-120b</span> on Groq —
			this time with a fixed <span class="mono">seed</span> on top of temperature 0.
		</p>
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

<div class="deck-counter" aria-live="polite">{$talkMode.currentBeat} / {TOTAL_BEATS}</div>

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
		font-size: clamp(44px, 6vw, 92px);
		line-height: 1.1;
		font-weight: 800;
		letter-spacing: -0.015em;
		max-width: 22ch;
		color: var(--heading);
	}

	.beat__statement--xl {
		font-size: clamp(52px, 7.4vw, 112px);
	}

	.beat__sub {
		margin: 0;
		font-size: clamp(21px, 2.2vw, 32px);
		line-height: 1.5;
		color: #3c4f78;
		max-width: 54ch;
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
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: clamp(24px, 4vw, 64px);
		text-align: left;
		padding: 32px clamp(20px, 3vw, 56px);
	}

	.beat__title-copy {
		flex: 0 0 auto;
		width: min(420px, 34vw);
	}

	.beat__title-art {
		flex: 1 1 auto;
		width: min(1050px, 46vw);
		max-width: 46vw;
		height: auto;
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
</style>
