<script context="module">
  export async function preload({ params }) {
    const res = await this.fetch(`faqs/${params.slug}.json`);
    const data = await res.json();

    if (res.status === 200) {
      return data;
    } else {
      this.error(res.status, data.message);
      return;
    }
  }
</script>

<script>
  import { makeTitle } from "../../view.js";
  export let content;
</script>

<style>
  :global(faq-content p) {
    margin-top: 0em;
  }
  :global(faq-content h3) {
    font-style: oblique;
    margin-bottom: 0em !important;
  }
</style>

<svelte:head>
  <title>{makeTitle('FAQs')}</title>
</svelte:head>

<h1>Frequently Asked Questions</h1>
We've collected a few questions people commonly ask here for you to have a look through at your own leisure! There are
sections on
<a href="/faqs/book">booking us</a>
and
<a href="/faqs/join">joining us</a>
depending on what you're interested in!
<br />
<br />

<faq-content>
  {@html content}
</faq-content>
