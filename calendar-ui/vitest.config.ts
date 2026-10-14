import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()] as any,
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // Full-page jsdom renders (e.g. ActivityPage) can exceed 5s when workers are under load.
    testTimeout: 15000,
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
      '@tiptap/html/server': path.resolve(
        __dirname,
        './src/stubs/tiptapHtmlServerForClient.ts'
      ),
    },
  },
});
