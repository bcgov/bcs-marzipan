import path from 'path';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig, type PluginOption } from 'vite';

import { vendorCodeSplittingGroups } from './vite-chunk-groups';

// Dev (optimizeDeps) and prod (build) must use the same transform target. Default
// legacy targets cause "Transforming destructuring ... is not supported yet" when
// pre-bundling modern dependencies (@base-ui/react, reselect, etc.).
const buildTarget = 'es2022';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ] as PluginOption[],
  resolve: {
    alias: [
      /*
       * `package.json#exports` on @corpcal/shared points subpaths at dist. Without mapping
       * report modules here, calendar-ui resolves stale bundled code until `packages/shared`
       * is rebuilt. Point at workspace source so print markup + inlined PRINT_STYLES update
       * during dev without an extra package build step.
       */
      {
        find: /^@corpcal\/shared\/reports\/(.+)$/,
        replacement: `${path.resolve(__dirname, '../packages/shared/src/reports')}/$1`,
      },
      {
        find: '@',
        replacement: path.resolve(__dirname, './src'),
      },
      /*
       * @corpcal/shared print HTML pulls @tiptap/html/server in Node only; the static import
       * is still evaluated in Vite. The real package pulls happy-dom and breaks the client.
       */
      {
        find: '@tiptap/html/server',
        replacement: path.resolve(
          __dirname,
          './src/stubs/tiptapHtmlServerForClient.ts'
        ),
      },
    ],
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  optimizeDeps: {
    rolldownOptions: {
      transform: {
        target: buildTarget,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // React Compiler and deps assume modern runtimes.
    target: buildTarget,
    // Current largest chunks are expected (vendor/exceljs); keep warnings meaningful
    // without noisy output until deeper chunking work lands.
    chunkSizeWarningLimit: 1000,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [...vendorCodeSplittingGroups],
        },
      },
    },
  },
});
