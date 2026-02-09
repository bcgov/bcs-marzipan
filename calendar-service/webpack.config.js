const nodeExternals = require('webpack-node-externals');
const path = require('path');

module.exports = function (options, webpack) {
  return {
    ...options,
    externals: [
      nodeExternals({
        allowlist: ['@corpcal/database', '@corpcal/shared'],
        // Include root node_modules for workspace setup
        modulesDir: path.resolve(__dirname, '../../node_modules'),
      }),
    ],
    resolve: {
      ...options.resolve,
      // Ensure webpack can resolve modules from both local and root node_modules
      modules: [
        'node_modules',
        path.resolve(__dirname, '../../node_modules'),
        ...(options.resolve?.modules || []),
      ],
    },
  };
};
