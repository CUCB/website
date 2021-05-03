<script lang="ts">
  import Mailto from "../Mailto.svelte";
  import { themeName } from "../../view";
  import type { Committee } from "../../routes/$layout.svelte";
  export let committee: Committee;
</script>

<style lang="scss">
  @import "../../sass/themes.scss";

  p {
    text-align: center;
    font-size: 0.8rem;
    @include themeifyThemeElement($themes) {
      color: themed("footerColor");
    }
  }
</style>

<footer>
  <p class="theme-{$themeName}">
    This site is maintained by
    <Mailto person="{committee.webmaster}">{committee.webmaster.name}</Mailto>, please use this address if you have any
    comments or queries about the site! Any Ceilidh queries should be directed to
    <Mailto person="{committee.secretary}" showEmail="{true}" />. You can read our
    <a href="/docs/constitution.pdf" target="_blank">constitution here</a>
    and our
    <a href="/docs/GDPR.pdf" target="_blank">privacy notice here</a>.
  </p>
</footer>
