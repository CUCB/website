<script>
  export let src;
  export let title;
  import { themeName } from "../view";
</script>

<style lang="scss">
  @import "../sass/themes.scss";
  iframe {
    display: block;
    width: 100%;
    max-width: 600px;
    height: 450px;
    margin: 0 auto 10px auto;
    @include themeifyThemeElement($themes) {
      box-shadow: 0 0 5px 0 themed("formColor");
    }
  }
</style>

<iframe class="theme-{$themeName}" data-test="map" {title} frameborder="0" scrolling="no" {src}></iframe>
