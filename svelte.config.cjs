const sveltePreprocess = require("svelte-preprocess");
const node = require("@sveltejs/adapter-node");
const { mdsvex } = require("mdsvex");
const preprocessors = sveltePreprocess({
  scss: {
    includePaths: ["src"],
  },
  postcss: {
    plugins: [require("autoprefixer")],
  },
});

/** @type {import('@sveltejs/kit').Config} */
module.exports = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: [mdsvex(), preprocessors],
  kit: {
    // By default, `npm run build` will create a standard Node app.
    // You can create optimized builds for different platforms by
    // specifying a different adapter
    adapter: node(),

    // hydrate the <div id="svelte"> element in src/app.html
    target: "#svelte",
  },
  extensions: [".svelte", ".svx"],
};