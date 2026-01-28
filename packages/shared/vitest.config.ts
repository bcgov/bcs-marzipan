import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    exclude: ['node_modules', 'dist'],
    coverage: {
      reportsDirectory: resolve(__dirname, '../../coverage/shared'),
    },
  },
});
