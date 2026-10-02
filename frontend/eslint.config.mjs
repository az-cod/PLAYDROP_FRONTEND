// Flat ESLint config for ESLint v9.
// CRA/craco handle real linting during the build (react-scripts' bundled ESLint);
// this file exists so standalone `eslint` v9 runs without an engine error.
// TypeScript files are compiled/type-stripped by Babel, so we skip them here
// (no @typescript-eslint parser is installed in this workspace).
export default [
  {
    ignores: [
      '**/node_modules/**',
      'build/**',
      'dist/**',
      'coverage/**',
      'public/**',
      'plugins/**',
      '**/*.ts',
      '**/*.tsx',
    ],
  },
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {},
  },
];
