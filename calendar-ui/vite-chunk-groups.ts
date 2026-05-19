/**
 * Rolldown manual code-splitting groups for production builds.
 * Higher priority groups are matched first. Modules that match no group (e.g.
 * chart.js, exceljs) stay on automatic/async chunks for lazy-loaded routes.
 */
export const vendorCodeSplittingGroups = [
  {
    name: 'react',
    test: /node_modules\/(react|react-dom|scheduler)\//,
    priority: 60,
  },
  {
    name: 'react-router',
    test: /node_modules\/(react-router|react-router-dom)\//,
    priority: 55,
  },
  {
    name: 'tanstack',
    test: /node_modules\/@tanstack\//,
    priority: 50,
  },
  {
    name: 'forms',
    test: /node_modules\/(react-hook-form|@hookform|zod)\//,
    priority: 45,
  },
  {
    name: 'ui',
    test: /node_modules\/(@radix-ui|class-variance-authority|clsx|tailwind-merge|cmdk|sonner|next-themes|lucide-react)\//,
    priority: 40,
  },
  {
    name: 'vendor',
    test: /node_modules\/(?!chart\.js\/|react-chartjs-2\/|sanitize-html\/|exceljs\/)/,
    priority: 10,
  },
] as const;
