import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import svelte from "rollup-plugin-svelte";
import babel from "rollup-plugin-babel";
import { terser } from "rollup-plugin-terser";
import config from "sapper/config/rollup.js";
import pkg from "./package.json";
import sveltePreprocess from "svelte-preprocess";
import workbox from "rollup-plugin-workbox";

const mode = process.env.NODE_ENV;
const dev = mode === "development";
const legacy = !!process.env.SAPPER_LEGACY_BUILD;

require("dotenv").config();
const GRAPHQL_REMOTE = process.env.GRAPHQL_REMOTE;
const GRAPHQL_PATH = process.env.GRAPHQL_PATH;

const onwarn = (warning, onwarn) =>
  (warning.code === "CIRCULAR_DEPENDENCY" && /[/\\]@sapper[/\\]/.test(warning.message)) || onwarn(warning);

const preprocess = sveltePreprocess({
  scss: {
    includePaths: ["src"],
  },
  postcss: {
    plugins: [require("autoprefixer")],
  },
});

const removeWhitespace = {
  markup: input => ({
    code: input.content.replace(/(>|})\s+(?![^]*?<\/(?:script|style)>|[A-z0-9\-&]|[^<]*?>|[^{]*?})/g, "$1"),
    //.replace(/(?<!<[^>]*?|{[^}]*?)\s+(<|{)(?![^>]*<\/(?:script|style)>)/g, '$1')
  }),
};

export default {
  client: {
    input: config.client.input(),
    output: config.client.output(),
    plugins: [
      replace({
        "process.browser": true,
        "process.env.NODE_ENV": JSON.stringify(mode),
        "process.env.GRAPHQL_REMOTE": JSON.stringify(GRAPHQL_REMOTE),
        "process.env.GRAPHQL_PATH": JSON.stringify(GRAPHQL_PATH),
      }),
      svelte({
        dev,
        hydratable: true,
        emitCss: true,
        preprocess: [preprocess, removeWhitespace],
      }),
      resolve({
        browser: true,
        dedupe: ["svelte"],
      }),
      commonjs(),
      json(),

      legacy &&
        babel({
          extensions: [".js", ".mjs", ".html", ".svelte"],
          runtimeHelpers: true,
          exclude: ["node_modules/@babel/**"],
          presets: [
            [
              "@babel/preset-env",
              {
                targets: "> 0.25%, not dead",
              },
            ],
          ],
          plugins: [
            "@babel/plugin-syntax-dynamic-import",
            [
              "@babel/plugin-transform-runtime",
              {
                useESModules: true,
              },
            ],
          ],
        }),

      !dev &&
        terser({
          module: true,
        }),
    ],

    onwarn,
  },

  server: {
    input: config.server.input(),
    output: config.server.output(),
    plugins: [
      replace({
        "process.browser": false,
        "process.env.NODE_ENV": JSON.stringify(mode),
        "process.env.GRAPHQL_REMOTE": JSON.stringify(GRAPHQL_REMOTE),
        "process.env.GRAPHQL_PATH": JSON.stringify(GRAPHQL_PATH),
      }),
      svelte({
        generate: "ssr",
        dev,
        preprocess: [preprocess, removeWhitespace],
      }),
      resolve({
        dedupe: ["svelte"],
      }),
      commonjs(),
    ],
    external: Object.keys(pkg.dependencies).concat(
      require("module").builtinModules || Object.keys(process.binding("natives")),
    ),

    onwarn,
  },

  serviceworker: {
    input: config.serviceworker.input(),
    output: { file: "temp/service-worker.js" },
    plugins: [
      resolve({
        browser: true,
      }),
      !dev && terser(),
      workbox.injectManifest({
        swSrc: "temp/service-worker.js",
        swDest: config.serviceworker.output().file,
        globDirectory: "static",
        globPatterns: ["themes/**/*", "**/*.css"],
      }),
    ],

    onwarn,
  },
};
