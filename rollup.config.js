import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default [
	{
		input: "./src/Thinker.js",
		output: {
			file: "dist/thinker.cjs",
			format: "umd",
			name: "Thinker"
		},
		plugins: [commonjs(), nodeResolve()]
	},
	{	
		input: "./src/Thinker.js",
		output: {
			file: "dist/thinker.mjs",
			format: "es"
		},
		plugins: [commonjs(), nodeResolve()]
	}
];