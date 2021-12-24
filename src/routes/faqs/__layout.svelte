<script>
  import { session } from "$app/stores";

  const loggedIn = $session.userId !== undefined;
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

<h1>Frequently Asked Questions</h1>
We've collected a few questions people commonly ask here for you to have a look through at your own leisure! There are sections
on
<a href="/faqs/book" sapper:noscroll>booking us</a>
{#if !loggedIn}
  &nbsp;and
  <a href="/faqs/join" sapper:noscroll>joining us</a>
{:else},
  <a href="/faqs/join" sapper:noscroll>joining us</a>
  and
  <a href="/faqs/members" sapper:noscroll>information for members</a>
{/if}
depending on what you're interested in!
<br />
<br />
<faq-content>
  <slot />
</faq-content>
