import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';
import { resolve } from 'path';

export default defineConfig({
  plugins: [swc.vite()],
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.e2e-spec.ts'],
    exclude: ['node_modules', 'dist', 'src'],
    root: './',
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
