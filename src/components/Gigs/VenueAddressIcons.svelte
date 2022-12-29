<script lang="ts">
  import TooltipText from "../TooltipText.svelte";
  export let venue: Venue;

  interface Venue {
    address?: string | null | undefined;
    postcode?: string | null | undefined;
    map_link?: string | null | undefined;
  }

  const address = [venue.address, venue.postcode].filter((line) => line).join("\n");
</script>

<style>
  i {
    font-size: 1.3em;
  }

  :global(.tooltip-text) {
    margin: 0 0.25em;
  }
</style>

{#if address}
  <TooltipText content="{address}" data-test="venue-address">
    <i class="las la-map-marked-alt"></i>
  </TooltipText>
{/if}
{#if venue.map_link}
  <TooltipText content="Google maps">
    <a href="{venue.map_link}" data-test="venue-map-link" target="_blank" rel="noopener noreferrer"
      ><i class="las la-directions"></i></a
    >
  </TooltipText>
{/if}
