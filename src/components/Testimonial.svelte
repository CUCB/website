<script>
  export let person;
  import { themeName } from "../view";
</script>

<style lang="scss">
  @import "../sass/themes.scss";

  div {
    box-sizing: border-box;
    border-style: solid;
    border-width: 2px;
    border-radius: 5px;
    padding: 0px 10px;
    width: 100%;
    max-width: 700px;
    margin: 5px auto;
    font-size: 0.8em;
    @include themeifyThemeElement($themes) {
      border-color: themed("accent");
      border-color: var(--accent);
    }
  }

  #person {
    text-align: right;
    font-style: italic;
  }
</style>

<div class="testimonial theme-{$themeName}">
  <p id="text">
    <slot />
  </p>
  <p id="person">{person}</p>
</div>
