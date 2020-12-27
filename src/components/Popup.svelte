<script context="module">
  let count = 0;
</script>

<script>
  import { fade } from "svelte/transition";
  import { createEventDispatcher, onMount, onDestroy } from "svelte";
  import { themeName } from "../view";
  export let dirty = false;
  export let icons = true;
  export let width = undefined;

  const dispatch = createEventDispatcher();
  const closeOrCancel = () => dispatch(dirty ? "cancel" : "close");

  let index;

  onMount(() => (index = count++));
  onDestroy(() => count--);
  $: current = index === count - 1;
</script>

<style lang="scss">
  @import "../sass/themes.scss";
  .icons {
    display: flex;
    position: absolute;
    right: 10px;
  }
  i {
    font-size: 2em;
    margin: 0;
    padding: 0;
    cursor: pointer;
    z-index: 10;
  }
  popup-box {
    /* NB background themed in src/sass/themes.scss */
    display: block;
    border-radius: 5px;
    width: 90%;
    padding-right: 2em;
    box-sizing: border-box;
    box-shadow: 0px 0px 10px #888888;
    padding: 10px;
    position: relative;
    z-index: 20;
    @include themeifyThemeElement($themes) {
      background: themed("background");
    }
  }

  box-container {
    position: absolute;
    width: 100%;
    height: 100%;
    max-height: 100vh;
    max-height: calc(100 * var(--vh));
    margin: 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  click-target {
    position: fixed;
    height: 100%;
    width: 100%;
  }
</style>

<click-target on:click|self={() => current && !dirty && dispatch('close')}></click-target>
<box-container on:click|self="{() => current && !dirty && dispatch('close')}">
  <popup-box
    on:click|stopPropagation
    transition:fade="{{ duration: 250 }}"
    style="{width ? `width: ${width}` : ``}"
    class="theme-{$themeName}"
  >
    {#if icons}
      <div class="icons">
        {#if dirty}
          <i class="las la-save" on:click="{() => dispatch('save')}" transition:fade="{{ duration: 250 }}"></i>
        {/if}
        <i class="las la-times" on:click="{closeOrCancel}" transition:fade="{{ duration: 250 }}"></i>
      </div>
    {/if}
    <slot />
  </popup-box>
</box-container>
