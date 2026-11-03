import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.js'],
    setupFiles: ['./src/test/setup.js'],
    testTimeout: 10000,
  },
});