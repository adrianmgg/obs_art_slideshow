module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	parserOptions: {
		tsconfigRootDir: __dirname,
		project: ['./tsconfig.json'],
	},
	plugins: [
		'@typescript-eslint',
	],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:@typescript-eslint/recommended-requiring-type-checking',
	],
	rules: {
		'@typescript-eslint/no-unused-vars': 'off',
		'prefer-const': 'off',
		'@typescript-eslint/require-await': 'off',
		'no-prototype-builtins': 'off',

		'@typescript-eslint/strict-boolean-expressions': ['error', {
			allowString: false,
			allowNumber: false,
			allowNullableObject: false,
			// ... rest are false by default
		}],
		'@typescript-eslint/no-floating-promises': ['error', {
			ignoreIIFE: true,
		}],

		'@typescript-eslint/explicit-function-return-type': ['error',{
			allowExpressions: true, // TODO make this false
		}],
		'@typescript-eslint/member-delimiter-style': ['error', {
			multiline: { delimiter: 'semi', requireLast: true },
			multilineDetection: 'brackets',
		}],
		'@typescript-eslint/method-signature-style': ['error', 'property'],
		'@typescript-eslint/naming-convention': ['error',{
			selector: 'typeLike',
			format: ['PascalCase'],
		},{
			selector: ['variableLike', 'memberLike', 'property', 'method'],
			format: ['camelCase'],
			leadingUnderscore: 'allow',
		}],
		'@typescript-eslint/no-base-to-string': 'error',
		'@typescript-eslint/no-confusing-non-null-assertion': 'error',
		'@typescript-eslint/no-confusing-void-expression': 'error',
		'@typescript-eslint/no-extraneous-class': 'error',
		'@typescript-eslint/no-implicit-any-catch': 'error',
		'@typescript-eslint/no-invalid-void-type': 'error',
		'@typescript-eslint/no-meaningless-void-operator': 'error',
		'@typescript-eslint/no-non-null-asserted-nullish-coalescing': 'error',
		'@typescript-eslint/no-parameter-properties': 'error',
		'@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
		'@typescript-eslint/no-unnecessary-condition': ['error', {
			allowConstantLoopConditions: true,
		}],
		'@typescript-eslint/no-unnecessary-type-constraint': 'error',
		'@typescript-eslint/no-unsafe-argument': 'error',
		'@typescript-eslint/non-nullable-type-assertion-style': 'error',
		'@typescript-eslint/prefer-for-of': 'error',
		'@typescript-eslint/prefer-includes': 'error',
		'@typescript-eslint/prefer-nullish-coalescing': ['error', {
			ignoreConditionalTests: false,
			ignoreMixedLogicalExpressions: false,
		}],
		'@typescript-eslint/prefer-optional-chain': 'error',
		'@typescript-eslint/prefer-readonly': 'error',
		// '@typescript-eslint/prefer-readonly-parameter-types': 'error', // maybe later
		'@typescript-eslint/prefer-reduce-type-parameter': 'error',
		'@typescript-eslint/prefer-return-this-type': 'error',
		'@typescript-eslint/prefer-string-starts-ends-with': 'error',
		'@typescript-eslint/prefer-ts-expect-error': 'error',
		'@typescript-eslint/require-array-sort-compare': ['error', {
			ignoreStringArrays: true,
		}],
		'@typescript-eslint/switch-exhaustiveness-check': 'error',
		'@typescript-eslint/type-annotation-spacing': ['error', {
			before: false,
			after: true,
			overrides: {
				arrow: {
					before: true,
					after: true,
				},
			},
		}],
		'@typescript-eslint/unified-signatures': 'error',
		
		'@typescript-eslint/brace-style': ['error', 'stroustrup'],
		'@typescript-eslint/comma-dangle': ['error', 'always-multiline'],
		'@typescript-eslint/comma-spacing': ['error', {before: false, after: true}],
		'@typescript-eslint/default-param-last': 'error',
		'@typescript-eslint/dot-notation': 'error',
		'@typescript-eslint/func-call-spacing': ['error', 'never'],
		'@typescript-eslint/indent': ['error', 'tab'],
		'@typescript-eslint/keyword-spacing': ['error', {
			before: true, after: true,
			overrides: {
				if: { after: false },
				for: { after: false },
				while: { after: false },
			},
		}],
		'@typescript-eslint/no-dupe-class-members': 'error',
		'@typescript-eslint/no-extra-parens': ['off'], // TODO take a look at the options for this one, may want it enabled but with some parts allowed
		'@typescript-eslint/quotes': ['error', 'single', {
			avoidEscape: true,
			allowTemplateLiterals: false,
		}],
		'@typescript-eslint/space-infix-ops': 'error',
		'@typescript-eslint/space-before-function-paren': ['error', {
			named: 'never',
			anonymous: 'always',
			asyncArrow: 'always',
		}],
		'@typescript-eslint/semi': ['error', 'always'],
		'@typescript-eslint/return-await': ['error', 'always'], // require returned promises to be awaited, since it gives better stack traces for error handling
		'no-var': 'error',
	},
};
