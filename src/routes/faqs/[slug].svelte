<style>
  :global(p) {
    margin-top: 0em;
  }
  :global(h3) {
    font-weight: bold !important;
    margin-bottom: 0em !important;
  }
</style>

<script context="module">
  export async function preload({ params, query }) {
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
  export let content;
</script>

<h1>Frequently Asked Questions</h1>
We've collected a few questions people commonly ask here for you to have a look
through at your own leisure! There are sections on
<a href="/faqs/book">booking us</a>
and
<a href="/faqs/join">joining us</a>
depending on what you're interested in!
<br />
<br />

{@html content}
