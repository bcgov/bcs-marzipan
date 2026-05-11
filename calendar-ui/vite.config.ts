import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type PluginOption } from 'vite';

// Dev (optimizeDeps) and prod (build) must use the same esbuild target. Default
// legacy targets cause "Transforming destructuring ... is not supported yet" when
// pre-bundling modern dependencies (@base-ui/react, reselect, etc.).
const buildTarget = 'es2022';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'], // must run first!
      },
    }),
    tailwindcss(),
  ] as PluginOption[],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // @corpcal/shared print HTML uses @tiptap/html/server in Node only. The static import
      // is still evaluated in Vite; the real package pulls happy-dom and breaks the client.
      '@tiptap/html/server': path.resolve(
        __dirname,
        './src/stubs/tiptapHtmlServerForClient.ts'
      ),
    },
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
    esbuildOptions: {
      target: buildTarget,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // React Compiler and deps assume modern runtimes.
    target: buildTarget,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, '/');
          if (!normalizedId.includes('node_modules/')) {
            return undefined;
          }
          // Order matters: match specific packages first, then vendor catch-all.
          if (
            normalizedId.includes('node_modules/react/') ||
            normalizedId.includes('node_modules/react-dom/') ||
            normalizedId.includes('node_modules/scheduler/')
          ) {
            return 'react';
          }
          if (
            normalizedId.includes('node_modules/react-router/') ||
            normalizedId.includes('node_modules/react-router-dom/')
          ) {
            return 'react-router';
          }
          if (normalizedId.includes('node_modules/@tanstack/')) {
            return 'tanstack';
          }
          if (
            normalizedId.includes('node_modules/react-hook-form/') ||
            normalizedId.includes('node_modules/@hookform/') ||
            normalizedId.includes('node_modules/zod/')
          ) {
            return 'forms';
          }
          // shadcn/ui ecosystem: Radix primitives, styling utilities, icons, toast, theming.
          // Grouped together because every shadcn component depends on this set.
          if (
            normalizedId.includes('node_modules/@radix-ui/') ||
            normalizedId.includes('node_modules/class-variance-authority/') ||
            normalizedId.includes('node_modules/clsx/') ||
            normalizedId.includes('node_modules/tailwind-merge/') ||
            normalizedId.includes('node_modules/cmdk/') ||
            normalizedId.includes('node_modules/sonner/') ||
            normalizedId.includes('node_modules/next-themes/') ||
            normalizedId.includes('node_modules/lucide-react/')
          ) {
            return 'ui';
          }
          // Libraries only reached via dynamic import() — return undefined so
          // Rollup keeps them in the importing async chunk instead of vendor.
          //  - chart.js / react-chartjs-2: lazy-loaded DashboardBarChart
          //  - sanitize-html: banner-html and similar
          if (
            normalizedId.includes('node_modules/chart.js/') ||
            normalizedId.includes('node_modules/react-chartjs-2/') ||
            normalizedId.includes('node_modules/sanitize-html/')
          ) {
            return undefined;
          }
          return 'vendor';
        },
      },
    },
  },
});
