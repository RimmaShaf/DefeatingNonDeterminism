export type CitationRecord = {
	id: string;
	href: string;
	label: string;
	title: string;
};

export const CITATIONS = {
	defeating_nondeterminism_blog: {
		id: 'defeating_nondeterminism_blog',
		href: 'https://thinkingmachines.ai/blog/defeating-nondeterminism-in-llm-inference/',
		label: 'Thinking Machines (блог)',
		title: 'Defeating Nondeterminism in LLM Inference'
	},
	batch_invariant_ops: {
		id: 'batch_invariant_ops',
		href: 'https://github.com/thinking-machines-lab/batch_invariant_ops',
		label: 'batch_invariant_ops (GitHub)',
		title: 'thinking-machines-lab/batch_invariant_ops'
	}
} as const satisfies Record<string, CitationRecord>;

export type CitationId = keyof typeof CITATIONS;

/** Порядок вывода в блоке «Источники». */
export const CITATION_ORDER: readonly CitationId[] = [
	'defeating_nondeterminism_blog',
	'batch_invariant_ops'
] as const;

export function getCitation(id: string): CitationRecord {
	if (!Object.hasOwn(CITATIONS, id)) {
		throw new Error(`Unknown citation id: ${id}`);
	}
	return CITATIONS[id as CitationId];
}
