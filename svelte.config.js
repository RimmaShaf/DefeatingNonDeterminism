import adapter from '@sveltejs/adapter-static';
import { relative, sep } from 'node:path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// defaults to rune mode for the project, except for `node_modules`. Can be removed in svelte 6.
		runes: ({ filename }) => {
			const relativePath = relative(import.meta.dirname, filename);
			const pathSegments = relativePath.toLowerCase().split(sep);
			const isExternalLibrary = pathSegments.includes('node_modules');

			return isExternalLibrary ? undefined : true;
		}
	},
	kit: {
		// Static build for GitHub Pages. Dev mode (`npm run dev`) ignores the
		// adapter entirely — localhost keeps live API routes and root paths.
		// strict: false lets the localhost-only /api/*/live POST routes be
		// omitted from the static output instead of failing the build.
		adapter: adapter({ strict: false }),
		paths: {
			// Set only by the Pages workflow (e.g. /DefeatingNonDeterminism);
			// empty locally so nothing changes for `npm run dev`.
			base: process.env.BASE_PATH ?? ''
		}
	}
};

export default config;
