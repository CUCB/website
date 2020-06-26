<style>
  p {
    text-align: center;
    color: var(--footer_color);
    font-size: 0.8rem;
  }
</style>

<script>
  import Mailto from "./Mailto.svelte";
  export let committee;
</script>

<footer>

  <p>
    This site is maintained by
    <Mailto person="{committee.webmaster}">{committee.webmaster.name}</Mailto>
    , please use this address if you have any comments or queries about the
    site! Any Ceilidh queries should be directed to
    <Mailto person="{committee.secretary}" showEmail="{true}" />
    . You can read our
    <a href="/docs/constitution">constitution here</a>
    and our
    <a href="/docs/gdpr">privacy notice here</a>
    .
  </p>

</footer>
