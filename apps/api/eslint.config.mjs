import eslint from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      '@typescript-eslint/no-require-imports': 'off',
      'import/no-unused-modules': ['warn', {
        unusedExports: true,
        src: ['src/**/*.ts'],
        ignoreExports: ['src/main.ts', 'src/app.module.ts'],
      }],
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
);
