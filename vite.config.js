import path from "path";
import { sveltekit } from "@sveltejs/kit/vite";
import { wasm } from "@rollup/plugin-wasm";
import sentryVitePlugin from "@sentry/vite-plugin";
import { execSync } from "child_process";
import { loadEnv, defineConfig } from "vite";

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd(), "") };

  /** @type {import('@sentry/vite-plugin').SentryVitePluginOptions} */
  const sentryConfig = !process.env["SENTRY_SKIP"] && {
    url: "https://sentry.io",
    authToken: process.env["SENTRY_AUTH_TOKEN"],
    org: "cucb",
    project: "website",
    release: "0.1.1",
    dist: execSync("git rev-parse HEAD").toString().trim(),
    include: ".",
    deploy: {
      env: process.env["SENTRY_ENVIRONMENT"],
    },
    setCommits: {
      auto: true,
      ignoreMissing: true,
    },
    sourceMaps: {
      include: ["./dist/assets"],
      ignore: ["node_modules", "cypress"],
      validate: true,
    },
    ignore: ["node_modules", "vite.config.js"],
  };

  const plugins = [wasm(), sveltekit()];

  /** @type {import('vite').UserConfig} */
  const config = {
    plugins: sentryConfig ? [...plugins, sentryVitePlugin(sentryConfig)] : plugins,
    ssr: {
      noExternal: ["photon-web"],
    },

    define: {
      "import.meta.vitest": "undefined",
      "import.meta.sentry": {
        dist: sentryConfig.dist,
        release: sentryConfig.release,
      },
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
  return defineConfig(config);
};
//export default config;
