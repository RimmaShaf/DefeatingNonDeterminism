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
		label: 'Thinking Machines (blog)',
		title: 'Defeating Nondeterminism in LLM Inference'
	},
	batch_invariant_ops: {
		id: 'batch_invariant_ops',
		href: 'https://github.com/thinking-machines-lab/batch_invariant_ops',
		label: 'batch_invariant_ops (GitHub)',
		title: 'thinking-machines-lab/batch_invariant_ops'
	},
	quantization_instability: {
		id: 'quantization_instability',
		href: 'https://www.iro.umontreal.ca/~mignotte/IFT2425/Disasters.html',
		label: 'IFT2425',
		title: 'Disasters attributable to bad numerical computing' 
	},
	fpna_hpc_groq: {
		id: 'fpna_hpc_groq',
		href: 'https://arxiv.org/html/2408.05148v1',
		label: 'arXiv:2408.05148',
		title:
			'Impacts of floating-point non-associativity on reproducibility for HPC and deep learning (ORNL / ETH / Groq)'
	}
} as const satisfies Record<string, CitationRecord>;

export type CitationId = keyof typeof CITATIONS;

/** Display order in the "Sources" block. */
export const CITATION_ORDER: readonly CitationId[] = [
	'defeating_nondeterminism_blog',
	'batch_invariant_ops',
	'quantization_instability',
	'fpna_hpc_groq'
] as const;

export function getCitation(id: string): CitationRecord {
	if (!Object.hasOwn(CITATIONS, id)) {
		throw new Error(`Unknown citation id: ${id}`);
	}
	return CITATIONS[id as CitationId];
}
