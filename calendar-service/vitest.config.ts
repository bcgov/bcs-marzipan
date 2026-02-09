import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    exclude: ['node_modules', 'dist', 'test'],
    coverage: {
      reportsDirectory: resolve(__dirname, '../coverage/service'),
    },
  },
  plugins: [
    // This is required to build the test files with SWC
    swc.vite({
      // Explicitly set the module type to avoid inheriting this value from a `.swcrc` config file
      module: { type: 'es6' },
    }),
  ],
  resolve: {
    alias: {
      // Ensure Vitest correctly resolves TypeScript path aliases
      '@corpcal/shared': resolve(__dirname, '../packages/shared/dist/cjs'),
      '@corpcal/shared/*': resolve(__dirname, '../packages/shared/dist/cjs/*'),
      '@corpcal/database': resolve(__dirname, '../packages/database/dist/cjs'),
      '@corpcal/database/*': resolve(
        __dirname,
        '../packages/database/dist/cjs/*'
      ),
    },
  },
});
