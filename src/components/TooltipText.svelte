<script>
  import tippy from "tippy.js";
  import "tippy.js/dist/tippy.css";
  import { onDestroy, onMount } from "svelte";
  import escapeHtml from "escape-html";
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
  const fromCurrentStyle = prop =>
    typeof getComputedStyle !== "undefined" &&
    getComputedStyle(document.documentElement)
      .getPropertyValue(`--${prop}`)
      .trim();

  onMount(() => {
    tooltip = tippy(`#tooltip-${id}`, {
      content: `<div data-test="tooltip">${escapeHtml(content).replace("\n", "<br/>")}</div>`,
      allowHTML: true,
      theme: "cucb",
    });
  });

  onDestroy(() => {
    tooltip && tooltip.forEach(tip => tip.unmount());
  });
</script>

<style>
  span {
    border-bottom: 1px dashed var(--form_color);
    cursor: pointer;
    user-select: none;
  }
</style>

<span id="{`tooltip-${id}`}" class="tooltip-text">
  <slot />
</span>
