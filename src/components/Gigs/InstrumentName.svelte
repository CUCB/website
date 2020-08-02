<script>
  import tippy from "tippy.js";
  import "tippy.js/dist/tippy.css";
  import TooltipText from "../TooltipText.svelte";
  import { prefs } from "../../state";
  import { onMount } from "svelte";
  export let userInstrument;
  let hover = null;

  $: showNicknames = $prefs && $prefs["style.gigs.shownicknames"];

  onMount(() => {
    hover &&
      tippy(`#instrument-nickname-${userInstrument.id}`, {
        content: hover.attributes["data-tooltip"].value,
      });
  });
</script>

{#if userInstrument.nickname}
  {#if showNicknames}
    <TooltipText content="{userInstrument.instrument.name}">{userInstrument.nickname}</TooltipText>
  {:else}
    <TooltipText content="{userInstrument.nickname}">{userInstrument.instrument.name}</TooltipText>
  {/if}
{:else}{userInstrument.instrument.name}{/if}
