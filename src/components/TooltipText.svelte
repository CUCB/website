<script>
  import tippy from "tippy.js";
  import "tippy.js/dist/tippy.css";
  import { onDestroy, onMount } from "svelte";
  import md5 from "md5";
  import escapeHtml from "escape-html";
  export let content;
  let id = md5(`t${content}`);
  let tooltip = undefined;

  onMount(() => {
    tooltip = tippy(`#tooltip-${id}`, {
      content: `<div data-test="tooltip">${escapeHtml(content).replace("\n", "<br/>")}</div>`,
      allowHTML: true,
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
