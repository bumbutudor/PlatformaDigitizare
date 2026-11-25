const TerserPlugin = require('terser-webpack-plugin');
const config = require('flarum-webpack-config')({
    useExtensions: ['fof-upload']
});
// Build on the Windows OCR host without launching a pool of Node workers.
config.optimization = { minimizer: [new TerserPlugin({ parallel: false })] };
module.exports = config;
