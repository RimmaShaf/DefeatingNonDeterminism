<script lang="ts">
	type MarginalNoteProps = {
		id: string;
		title: string;
		content: string;
	};

	let { id, title, content }: MarginalNoteProps = $props();
</script>

<details class="marginal-note marginal-note--mobile">
	<summary class="marginal-note__summary">
		<span class="marginal-note__summary-title">{title}</span>
		<span class="marginal-note__summary-hint">show</span>
	</summary>
	<div class="marginal-note__body">{content}</div>
</details>

<aside class="marginal-note marginal-note--desktop" aria-labelledby={`${id}-title`}>
	<div class="marginal-note__title" id={`${id}-title`}>{title}</div>
	<div class="marginal-note__body">{content}</div>
</aside>

<style>
	.marginal-note {
		border: 1px solid var(--note-border);
		background: var(--note-bg);
		border-radius: 10px;
		padding: 10px 12px;
		font-size: 13px;
		line-height: 1.45;
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

	@media (min-width: 1100px) {
		.marginal-note--desktop {
			position: sticky;
			top: 18px;
		}
	}

	.marginal-note--mobile {
		display: block;
	}

	.marginal-note--desktop {
		display: none;
	}

	@media (min-width: 1100px) {
		.marginal-note--mobile {
			display: none;
		}

		.marginal-note--desktop {
			display: block;
		}
	}

	.marginal-note__summary {
		cursor: pointer;
		list-style: none;
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
		padding: 2px 0 8px;
	}

	.marginal-note__summary::-webkit-details-marker {
		display: none;
	}

	.marginal-note__summary-title {
		font-weight: 600;
		color: var(--fg);
	}

	.marginal-note__summary-hint {
		font-size: 12px;
		color: var(--muted);
		white-space: nowrap;
	}

	details[open] .marginal-note__summary-hint {
		display: none;
	}

	.marginal-note__title {
		font-weight: 600;
		color: var(--fg);
		margin-bottom: 6px;
		letter-spacing: 0.01em;
	}

	.marginal-note__body {
		white-space: pre-line;
	}
</style>
