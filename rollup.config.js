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
import { mdsvex } from "mdsvex";

const mode = process.env.NODE_ENV;
const dev = mode === "development";

require("dotenv").config();
const GRAPHQL_REMOTE = process.env.GRAPHQL_REMOTE;
const GRAPHQL_PATH = process.env.GRAPHQL_PATH;
const HCAPTCHA_SITE_KEY = process.env.HCAPTCHA_SITE_KEY;

const onwarn = (warning, onwarn) =>
  (warning.code === "MISSING_EXPORT" && /'preload'/.test(warning.message)) ||
  (warning.code === "CIRCULAR_DEPENDENCY" && /[/\\]@sapper[/\\]/.test(warning.message)) ||
  onwarn(warning);

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
    code: input.filename.match(/.*\.svelte/)
      ? input.content.replace(/(>|})\s+(?![^]*?<\/(?:script|style)>|[A-z0-9\-&]|[^<]*?>|[^{]*?})/g, "$1")
      : input.content,
  }),
};

export default {
  client: {
    input: config.client.input(),
    output: { ...config.client.output(), sourcemap: true },
    plugins: [
      replace({
        "process.browser": true,
        "process.env.NODE_ENV": JSON.stringify(mode),
        "process.env.GRAPHQL_REMOTE": JSON.stringify(GRAPHQL_REMOTE),
        "process.env.GRAPHQL_PATH": JSON.stringify(GRAPHQL_PATH),
        "process.env.HCAPTCHA_SITE_KEY": JSON.stringify(HCAPTCHA_SITE_KEY),
      }),
      svelte({
        dev,
        hydratable: true,
        emitCss: true,
        extensions: [".svelte", ".svx"],
        preprocess: [preprocess, removeWhitespace, mdsvex()],
      }),
      resolve({
        browser: true,
        dedupe: ["svelte"],
      }),
      commonjs(),
      json(),

      babel({
        extensions: [".js", ".mjs", ".html", ".svelte", ".svx"],
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
    output: { ...config.server.output(), sourcemap: true },
    plugins: [
      replace({
        "process.browser": false,
        "process.env.NODE_ENV": JSON.stringify(mode),
        "process.env.GRAPHQL_REMOTE": JSON.stringify(GRAPHQL_REMOTE),
        "process.env.GRAPHQL_PATH": JSON.stringify(GRAPHQL_PATH),
        "process.env.HCAPTCHA_SITE_KEY": JSON.stringify(HCAPTCHA_SITE_KEY),
      }),
      svelte({
        generate: "ssr",
        hydratable: true,
        dev,
        extensions: [".svelte", ".svx"],
        preprocess: [preprocess, removeWhitespace, mdsvex()],
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
    output: config.serviceworker.output(),
    plugins: [
      resolve({
        browser: true,
      }),
      !dev && terser(),
      replace({
        "process.browser": true,
        "process.env.NODE_ENV": JSON.stringify(mode),
      }),
    ],

    onwarn,
  },
};
