<script>
  import tippy from "tippy.js";
  import "tippy.js/dist/tippy.css";
  import { onDestroy, onMount } from "svelte";
  import escapeHtml from "escape-html";
  import { themeName } from "../view";
  export let content;

  function makeid(length) {
    var result = "";
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
  let id = makeid(30);
  let tooltip = undefined;

  onMount(() => {
    tooltip = tippy(`#tooltip-${id}`, {
      content: `<div data-test="tooltip">${escapeHtml(content).replace(/\n/g, "<br/>")}</div>`,
      allowHTML: true,
      theme: "cucb",
    });
    if (window.Cypress) {
        let node = document.createElement("span");
        node.setAttribute("data-test", "tooltip-loaded");
        document.body.appendChild(node);
    }
  });

  onDestroy(() => {
    tooltip && tooltip.forEach(tip => tip.unmount());
  });
</script>

<style lang="scss">
  @import "../sass/themes.scss";

  span {
    @include themeifyThemeElement($themes) {
      border-bottom: 1px dashed themed("formColor");
    }
    cursor: pointer;
    user-select: none;
  }
</style>

<span id="{`tooltip-${id}`}" class="tooltip-text theme-{$themeName}" tabindex="0" data-test={$$props["data-test"]}>
  <slot />
</span>
