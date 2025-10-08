import { defineConfig } from '@shahrad/eslint-config';
import globals from 'globals';

export default defineConfig(
  {
    ignores: ['dist/**', 'scripts/**'],
  },

  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      'no-console': 'error',
    },
  }
);
