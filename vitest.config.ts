import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';

process.env.PLAYWRIGHT_BROWSERS_PATH ??= `${import.meta.dirname}/.cache/playwright`;

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias: { obsidian: `${import.meta.dirname}/src/test/obsidian.ts` } },
        plugins: [react()],
        test: {
          name: 'unit',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['src/cli/**/*.test.ts'],
          setupFiles: ['src/test/setup.ts'],
        },
      },
      {
        test: {
          name: 'cli',
          environment: 'node',
          include: ['src/cli/**/*.test.ts'],
        },
      },
      {
        plugins: [storybookTest({ configDir: '.storybook' })],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        test: {
          name: 'performance',
          environment: 'node',
          include: ['test/performance/**/*.test.ts'],
        },
      },
    ],
  },
});
