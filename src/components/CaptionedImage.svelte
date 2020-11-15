<script>
  export let src, alt;
  import { themeName } from "../view";
</script>

<style lang="scss">
  @import "../sass/themes.scss";

  img {
    display: block;
    width: 100%;
    @include themeifyThemeElement($themes) {
      box-shadow: 0 0 5px themed("formColor");
    }
  }

  .captioned-image {
    display: block;
    margin: auto;
    width: 100%;
    max-width: 600px;
    box-sizing: border-box;
  }

  .captioned-image p {
    font-style: italic;
    text-align: center;
    margin-top: 0.5em;
  }
</style>

<div class="captioned-image">
  <img {src} {alt} class="theme-{$themeName}" />
  <p>
    <slot />
  </p>
</div>
