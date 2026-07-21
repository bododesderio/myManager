import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

// Note: `import/no-unused-modules` was removed. It is broken under ESLint 9 flat
// config (requires a legacy .eslintrc shim, import-js/eslint-plugin-import#3079)
// and, even with the shim, misreports DI-wired NestJS providers/workers as
// unused exports (e.g. FacebookProcessor, which worker.module.ts imports and
// registers) — 300+ false positives. Dead-export detection isn't worth that.
export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
);
