<script lang="ts">
	import { base } from '$app/paths';

	const SERVER_URL = 'http://localhost:8765';

	interface TokenProb {
		token: string;
		prob: number;
	}

	interface CheckResult {
		prompt: string;
		identical: boolean;
		maxAbsDiff: number;
		logitsShape: number[];
		latencyMsPass1: number;
		latencyMsPass2: number;
		sampleLogitsPass1: number[];
		sampleLogitsPass2: number[];
		topTokensPass1: TokenProb[];
		topTokensPass2: TokenProb[];
	}

	interface HistoryEntry {
		id: number;
		result: CheckResult;
	}

	interface UniqueVector {
		key: string;
		values: number[];
		count: number;
	}

	interface SavedResponse {
		prompt: string;
		model: string;
		savedAt: string;
		runs: CheckResult[];
	}

	let prompt = $state('The real meaning of life is');
	let runCount = $state(1);
	let pendingCount = $state(0);
	let errorMessage = $state('');
	let history = $state<HistoryEntry[]>([]);
	let nextId = 0;
	let savedMeta = $state<{ model: string; savedAt: string } | null>(null);
	let loadingSaved = $state(false);

	let latest = $derived(history.at(-1)?.result ?? null);
	let diverged = $derived(history.filter((h) => !h.result.identical).length);
	let totalQueued = $state(0);

	// Bucket every completed run's pass-1 logits by exact value, so repeated
	// runs of the same prompt collapse into "N distinct vectors, seen this often".
	let uniqueVectors = $derived.by((): UniqueVector[] => {
		const buckets = new Map<string, UniqueVector>();
		for (const h of history) {
			const key = h.result.sampleLogitsPass1.map((v) => v.toFixed(8)).join(',');
			const existing = buckets.get(key);
			if (existing) {
				existing.count += 1;
			} else {
				buckets.set(key, { key, values: h.result.sampleLogitsPass1, count: 1 });
			}
		}
		return Array.from(buckets.values()).sort((a, b) => b.count - a.count);
	});

	async function runOne() {
		pendingCount += 1;
		try {
			const res = await fetch(`${SERVER_URL}/api/check`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt })
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data: CheckResult = await res.json();
			history = [...history, { id: nextId++, result: data }];
		} catch (e) {
			errorMessage =
				e instanceof Error
					? `${e.message} — server running? (server/main.py, port 8765)`
					: 'Unknown error';
		} finally {
			pendingCount -= 1;
		}
	}

	function run() {
		errorMessage = '';
		savedMeta = null;
		const n = Math.max(1, Math.min(100, runCount));
		totalQueued = n;
		for (let i = 0; i < n; i++) {
			runOne();
		}
	}

	async function loadSaved() {
		errorMessage = '';
		loadingSaved = true;
		try {
			const res = await fetch(`${base}/api/live-determinism-saved`);
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body?.error ?? `HTTP ${res.status}`);
			}
			const data: SavedResponse = await res.json();
			prompt = data.prompt;
			history = data.runs.map((result) => ({ id: nextId++, result }));
			totalQueued = history.length;
			savedMeta = { model: data.model, savedAt: data.savedAt };
		} catch (e) {
			errorMessage = e instanceof Error ? e.message : 'Unknown error';
		} finally {
			loadingSaved = false;
		}
	}

	function clearHistory() {
		history = [];
		totalQueued = 0;
		errorMessage = '';
		savedMeta = null;
	}
</script>

<div class="ldd" data-module="live-determinism-talk">
	<h4 class="ldd__title">Live run: GPT-2, two consecutive forward passes</h4>

	<p class="ldd__setup">
		This is not a simulation — the request goes to a real local server (FastAPI + PyTorch) that
		loads <code>gpt2</code>, runs the same prompt in
		<code>eval()</code> mode, and compares logits bitwise (<code>torch.equal</code>).
	</p>

	<div class="ldd__controls">
		<input class="ldd__input" type="text" bind:value={prompt} placeholder="Prompt..." />
		<label class="ldd__count-label">
			×
			<input class="ldd__count" type="number" min="1" max="100" bind:value={runCount} />
		</label>
		<button class="ldd__button" onclick={run} disabled={pendingCount > 0 || loadingSaved}>
			{pendingCount > 0 ? `Running… (${pendingCount})` : 'Run'}
		</button>
		<button
			class="ldd__button ldd__button--saved"
			onclick={loadSaved}
			disabled={pendingCount > 0 || loadingSaved}
		>
			{loadingSaved ? 'Loading…' : "load precomputed results"}
		</button>
		{#if history.length > 0}
			<button class="ldd__button ldd__button--ghost" onclick={clearHistory}>Clear</button>
		{/if}
	</div>

	{#if errorMessage}
		<div class="ldd__error">{errorMessage}</div>
	{/if}

	{#if savedMeta}
		<div class="ldd__source">
			◆ saved run from {new Date(savedMeta.savedAt).toLocaleString('en-GB')} — real local
			<span class="mono">{savedMeta.model}</span> server, recorded in advance
		</div>
	{/if}

	{#if totalQueued > 0}
		<div class="ldd__status">
			<span class="ldd__status-item">
				completed: {history.length} / {totalQueued}
			</span>
			<span class="ldd__status-item">in progress: {pendingCount}</span>
			<span class="ldd__status-item">identical: {history.length - diverged}</span>
			<span class="ldd__status-item" class:ldd__status-item--bad={diverged > 0}>
				diverged: {diverged}
			</span>
		</div>
	{/if}

	{#if uniqueVectors.length > 0}
		<div class="ldd__unique">
			<div class="ldd__unique-title">
				{uniqueVectors.length} distinct logits {uniqueVectors.length === 1 ? 'vector' : 'vectors'} across {history.length}
				{history.length === 1 ? 'run' : 'runs'}
			</div>
			<table class="ldd__table ldd__table--unique">
				<tbody>
					{#each uniqueVectors as v (v.key)}
						<tr>
							<td class="ldd__token">[{v.values.map((n) => n.toFixed(6)).join(', ')}]</td>
							<td class="ldd__prob">× {v.count}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	{#if latest}
		<div class="ldd__verdict" class:ldd__verdict--diverged={!latest.identical}>
			last run: torch.equal(logits_1, logits_2) →
			<strong>{latest.identical ? 'True' : 'False'}</strong>
			{#if !latest.identical}
				· max|Δ| = {latest.maxAbsDiff}
			{/if}
		</div>

		<div class="ldd__logits">
			<div class="ldd__logits-row">
				<span class="ldd__logits-label">pass 1, logits[-1][:8]:</span>
				<span class="ldd__logits-values"
					>[{latest.sampleLogitsPass1.map((v) => v.toFixed(6)).join(', ')}]</span
				>
			</div>
			<div class="ldd__logits-row">
				<span class="ldd__logits-label">pass 2, logits[-1][:8]:</span>
				<span class="ldd__logits-values"
					>[{latest.sampleLogitsPass2.map((v) => v.toFixed(6)).join(', ')}]</span
				>
			</div>
		</div>

		<div class="ldd__tokens">
			<div class="ldd__tokens-col">
				<div class="ldd__tokens-label">Last run — pass 1, top-5 next tokens</div>
				<table class="ldd__table">
					<tbody>
						{#each latest.topTokensPass1 as t (t.token)}
							<tr>
								<td class="ldd__token">{JSON.stringify(t.token)}</td>
								<td class="ldd__prob">{(t.prob * 100).toFixed(2)}%</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div class="ldd__tokens-col">
				<div class="ldd__tokens-label">Last run — pass 2, top-5 next tokens</div>
				<table class="ldd__table">
					<tbody>
						{#each latest.topTokensPass2 as t (t.token)}
							<tr>
								<td class="ldd__token">{JSON.stringify(t.token)}</td>
								<td class="ldd__prob">{(t.prob * 100).toFixed(2)}%</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	<p class="ldd__takeaway">
		On CPU, no batching, no concurrent requests — the same deterministic computation graph executes
		the same way every time. Nondeterminism arises not from the math itself, but from execution
		conditions: batch parallelism, shape-dependent kernel selection, concurrent GPU load.
	</p>
</div>

<style>
	.ldd {
		border: 1px solid var(--hairline);
		border-radius: 10px;
		padding: 16px;
		margin: 24px 0;
		background: var(--panel, #fafafa);
		text-align: left;
	}

	.ldd__title {
		margin: 0 0 8px;
		font-size: 15px;
	}

	.ldd__setup {
		font-size: 14px;
		margin: 0 0 12px;
	}

	.ldd__controls {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 12px;
	}

	.ldd__input {
		flex: 1;
		min-width: 160px;
		font-size: 14px;
		padding: 6px 10px;
		border: 1px solid var(--hairline);
		border-radius: 6px;
	}

	.ldd__button {
		font-size: 14px;
		padding: 6px 14px;
		border: 1px solid var(--hairline);
		border-radius: 6px;
		background: var(--accent, #2563eb);
		color: white;
		cursor: pointer;
		white-space: nowrap;
	}

	.ldd__button:disabled {
		opacity: 0.6;
		cursor: wait;
	}

	.ldd__button--ghost {
		background: transparent;
		color: var(--muted);
	}

	.ldd__button--saved {
		background: #059669;
	}

	.ldd__count-label {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 14px;
		color: var(--muted);
	}

	.ldd__count {
		width: 48px;
		font-size: 14px;
		padding: 6px 6px;
		border: 1px solid var(--hairline);
		border-radius: 6px;
	}

	.ldd__source {
		font-size: 13px;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		color: #059669;
		margin-bottom: 8px;
	}

	.ldd__status {
		display: flex;
		gap: 14px;
		flex-wrap: wrap;
		font-size: 13px;
		color: var(--muted);
		margin-bottom: 12px;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	}

	.ldd__status-item--bad {
		color: #b3261e;
		font-weight: 700;
	}

	.ldd__verdict {
		font-size: 14px;
		padding: 8px 12px;
		border-radius: 8px;
		background: #e7f4e8;
		margin-bottom: 8px;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	}

	.ldd__verdict--diverged {
		background: #fdecea;
	}

	.ldd__unique {
		font-size: 13px;
		margin-bottom: 12px;
	}

	.ldd__unique-title {
		font-size: 12px;
		color: var(--muted);
		margin-bottom: 4px;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	}

	.ldd__table--unique .ldd__token {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 11px;
		white-space: nowrap;
		overflow-x: auto;
		display: block;
		max-width: 100%;
	}

	.ldd__logits {
		font-size: 12px;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		margin-bottom: 12px;
		overflow-x: auto;
	}

	.ldd__logits-row {
		white-space: nowrap;
		margin-bottom: 2px;
	}

	.ldd__logits-label {
		color: var(--muted);
		margin-right: 6px;
	}

	.ldd__error {
		font-size: 14px;
		padding: 8px 12px;
		border-radius: 8px;
		background: #fdecea;
		color: #b3261e;
		margin-bottom: 12px;
	}

	.ldd__tokens {
		display: flex;
		gap: 16px;
		margin-bottom: 12px;
		flex-wrap: wrap;
	}

	.ldd__tokens-col {
		flex: 1;
		min-width: 200px;
	}

	.ldd__tokens-label {
		font-size: 12px;
		color: var(--muted);
		margin-bottom: 4px;
	}

	.ldd__table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
	}

	.ldd__table td {
		padding: 4px 8px;
		border-bottom: 1px solid var(--hairline);
	}

	.ldd__token {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	}

	.ldd__prob {
		text-align: right;
		color: var(--muted);
	}

	.ldd__takeaway {
		font-size: 14px;
		margin: 0;
	}
</style>
