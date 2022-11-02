<script lang="ts">
  import tippy from "tippy.js";
  import type { Instance } from "tippy.js";
  import "tippy.js/dist/tippy.css";
  import { onDestroy, onMount } from "svelte";
  import { escape } from "html-escaper";
  import { themeName } from "../view";
  export let content;

  function makeid(length: number): string {
    let result = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
  let id = makeid(30);
  let tooltip = undefined;

  onMount(() => {
    tooltip = tippy(`#tooltip-${id}`, {
      content: `<div data-test="tooltip">${escape(content).replace(/\n/g, "<br/>")}</div>`,
      allowHTML: true,
      theme: "cucb",
    });
    if ("Cypress" in window) {
      let node = document.createElement("span");
      node.setAttribute("data-test", "tooltip-loaded");
      document.body.appendChild(node);
    }
  });

  onDestroy(() => tooltip?.forEach((tip: Instance) => tip.unmount()));
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

<span id="{`tooltip-${id}`}" class="tooltip-text theme-{$themeName}" tabindex="0" data-test="{$$props['data-test']}">
  <slot />
</span>
