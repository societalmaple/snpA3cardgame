import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Engine and server tests run in Node; web component tests can opt into jsdom later.
    environment: 'node',
    include: ['packages/**/*.{test,spec}.ts', 'apps/**/*.{test,spec}.ts'],
  },
});
