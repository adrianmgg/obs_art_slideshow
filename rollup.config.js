import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
	input: 'src/script.ts',
	output: {
		dir: 'build',
		format: 'iife',
		sourcemap: true,
	},
	plugins: [
		typescript(),
		nodeResolve(),
	],
}

