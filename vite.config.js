import path from "path";
import { sveltekit } from "@sveltejs/kit/vite";
import { wasm } from "@rollup/plugin-wasm";

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [wasm(), sveltekit()],
  ssr: {
    noExternal: ["photon-web"],
  },

  define: {
    "import.meta.vitest": "undefined",
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
