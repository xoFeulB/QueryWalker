import path from "path";

const conf = [
  {
    performance: {
      maxEntrypointSize: 50000000,
      maxAssetSize: 50000000,
    },
    mode: "production",
    entry: "./src/querywalker.js",
    output: {
      path: `${process.cwd()}/dist`,
      filename: "querywalker.js",
      library: {
        type: "module",
      },
    },
    resolve: {
      extensions: [".js"],
      alias: {
        QueryWalker: path.resolve(process.cwd(), "src/"),
      },
    },
    experiments: {
      outputModule: true,
    },
  },
];
export { conf as default };
