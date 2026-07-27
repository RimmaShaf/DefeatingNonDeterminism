<script lang="ts">
	import { base } from '$app/paths';

	interface RunResult {
		index: number;
		lines: string[];
		error?: string;
	}

	interface TempResult {
		temperature: number;
		seed: number;
		savedAt?: string;
		runs: RunResult[];
	}

	interface ApiResponse {
		temps: TempResult[];
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

	let loadedOnce = $state(false);
	let pending = $state(false);
	let errorMessage = $state('');
	let response = $state<ApiResponse | null>(null);
	let selectedTemp = $state<number | null>(null);

	function uniqueCount(runs: RunResult[]) {
		const successful = runs.filter((r) => !r.error && r.lines.length > 0);
		const keys = new Set(successful.map((r) => r.lines.join(' / ')));
		return { unique: keys.size, total: successful.length };
	}

	function preview(runs: RunResult[]) {
		const first = runs.find((r) => !r.error && r.lines.length > 0);
		if (!first) return '';
		const text = first.lines.join(' ');
		return text.length > 260 ? text.slice(0, 260).trimEnd() + '…' : text;
	}

	let selectedResult = $derived(
		response?.temps.find((t) => t.temperature === selectedTemp) ?? null
	);

	let successfulRuns = $derived(
		selectedResult?.runs.filter((r) => !r.error && r.lines.length > 0) ?? []
	);

	let maxLines = $derived(
		Math.min(5, successfulRuns.reduce((m, r) => Math.max(m, r.lines.length), 0))
	);

	// Same per-line clustering as the plain vLLM demo: group runs by exact line
	// text so identical output collapses into a single solid-color bar.
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

	async function load() {
		errorMessage = '';
		pending = true;
		try {
			const res = await fetch(`${base}/api/poem-variance-vllm-temp`);
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body?.error ?? `HTTP ${res.status}`);
			}
			response = await res.json();
			loadedOnce = true;
			selectedTemp = response?.temps[0]?.temperature ?? null;
		} catch (e) {
			errorMessage = e instanceof Error ? e.message : 'Unknown error';
		} finally {
			pending = false;
		}
	}
</script>

<div class="pvt" data-module="poem-variance-vllm-temp">
	<h4 class="pvt__title">
		Same fixed <code>seed</code>, cranking <code>temperature</code>: 0.3 → 0.7 → 1.0
	</h4>
	<p class="pvt__setup">
		Same self-hosted <code>meta-llama/Llama-3.1-8B-Instruct</code>, same
		<code>VLLM_BATCH_INVARIANT=1</code>, same <code>seed=42</code> — only the sampling temperature
		changes. 30 runs per temperature, all batched together.
	</p>

	<div class="pvt__controls">
		<button class="pvt__button" onclick={load} disabled={pending}>
			{pending ? 'Reading files…' : loadedOnce ? 'Reload' : 'Show results'}
		</button>
	</div>

	{#if errorMessage}
		<div class="pvt__error">{errorMessage}</div>
	{/if}

	{#if response}
		<div class="pvt__grid">
			{#each response.temps as t (t.temperature)}
				{@const { unique, total } = uniqueCount(t.runs)}
				<button
					class="pvt__card"
					class:pvt__card--active={selectedTemp === t.temperature}
					onclick={() => (selectedTemp = t.temperature)}
				>
					<div class="pvt__temp">temperature = {t.temperature}</div>
					<div class="pvt__stat" class:pvt__stat--bad={unique > 1}>
						{unique === 1 ? '1' : unique} unique output{unique === 1 ? '' : 's'}
						<span class="pvt__stat-sub">across {total} runs</span>
					</div>
					<div class="pvt__poem">{preview(t.runs)}</div>
				</button>
			{/each}
		</div>

		{#if selectedResult && maxLines > 0}
			<div class="pvt__detail">
				<div class="pvt__detail-label">
					every line, all {successfulRuns.length} runs at
					<span class="mono">temperature={selectedResult.temperature}</span> — one rectangle per
					run, one color per distinct wording
				</div>
				<div class="pvt__heatmap" style="grid-template-rows: repeat({maxLines}, auto)">
					{#each { length: maxLines } as _, lineIdx (lineIdx)}
						<div class="pvt__heatmap-row">
							<span class="pvt__heatmap-row-label">line {lineIdx + 1}</span>
							<div class="pvt__heatmap-cells">
								{#each successfulRuns as r (r.index)}
									{@const color = clusterColorByRun[lineIdx]?.get(r.index)}
									{@const text = r.lines[lineIdx] ?? ''}
									<span class="pvt__cell" style="background:{color ?? 'transparent'}" title={text}
									></span>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.pvt {
		border: 1px solid var(--hairline);
		border-radius: 10px;
		padding: 16px;
		margin: 24px 0;
		background: var(--panel, #fafafa);
	}

	.pvt__title {
		margin: 0 0 8px;
		font-size: 15px;
	}

	.pvt__setup {
		font-size: 14px;
		margin: 0 0 12px;
	}

	.pvt__controls {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 14px;
	}

	.pvt__button {
		font-size: 14px;
		padding: 6px 14px;
		border: 1px solid var(--hairline);
		border-radius: 6px;
		background: var(--accent, #2563eb);
		color: white;
		cursor: pointer;
		white-space: nowrap;
	}

	.pvt__button:disabled {
		opacity: 0.6;
		cursor: wait;
	}

	.pvt__error {
		font-size: 14px;
		padding: 8px 12px;
		border-radius: 8px;
		background: #fdecea;
		color: #b3261e;
		margin-bottom: 12px;
	}

	.pvt__grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 12px;
		margin-bottom: 16px;
	}

	.pvt__card {
		border: 1px solid var(--hairline);
		border-radius: 8px;
		padding: 12px 14px;
		background: white;
		text-align: left;
		font: inherit;
		cursor: pointer;
	}

	.pvt__card--active {
		border-color: var(--accent, #2563eb);
		box-shadow: 0 0 0 1px var(--accent, #2563eb);
	}

	.pvt__temp {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 12px;
		color: var(--muted);
		margin-bottom: 6px;
	}

	.pvt__stat {
		font-size: 20px;
		font-weight: 700;
		color: #059669;
		margin-bottom: 8px;
	}

	.pvt__stat--bad {
		color: #b3261e;
	}

	.pvt__stat-sub {
		display: block;
		font-size: 12px;
		font-weight: 400;
		color: var(--muted);
	}

	.pvt__poem {
		font-size: 13px;
		font-style: italic;
		line-height: 1.5;
		color: var(--ink, #1d2c4e);
	}

	.pvt__detail {
		border-top: 1px solid var(--hairline);
		padding-top: 14px;
	}

	.pvt__detail-label {
		font-size: 13px;
		color: var(--muted);
		margin-bottom: 10px;
		text-align: left;
	}

	.pvt__heatmap {
		display: grid;
		gap: 4px;
	}

	.pvt__heatmap-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.pvt__heatmap-row-label {
		flex: 0 0 64px;
		font-size: 12px;
		color: var(--muted);
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		text-align: left;
	}

	.pvt__heatmap-cells {
		display: flex;
		gap: 2px;
		flex-wrap: wrap;
	}

	.pvt__cell {
		display: inline-block;
		width: 8px;
		height: 18px;
		border-radius: 2px;
		flex: 0 0 auto;
	}
</style>
