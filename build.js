const { build } = require("esbuild");
const { esbuildPluginTsc } = require("esbuild-plugin-tsc");

const sharedConfig = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  minify: false,
  // only needed if you have dependencies
  //   external: Object.keys(dependencies),
  plugins: [
    esbuildPluginTsc({
      force: true,
    }),
  ],
};

build({
  ...sharedConfig,
  platform: "node",
  format: "cjs",
  outfile: "dist/index.js",
});
