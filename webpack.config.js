var path = require('path');

module.exports = {
  mode: "production",
  entry: "./src/BarcodeReader.js",
  output: {
    path: path.resolve(__dirname, "dist"), // string
    filename: "bundle.js",
    library: "BarcodeReader",
    libraryTarget: "umd"
  },
  devtool: "source-map",
  context: __dirname,
  target: "web",
  stats: "errors-only"
}
