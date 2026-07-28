<script lang="ts">
	import { base } from '$app/paths';

	type Mode = 'identical' | 'needle';
	type NeedleVariant = 'on' | 'off';

	interface RunResult {
		index: number;
		lines: string[];
		batchSize?: number;
		needlePosition?: number;
		error?: string;
	}

	interface ApiResponse {
		prompt: string;
		model: string;
		savedAt?: string;
		batchInvariant?: boolean;
		totalWallMs?: number;
		runs: RunResult[];
	}

	interface LineCluster {
		text: string;
		count: number;
		color: string;
		runIndexes: Set<number>;
	}

	const PALETTE = [
		'#2563eb',
		'#dc2626',
		'#059669',
		'#d97706',
		'#7c3aed',
		'#db2777',
		'#0891b2',
		'#65a30d',
		'#ea580c',
		'#4338ca'
	];

	let mode = $state<Mode>('identical');
	let needleVariant = $state<NeedleVariant>('on');
	let loadedOnce = $state(false);
	let pending = $state(false);
	let errorMessage = $state('');
	let response = $state<ApiResponse | null>(null);

	let endpoint = $derived.by(() => {
		if (mode === 'identical') return `${base}/api/poem-variance-vllm`;
		return `${base}/api/poem-variance-vllm-needle-${needleVariant}`;
	});

	let savedAtLabel = $derived.by(() => {
		if (!response?.savedAt) return '';
		const d = new Date(response.savedAt);
		return Number.isNaN(d.getTime()) ? response.savedAt : d.toLocaleString('en-GB');
	});

	// The prompt asks for a quatrain; some runs ramble past it with commentary
	// or "here are some variations" filler. Only the poem itself is worth
	// visualizing, so the heatmap/legend/samples all cap at 4 lines.
	const DISPLAY_LINES = 4;

	let successfulRuns = $derived(response?.runs.filter((r) => !r.error && r.lines.length > 0) ?? []);
	let failedCount = $derived((response?.runs.length ?? 0) - successfulRuns.length);
	let maxLines = $derived(
		Math.min(DISPLAY_LINES, successfulRuns.reduce((m, r) => Math.max(m, r.lines.length), 0))
	);

	let poemKey = (r: RunResult) => r.lines.slice(0, DISPLAY_LINES).join(' / ');

	let poemFrequency = $derived.by(() => {
		const map = new Map<string, number>();
		for (const r of successfulRuns) {
			const key = poemKey(r);
			map.set(key, (map.get(key) ?? 0) + 1);
		}
		return map;
	});

	let uniquePoemCount = $derived(poemFrequency.size);
	let mostCommonCount = $derived(Math.max(0, ...poemFrequency.values()));
	let identicalRatio = $derived(
		successfulRuns.length > 0 ? mostCommonCount / successfulRuns.length : 0
	);

	// per-line clustering: for each line index, group runs by exact line text,
	// sorted by frequency so the most common phrasing always gets the first color.
	let lineClusters = $derived.by(() => {
		const result: LineCluster[][] = [];
		for (let lineIdx = 0; lineIdx < maxLines; lineIdx++) {
			const groups = new Map<string, Set<number>>();
			for (const r of successfulRuns) {
				const text = r.lines[lineIdx] ?? '';
				if (!groups.has(text)) groups.set(text, new Set());
				groups.get(text)!.add(r.index);
			}
			const clusters = [...groups.entries()]
				.map(([text, runIndexes]) => ({ text, count: runIndexes.size, runIndexes }))
				.sort((a, b) => b.count - a.count)
				.map((c, i) => ({ ...c, color: PALETTE[i % PALETTE.length] }));
			result.push(clusters);
		}
		return result;
	});

	let clusterColorByRun = $derived.by(() => {
		// [lineIdx][runIndex] -> color, for fast lookup while rendering the grid
		const map: Map<number, string>[] = [];
		for (const clusters of lineClusters) {
			const m = new Map<number, string>();
			for (const c of clusters) {
				for (const runIdx of c.runIndexes) m.set(runIdx, c.color);
			}
			map.push(m);
		}
		return map;
	});

	let topPoems = $derived(
		[...poemFrequency.entries()]
			.sort((a, b) => b[1] - a[1])
			.slice(0, 3)
			.map(([key, count]) => ({ lines: key.split(' / '), count }))
	);

	// Both modes only ever replay committed data — the vLLM server lives on an
	// ephemeral RunPod GPU pod whose address changes on every restart, so
	// there is no live-rerun route here (see the Anthropic/Groq demos for
	// that pattern).
	async function load() {
		errorMessage = '';
		pending = true;
		try {
			const res = await fetch(endpoint);
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body?.error ?? `HTTP ${res.status}`);
			}
			response = await res.json();
			loadedOnce = true;
		} catch (e) {
			errorMessage = e instanceof Error ? e.message : 'Unknown error';
		} finally {
			pending = false;
		}
	}

	function selectMode(next: Mode) {
		if (mode === next) return;
		mode = next;
		if (loadedOnce) load();
	}

	function selectVariant(next: NeedleVariant) {
		if (needleVariant === next) return;
		needleVariant = next;
		if (loadedOnce) load();
	}
</script>

<div class="pvd" data-module="poem-variance-vllm">
	<h4 class="pvd__title">Self-hosted vLLM, temperature&nbsp;=&nbsp;0: two ways to break a batch</h4>

	<div class="pvd__mode-toggle" role="tablist">
		<button
			class="pvd__mode-button"
			class:pvd__mode-button--active={mode === 'identical'}
			onclick={() => selectMode('identical')}
		>
			Same prompt ×100
		</button>
		<button
			class="pvd__mode-button"
			class:pvd__mode-button--active={mode === 'needle'}
			onclick={() => selectMode('needle')}
		>
			Needle in a mixed batch ×30
		</button>
	</div>

	{#if mode === 'identical'}
		<p class="pvd__setup">
			Same prompt, same self-hosted <code>meta-llama/Llama-3.1-8B-Instruct</code> on a single RTX
			4090, run through <a href="https://github.com/vllm-project/vllm" target="_blank" rel="noreferrer">vLLM</a>
			with <code>VLLM_BATCH_INVARIANT=1</code> — deterministic kernels instead of the default
			fastest-available ones. All 100 requests are batched together dynamically by vLLM's own
			scheduler, exactly the condition that broke determinism everywhere else in this talk.
		</p>
	{:else}
		<p class="pvd__setup">
			The same 100-identical-prompts test barely stresses the scheduler — every request has the
			same shape. Real traffic doesn't: your poem lands in a batch with <em>other people's</em>
			differently-sized requests. This test mixes the poem ("the needle") into 30 batches of
			8–96 random-length filler prompts, at a random position each time — the same
			needle-in-a-haystack method used to validate this model for vLLM's own test suite.
		</p>
		<div class="pvd__variant-toggle" role="tablist">
			<button
				class="pvd__variant-button"
				class:pvd__variant-button--active={needleVariant === 'on'}
				onclick={() => selectVariant('on')}
			>
				batch invariance: on
			</button>
			<button
				class="pvd__variant-button"
				class:pvd__variant-button--active={needleVariant === 'off'}
				onclick={() => selectVariant('off')}
			>
				batch invariance: off
			</button>
		</div>
	{/if}

	<div class="pvd__controls">
		<button class="pvd__button" onclick={load} disabled={pending}>
			{pending ? 'Reading file…' : loadedOnce ? 'Reload' : 'Show results'}
		</button>
	</div>

	{#if errorMessage}
		<div class="pvd__error">{errorMessage}</div>
	{/if}

	{#if response && successfulRuns.length > 0}
		<div class="pvd__source">
			◆ saved run{savedAtLabel ? ` from ${savedAtLabel}` : ''} — self-hosted RTX 4090, no external
			API
			{#if response.totalWallMs}
				· total wall time: <span class="pvd__wall-time">{(response.totalWallMs / 1000).toFixed(1)}</span>s
			{/if}
		</div>
		<div class="pvd__stats">
			<span class="pvd__stats-item">successful: {successfulRuns.length}</span>
			{#if failedCount > 0}
				<span class="pvd__stats-item pvd__stats-item--bad">errors: {failedCount}</span>
			{/if}
			<span class="pvd__stats-item">unique variations: {uniquePoemCount}</span>
			<span class="pvd__stats-item" class:pvd__stats-item--bad={identicalRatio < 1}>
				matched the most common: {(identicalRatio * 100).toFixed(0)}%
			</span>
		</div>

		<div class="pvd__lines">
			{#each lineClusters as clusters, lineIdx (lineIdx)}
				<div class="pvd__line-row">
					<span class="pvd__line-label">line {lineIdx + 1}</span>
					<div class="pvd__heatmap-cells">
						{#each successfulRuns as r (r.index)}
							{@const color = clusterColorByRun[lineIdx]?.get(r.index)}
							{@const text = r.lines[lineIdx] ?? ''}
							{@const tooltip =
								r.batchSize !== undefined
									? `batch size ${r.batchSize}, position ${r.needlePosition}: ${text}`
									: text}
							<span
								class="pvd__cell"
								style="background:{color ?? 'transparent'}"
								title={tooltip}
							></span>
						{/each}
					</div>
					<ul class="pvd__legend-items">
						{#each clusters as c (c.text)}
							<li class="pvd__legend-item">
								<span class="pvd__swatch" style="background:{c.color}"></span>
								<span class="pvd__legend-text">{c.text || '(empty)'}</span>
								<span class="pvd__legend-count">×{c.count}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>

		<div class="pvd__samples">
			<div class="pvd__samples-label">most frequent full variants:</div>
			{#each topPoems as poem, i (i)}
				<div class="pvd__poem">
					<div class="pvd__poem-count">×{poem.count}</div>
					<div class="pvd__poem-text">
						{#each poem.lines as line (line)}
							<div>{line}</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.pvd {
		border: 1px solid var(--hairline);
		border-radius: 10px;
		padding: 16px;
		margin: 24px 0;
		background: var(--panel, #fafafa);
	}

	.pvd__title {
		margin: 0 0 8px;
		font-size: 15px;
	}

	.pvd__mode-toggle,
	.pvd__variant-toggle {
		display: inline-flex;
		gap: 4px;
		padding: 3px;
		border-radius: 8px;
		background: rgba(0, 0, 0, 0.05);
		margin-bottom: 10px;
	}

	.pvd__mode-button,
	.pvd__variant-button {
		font-size: 13px;
		padding: 5px 12px;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: var(--muted);
		cursor: pointer;
		white-space: nowrap;
	}

	.pvd__mode-button--active,
	.pvd__variant-button--active {
		background: white;
		color: var(--ink, #1d2c4e);
		font-weight: 600;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	.pvd__setup {
		font-size: 14px;
		margin: 0 0 12px;
	}

	.pvd__controls {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 12px;
	}

	.pvd__button {
		font-size: 14px;
		padding: 6px 14px;
		border: 1px solid var(--hairline);
		border-radius: 6px;
		background: var(--accent, #2563eb);
		color: white;
		cursor: pointer;
		white-space: nowrap;
	}

	.pvd__button:disabled {
		opacity: 0.6;
		cursor: wait;
	}

	.pvd__source {
		font-size: 13px;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		color: #059669;
		margin-bottom: 8px;
	}

	.pvd__wall-time {
		font-weight: 700;
		color: #b3261e;
	}

	.pvd__error {
		font-size: 14px;
		padding: 8px 12px;
		border-radius: 8px;
		background: #fdecea;
		color: #b3261e;
		margin-bottom: 12px;
	}

	.pvd__stats {
		display: flex;
		gap: 14px;
		flex-wrap: wrap;
		font-size: 13px;
		color: var(--muted);
		margin-bottom: 12px;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	}

	.pvd__stats-item--bad {
		color: #b3261e;
		font-weight: 700;
	}

	.pvd__lines {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-bottom: 16px;
		font-size: 13px;
		overflow-x: auto;
	}

	.pvd__line-row {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		flex-wrap: wrap;
	}

	.pvd__line-label {
		flex: 0 0 64px;
		font-size: 12px;
		color: var(--muted);
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		padding-top: 3px;
	}

	.pvd__heatmap-cells {
		display: flex;
		gap: 2px;
		flex: 0 0 auto;
		padding-top: 2px;
	}

	.pvd__cell {
		display: inline-block;
		width: 8px;
		height: 18px;
		border-radius: 2px;
		flex: 0 0 auto;
	}

	.pvd__legend-items {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin: 0;
		padding: 0;
		list-style: none;
		flex: 1;
		min-width: 200px;
	}

	.pvd__legend-item {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.pvd__swatch {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 2px;
		flex: 0 0 auto;
	}

	.pvd__legend-text {
		flex: 1;
	}

	.pvd__legend-count {
		color: var(--muted);
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	}

	.pvd__samples {
		display: flex;
		gap: 16px;
		flex-wrap: wrap;
		margin-bottom: 12px;
	}

	.pvd__samples-label {
		width: 100%;
		font-size: 12px;
		color: var(--muted);
	}

	.pvd__poem {
		border: 1px solid var(--hairline);
		border-radius: 8px;
		padding: 8px 12px;
		min-width: 200px;
		flex: 1;
	}

	.pvd__poem-count {
		font-size: 12px;
		color: var(--muted);
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		margin-bottom: 4px;
	}

	.pvd__poem-text {
		font-size: 13px;
		font-style: italic;
		line-height: 1.5;
	}
</style>
