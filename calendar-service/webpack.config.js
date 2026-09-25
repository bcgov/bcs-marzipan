const fs = require('fs');
const nodeExternals = require('webpack-node-externals');
const path = require('path');

const SWAGGER_BRAND_DIR = path.join(__dirname, 'src/common/swagger');
const SWAGGER_BRAND_TEXT_FILES = ['swagger-ui-brand.css', 'swagger-ui-brand.js'];

/** Emit Swagger brand static files beside dist/main.js for /api/* serving. */
class CopySwaggerBrandAssetsPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap(
      'CopySwaggerBrandAssetsPlugin',
      (compilation) => {
        compilation.hooks.processAssets.tap(
          {
            name: 'CopySwaggerBrandAssetsPlugin',
            stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
          },
          () => {
            const { RawSource } = compiler.webpack.sources;
            for (const file of SWAGGER_BRAND_TEXT_FILES) {
              const srcPath = path.join(SWAGGER_BRAND_DIR, file);
              compilation.emitAsset(
                `common/swagger/${file}`,
                new RawSource(fs.readFileSync(srcPath, 'utf8'))
              );
            }
            const assetsDir = path.join(SWAGGER_BRAND_DIR, 'assets');
            if (fs.existsSync(assetsDir)) {
              for (const file of fs.readdirSync(assetsDir)) {
                compilation.emitAsset(
                  `common/swagger/assets/${file}`,
                  new RawSource(fs.readFileSync(path.join(assetsDir, file)))
                );
              }
            }
          }
        );
      }
    );
  }
}

module.exports = function (options, webpack) {
  return {
    ...options,
    plugins: [...(options.plugins || []), new CopySwaggerBrandAssetsPlugin()],
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
