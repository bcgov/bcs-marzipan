import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    exclude: ['node_modules', 'dist'],
    coverage: {
      reportsDirectory: resolve(__dirname, '../../coverage/database'),
    },
  },
});
