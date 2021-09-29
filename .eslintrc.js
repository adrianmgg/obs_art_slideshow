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

        '@typescript-eslint/strict-boolean-expressions': [2, {
            'allowString': false,
            'allowNumber': false,
            'allowNullableObject': true, // true b/c currently using for || throwError stuff
            // ... rest are false by default
        }],
        '@typescript-eslint/no-floating-promises': [2, {
            ignoreIIFE: true,
        }]
    },
};
