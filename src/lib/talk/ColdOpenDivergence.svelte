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
		font-size: clamp(16px, 1.7vw, 22px);
		color: #46618f;
		border: 1px solid #b8cdec;
		border-radius: 999px;
		padding: 8px 20px;
	}

	.cod__panes {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 24px;
	}

	.cod__pane {
		background: #f6f9fe;
		border: 1px solid #d7e3f4;
		border-radius: 14px;
		padding: 24px 28px;
		min-height: 11em;
		text-align: left;
		box-shadow: 0 10px 28px rgba(23, 58, 110, 0.06);
	}

	.cod__pane-head {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: clamp(14px, 1.4vw, 17px);
		color: #2a7de1;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		margin-bottom: 14px;
	}

	.cod__text {
		margin: 0;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: clamp(17px, 1.8vw, 24px);
		line-height: 1.6;
		color: #1d2c4e;
		min-height: 8em;
	}

	.cod__diff--on {
		color: #d6453d;
		font-weight: 700;
	}

	.cod__caret {
		display: inline-block;
		width: 0.55em;
		height: 1.1em;
		vertical-align: text-bottom;
		background: transparent;
	}

	.cod__caret--blink {
		background: #1d2c4e;
		animation: cod-blink 0.8s steps(1) infinite;
	}

	@keyframes cod-blink {
		50% {
			opacity: 0;
		}
	}

	.cod__play {
		margin-top: 28px;
		background: #2a7de1;
		color: #ffffff;
		border: none;
		border-radius: 12px;
		padding: 14px 36px;
		font-size: clamp(17px, 1.7vw, 22px);
		font-weight: 600;
		cursor: pointer;
	}

	.cod__play:hover:not(:disabled) {
		background: #1e63b8;
	}

	.cod__play:disabled {
		opacity: 0.6;
		cursor: default;
	}

	.cod__footnote {
		margin-top: 22px;
		font-size: clamp(14px, 1.4vw, 18px);
		color: #5f739c;
	}

	@media (max-width: 760px) {
		.cod__panes {
			grid-template-columns: 1fr;
		}
	}
</style>
