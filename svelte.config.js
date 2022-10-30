import sveltePreprocess from "svelte-preprocess";
import node from "@sveltejs/adapter-node";
import { mdsvex } from "mdsvex";
import autoprefixer from "autoprefixer";
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
    csrf: {
      checkOrigin: false,
    },
  },
  extensions: [".svelte", ".svx"],
};
