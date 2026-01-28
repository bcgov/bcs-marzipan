import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()] as any,
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      reportsDirectory: path.resolve(__dirname, '../coverage/ui'),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@corpcal/shared': path.resolve(__dirname, '../packages/shared/dist/esm'),
      '@corpcal/database': path.resolve(
        __dirname,
        '../packages/database/dist/esm'
      ),
    },
  },
});
