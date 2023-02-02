import path from "path";
import { sveltekit } from "@sveltejs/kit/vite";
import { wasm } from "@rollup/plugin-wasm";
import dotenv from "dotenv";
import sentryVitePlugin from "@sentry/vite-plugin";
import { execSync } from "child_process";

dotenv.config();

/** @type {import('@sentry/vite-plugin').SentryVitePluginOptions} */
const sentryConfig = {
  url: "https://sentry.io",
  authToken: process.env["SENTRY_AUTH_TOKEN"],
  org: "cucb",
  project: "website",
  release: "0.1.0",
  dist: execSync("git rev-parse HEAD").toString().trim(),
  include: ".",
  deploy: {
    env: process.env["SENTRY_ENVIRONMENT"],
  },
  setCommits: {
    auto: true,
  },
  sourceMaps: {
    include: ["./dist/assets"],
    ignore: ["node_modules", "cypress"],
    validate: true,
  },
  ignore: ["node_modules", "vite.config.js"],
};

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [wasm(), sveltekit(), sentryVitePlugin(sentryConfig)],
  ssr: {
    noExternal: ["photon-web"],
  },

  define: {
    "import.meta.vitest": "undefined",
    // "import.meta.env.VITE_PLUGIN_SENTRY_CONFIG": JSON.stringify({
    //   dist: sentryConfig.dist,
    //   release: sentryConfig.release,
    // }),
  },

  build: {
    sourcemap: true,
  },

  server: {
    fs: {
      allow: [path.resolve("../../../kit")],
    },
  },

  test: {
    includeSource: ["src/**/*.{js,ts}"],
  },
};

export default config;
