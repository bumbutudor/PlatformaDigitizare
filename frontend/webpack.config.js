const path = require("path");

module.exports = {
  entry: "./src/digitizare/App.js",
  mode: "development",
  output: {
    path: path.resolve(__dirname, "src/digitizare/dist"),
    filename: "bundle.js",
    publicPath: "/src/digitizare/dist/",
  },
  devServer: {
    openPage: "src/digitizare/",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader",
      },
      {
        test: /\.css$/,
        loader: "style-loader!css-loader",
      },
      {
        test: /\.json$/,
        loader: "json-loader",
        type: "javascript/auto",
      },
    ],
  },
  resolve: {
    extensions: [".js", ".json"],
  },
  node: {
    net: "empty",
    tls: "empty",
    dns: "empty",
  },
};
