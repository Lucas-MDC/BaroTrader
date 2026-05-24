const esbuild = require('esbuild');

module.exports = {
  process(sourceText, sourcePath, options) {
    const result = esbuild.transformSync(sourceText, {
      format: options.supportsStaticESM ? 'esm' : 'cjs',
      jsx: 'automatic',
      loader: 'jsx',
      sourcefile: sourcePath,
      sourcemap: 'inline',
      target: 'node18'
    });

    return {
      code: result.code,
      map: result.map
    };
  }
};
