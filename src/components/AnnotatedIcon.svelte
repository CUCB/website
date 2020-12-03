<script>
  export let icon,
    color,
    style = "";
  let className;
  export { className as class };
  import { themeName } from "../view";

  function makeid(length) {
    var result = "";
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  let class_ = makeid(10);
  $: styles = "<" + `style>button.${class_} {${color ? `color: ${color};` : ""}${style}}</` + "style>";
</script>

<style lang="scss">
  @import "../sass/themes.scss";
  .annotated-icon {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: fit-content;
    cursor: pointer;
    text-align: center;
    border: none;
    height: auto;
    padding-left: 0;
    padding-right: 0;
  }

  .annotated-icon:focus,
  div:focus {
    outline: none;
    box-shadow: none;
  }

  .annotated-icon:focus > div {
    outline: 2px solid;
    @include themeifyThemeElement($themes) {
      outline-color: themed("textColor");
    }
    outline-offset: 0.5em;
  }

  i {
    font-size: 2em;
  }
  p {
    margin: 0;
  }

  @media only screen and (max-width: 400px) {
    .annotated-icon {
      flex-direction: row;
    }
    i {
      font-size: 1.5em;
    }
  }
</style>

<svelte:head>
  {@html styles}
</svelte:head>
<button
  on:click
  class="{class_}
  {className} annotated-icon"
  style="{`color: ${color};${style}`}"
  data-test="{$$props['data-test']}"
  aria-checked="{$$props['aria-checked']}"
>
  <div tabindex="-1" class="theme-{$themeName}">
    <i class="{`las la-${icon}`}"></i>
    <p>
      <slot />
    </p>
  </div>
</button>
