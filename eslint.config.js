import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import prettier from "eslint-plugin-prettier";

export default [
	{
		files: ["**/*.{ts,tsx}"],
		languageOptions: {
			parser: tsparser,
			parserOptions: {
				ecmaVersion: 2020,
				sourceType: "module",
			},
		},
		plugins: {
			"@typescript-eslint": tseslint,
			prettier: prettier,
		},
	},
	{
		ignores: ["node_modules/**", "cache/**"],
	},
];
