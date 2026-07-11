<script lang="ts">
	import { base } from '$app/paths';

	interface RunResult {
		index: number;
		lines: string[];
		latencyMs: number;
		error?: string;
	}

	interface ApiResponse {
		prompt: string;
		model: string;
		savedAt?: string;
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

	let runCount = $state(100);
	let pendingAction = $state<'live' | 'saved' | null>(null);
	let pending = $derived(pendingAction !== null);
	let errorMessage = $state('');
	let response = $state<ApiResponse | null>(null);
	let source = $state<'live' | 'saved' | null>(null);

	let savedAtLabel = $derived.by(() => {
		if (!response?.savedAt) return '';
		const d = new Date(response.savedAt);
		return Number.isNaN(d.getTime()) ? response.savedAt : d.toLocaleString('en-GB');
	});

	let successfulRuns = $derived(response?.runs.filter((r) => !r.error && r.lines.length > 0) ?? []);
	let failedCount = $derived((response?.runs.length ?? 0) - successfulRuns.length);
	let maxLines = $derived(successfulRuns.reduce((m, r) => Math.max(m, r.lines.length), 0));

	let poemKey = (r: RunResult) => r.lines.join(' / ');

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

	async function fetchInto(action: 'live' | 'saved', request: () => Promise<Response>) {
		errorMessage = '';
		response = null;
		source = null;
		pendingAction = action;
		try {
			const res = await request();
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body?.error ?? `HTTP ${res.status}`);
			}
			response = await res.json();
			source = action;
		} catch (e) {
			errorMessage = e instanceof Error ? e.message : 'Unknown error';
		} finally {
			pendingAction = null;
		}
	}

	// Live run: real API calls; the server also persists the JSON to
	// data/poem-variance/latest.json for later replay.
	async function runLive() {
		const n = Math.max(1, Math.min(100, runCount));
		await fetchInto('live', () =>
			fetch(`${base}/api/poem-variance/live`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ runs: n })
			})
		);
	}

	// Replay: load the last saved live run — zero API calls.
	async function showSaved() {
		await fetchInto('saved', () => fetch(`${base}/api/poem-variance`));
	}
</script>

<div class="pvd" data-module="poem-variance">
	<h4 class="pvd__title">
		One prompt, 100× to the cloud: temperature&nbsp;=&nbsp;0, Anthropic API
	</h4>

	<p class="pvd__setup">
		The same prompt goes to <code>claude-sonnet-4-6</code> one hundred times in a row with
		<code>temperature: 0</code> — formally the “deterministic” mode. Below are the real responses:
		each line of the quatrain is colored by which variant of the text this particular run got.
	</p>

	<div class="pvd__controls">
		<label class="pvd__count-label">
			runs:
			<input class="pvd__count" type="number" min="1" max="100" bind:value={runCount} />
		</label>
		<button class="pvd__button pvd__button--secondary" onclick={showSaved} disabled={pending}>
			{pendingAction === 'saved' ? 'Reading file…' : 'Show saved results'}
		</button>
		<button class="pvd__button" onclick={runLive} disabled={pending}>
			{pendingAction === 'live' ? 'Calling the API…' : 'Rerun live'}
		</button>
	</div>

	{#if errorMessage}
		<div class="pvd__error">{errorMessage}</div>
	{/if}

	{#if response && successfulRuns.length > 0}
		<div class="pvd__source" class:pvd__source--live={source === 'live'}>
			{#if source === 'live'}
				● live run — JSON saved to <code>data/poem-variance/latest.json</code>
			{:else}
				◆ saved run{savedAtLabel ? ` from ${savedAtLabel}` : ''} — zero API calls
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

		<div class="pvd__heatmap" style="grid-template-rows: repeat({maxLines}, auto)">
			{#each { length: maxLines } as _, lineIdx (lineIdx)}
				<div class="pvd__heatmap-row">
					<span class="pvd__heatmap-row-label">line {lineIdx + 1}</span>
					<div class="pvd__heatmap-cells">
						{#each successfulRuns as r (r.index)}
							{@const color = clusterColorByRun[lineIdx]?.get(r.index)}
							{@const text = r.lines[lineIdx] ?? ''}
							<span
								class="pvd__cell"
								style="background:{color ?? 'transparent'}"
								title={text}
							></span>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<div class="pvd__legend">
			{#each lineClusters as clusters, lineIdx (lineIdx)}
				<div class="pvd__legend-row">
					<span class="pvd__legend-row-label">line {lineIdx + 1}:</span>
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

	<p class="pvd__takeaway">
		<!-- On a local GPU, non-determinism comes from batching and kernel selection. At the cloud-API
		level, add MoE routing, dynamic batching of strangers' requests, and distributed inference —
		which is why even <code>temperature: 0</code> doesn't guarantee the same text twice. -->
	</p>
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

	.pvd__count-label {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 14px;
		color: var(--muted);
	}

	.pvd__count {
		width: 56px;
		font-size: 14px;
		padding: 6px 6px;
		border: 1px solid var(--hairline);
		border-radius: 6px;
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

	.pvd__button--secondary {
		background: transparent;
		color: var(--accent, #2563eb);
	}

	.pvd__source {
		font-size: 13px;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		color: var(--muted);
		margin-bottom: 8px;
	}

	.pvd__source--live {
		color: #059669;
	}

	.pvd__source code {
		font-size: 12px;
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

	.pvd__heatmap {
		display: grid;
		gap: 4px;
		margin-bottom: 12px;
		overflow-x: auto;
	}

	.pvd__heatmap-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.pvd__heatmap-row-label {
		flex: 0 0 64px;
		font-size: 12px;
		color: var(--muted);
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	}

	.pvd__heatmap-cells {
		display: flex;
		gap: 2px;
	}

	.pvd__cell {
		display: inline-block;
		width: 8px;
		height: 18px;
		border-radius: 2px;
		flex: 0 0 auto;
	}

	.pvd__legend {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-bottom: 16px;
		font-size: 13px;
	}

	.pvd__legend-row {
		display: flex;
		gap: 8px;
		align-items: flex-start;
		flex-wrap: wrap;
	}

	.pvd__legend-row-label {
		flex: 0 0 64px;
		color: var(--muted);
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
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

	.pvd__takeaway {
		font-size: 14px;
		margin: 0;
	}
</style>
