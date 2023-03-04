<script lang="ts">
  import type { PageData } from "../$types";

  export let data: PageData;
  const { optionalSession } = data;

  const loggedIn = optionalSession.userId !== undefined;
</script>

<style>
  faq-content :global(p) {
    margin-top: 0em;
  }
  faq-content :global(h3) {
    font-style: oblique;
    margin-bottom: 0em !important;
  }
</style>

<h1>Frequently Asked Questions</h1>
We've collected a few questions people commonly ask here for you to have a look through at your own leisure! There are sections
on
<a href="/faqs/book" data-sveltekit-noscroll>booking us</a>
{#if !loggedIn}
  &nbsp;and
  <a href="/faqs/join" data-sveltekit-noscroll>joining us</a>
{:else},
  <a href="/faqs/join" data-sveltekit-noscroll>joining us</a>
  and
  <a href="/faqs/members" data-sveltekit-noscroll>information for members</a>
{/if}
depending on what you're interested in!
<br />
<br />
<faq-content>
  <slot />
</faq-content>
