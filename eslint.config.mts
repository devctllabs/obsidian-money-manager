import stylistic from '@stylistic/eslint-plugin';
import obsidianmd from 'eslint-plugin-obsidianmd';
import reactHooks from 'eslint-plugin-react-hooks';
import sonarjs from 'eslint-plugin-sonarjs';
import storybook from 'eslint-plugin-storybook';
import globals from 'globals';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig(
  globalIgnores([
    'node_modules',
    'main.js',
    'dist',
    'storybook-static',
    'coverage',
    '**/*.json',
    '**/*.yaml',
    '**/*.md',
  ]),
  {
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.mts', 'esbuild.config.mjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  ...obsidianmd.configs.recommended,
  reactHooks.configs.flat.recommended,
  ...storybook.configs['flat/recommended'],
  {
    files: ['src/cli/**/*.ts'],
    languageOptions: { globals: globals.node },
    rules: { 'obsidianmd/no-nodejs-modules': 'off' },
  },
  {
    plugins: { '@stylistic': stylistic },
    rules: {
      '@stylistic/max-len': [
        'error',
        {
          code: 100,
          tabWidth: 2,
          ignoreComments: true,
          ignoreUrls: true,
          ignoreRegExpLiterals: true,
        },
      ],
      complexity: ['error', 10],
      'max-depth': ['error', 4],
      'max-params': ['error', 4],
      'max-statements': ['error', 60],
      'obsidianmd/settings-tab/prefer-setting-definitions': 'off',
      'obsidianmd/ui/sentence-case': [
        'error',
        {
          brands: ['Money Manager'],
          enforceCamelCaseLower: true,
        },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/*.test.{ts,tsx}', 'src/**/*.stories.{ts,tsx}', 'src/test/**'],
    plugins: { sonarjs },
    rules: {
      'max-lines-per-function': [
        'error',
        {
          max: 100,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      'sonarjs/cognitive-complexity': ['error', 15],
    },
  },
);
