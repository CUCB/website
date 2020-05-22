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
{@html content}
