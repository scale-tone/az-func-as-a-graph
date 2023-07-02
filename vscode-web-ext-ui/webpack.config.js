const webpack = require('webpack');
module.exports = {
  // ...
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ],
};