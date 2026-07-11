<script lang="ts">
	// Illustrative transcript of the real phenomenon (hosted APIs diverge at
	// temperature=0 under concurrent load). Shared prefix, then divergence.
	const COMMON =
		'The pipeline failed because the upstream schema changed: the `events` table gained a nullable column, and the ';
	const ENDING_A =
		'ingestion job silently dropped rows that contained NULLs, which corrupted the daily aggregates downstream.';
	const ENDING_B =
		'serializer began emitting empty strings for NULLs, which silently corrupted the daily aggregates downstream.';

	let revealed = $state(0);
	let playing = $state(false);
	const FULL_A = COMMON + ENDING_A;
	const FULL_B = COMMON + ENDING_B;
	const MAX_LEN = Math.max(FULL_A.length, FULL_B.length);

	let textA = $derived(FULL_A.slice(0, revealed));
	let textB = $derived(FULL_B.slice(0, revealed));
	let diverged = $derived(revealed > COMMON.length);

	function play(): void {
		if (playing) return;
		playing = true;
		revealed = 0;
		const tick = () => {
			revealed += 2;
			if (revealed < MAX_LEN) {
				setTimeout(tick, 24);
			} else {
				revealed = MAX_LEN;
				playing = false;
			}
		};
		tick();
	}
</script>

<div class="cod">
	<div class="cod__meta">
		<span class="cod__chip">same model</span>
		<span class="cod__chip">same prompt</span>
		<span class="cod__chip">temperature = 0</span>
	</div>

	<div class="cod__panes">
		<div class="cod__pane">
			<div class="cod__pane-head">run #1</div>
			<p class="cod__text">
				{textA.slice(0, COMMON.length)}<span class="cod__diff" class:cod__diff--on={diverged}
					>{textA.slice(COMMON.length)}</span
				><span class="cod__caret" class:cod__caret--blink={playing}></span>
			</p>
		</div>
		<div class="cod__pane">
			<div class="cod__pane-head">run #2</div>
			<p class="cod__text">
				{textB.slice(0, COMMON.length)}<span class="cod__diff" class:cod__diff--on={diverged}
					>{textB.slice(COMMON.length)}</span
				><span class="cod__caret" class:cod__caret--blink={playing}></span>
			</p>
		</div>
	</div>

	<button class="cod__play" onclick={play} disabled={playing}>
		{revealed === 0 ? '▶ Run both' : playing ? 'Generating…' : '▶ Run again'}
	</button>

	<p class="cod__footnote">Illustrative transcript of a reproducible phenomenon: hosted LLM APIs diverge at temperature = 0 under concurrent load.</p>
</div>

<style>
	.cod {
		width: 100%;
	}

	.cod__meta {
		display: flex;
		gap: 12px;
		justify-content: center;
		margin-bottom: 28px;
	}

	.cod__chip {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: clamp(13px, 1.4vw, 18px);
		color: #8b95a7;
		border: 1px solid #2a3242;
		border-radius: 999px;
		padding: 6px 16px;
	}

	.cod__panes {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;
	}

	.cod__pane {
		background: #11151d;
		border: 1px solid #232b3b;
		border-radius: 12px;
		padding: 20px 24px;
		min-height: 11em;
		text-align: left;
	}

	.cod__pane-head {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 13px;
		color: #5b6678;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		margin-bottom: 12px;
	}

	.cod__text {
		margin: 0;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: clamp(14px, 1.5vw, 19px);
		line-height: 1.6;
		color: #c9d3e4;
		min-height: 8em;
	}

	.cod__diff--on {
		color: #ff6b66;
	}

	.cod__caret {
		display: inline-block;
		width: 0.55em;
		height: 1.1em;
		vertical-align: text-bottom;
		background: transparent;
	}

	.cod__caret--blink {
		background: #c9d3e4;
		animation: cod-blink 0.8s steps(1) infinite;
	}

	@keyframes cod-blink {
		50% {
			opacity: 0;
		}
	}

	.cod__play {
		margin-top: 24px;
		background: #1d2535;
		color: #e8edf7;
		border: 1px solid #34405a;
		border-radius: 10px;
		padding: 10px 28px;
		font-size: 16px;
		cursor: pointer;
	}

	.cod__play:hover:not(:disabled) {
		background: #263049;
	}

	.cod__play:disabled {
		opacity: 0.6;
		cursor: default;
	}

	.cod__footnote {
		margin-top: 20px;
		font-size: 13px;
		color: #5b6678;
	}

	@media (max-width: 760px) {
		.cod__panes {
			grid-template-columns: 1fr;
		}
	}
</style>
