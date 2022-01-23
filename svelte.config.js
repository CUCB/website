import sveltePreprocess from "svelte-preprocess";
import node from "@sveltejs/adapter-node";
import { mdsvex } from "mdsvex";
import autoprefixer from "autoprefixer";
import wasmPack from "vite-plugin-wasm-pack";
const preprocessors = sveltePreprocess({
  scss: {
    includePaths: ["src"],
  },
  postcss: {
    plugins: [autoprefixer],
  },
});

/** @type {import('@sveltejs/kit').Config} */
export default {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: [mdsvex(), preprocessors],
  kit: {
    adapter: node(),
    // hydrate the <div id="svelte"> element in src/app.html
    target: "#svelte",
  },
  vite: {
    plugins: [wasmPack([], ["photon-web"])],
    ssr: {
      noExternal: ["photon-web"],
    },
  },
  extensions: [".svelte", ".svx"],
};
