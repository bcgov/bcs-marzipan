import { resolve } from 'path';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.e2e-spec.ts'],
    globals: true,
    root: './',
    coverage: {
      reportsDirectory: resolve(__dirname, '../coverage/service-e2e'),
    },
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
  resolve: {
    alias: {
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
