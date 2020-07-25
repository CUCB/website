<style>
  span {
    border-bottom: 1px dashed var(--form_color);
    cursor: pointer;
    user-select: none;
  }
</style>

<script>
  import tippy from "tippy.js";
  import "tippy.js/dist/tippy.css";
  import { onMount } from "svelte";
  import md5 from "md5";
  import escapeHtml from "escape-html";
  export let content;
  let id = md5(content);

  onMount(() => {
    tippy(`#tooltip-${id}`, {
      content: `<div data-test="tooltip">${escapeHtml(content)}</div>`,
      allowHTML: true,
    });
  });
</script>

<span id="{`tooltip-${id}`}">
  <slot />
</span>
