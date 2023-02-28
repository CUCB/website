<script lang="ts">
  import { gotoVenue, mapCentre, mapTitle, pageTitle, selectedVenue } from "./+layout.svelte";
  import { makeTitle } from "../../../../view";
  import { UPDATE_GIG_DETAILS } from "$lib/permissions";
  import type { LayoutServerData } from "./$types";
  import VenueEditor from "../../../../components/Gigs/VenueEditor.svelte";

  export let data: LayoutServerData;
  $: ({ session } = data);

  let editing: {} | null = null;

  mapTitle.set("All our mapped venues!");
  pageTitle.set("Venues");
  selectedVenue.set(null);
  mapCentre.set({
    lat: 52.2053154,
    lng: 0.1182291,
  });
</script>

<style>
  td:first-child {
    padding-right: 1em;
    width: max-content;
    vertical-align: top;
  }
  h2 {
    margin-top: 1em;
  }
  .highlight {
    font-weight: bold;
  }
  table {
    max-width: 100%;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  button {
    margin-right: 0.5em;
  }
</style>

<svelte:head>
  <title>{makeTitle(`Venues`)}</title>
</svelte:head>

{#if UPDATE_GIG_DETAILS.guard(session)}
  {#if editing}
    <VenueEditor {...editing} on:saved="{(e) => gotoVenue(e.detail.venue.id)}" on:cancel="{() => (editing = null)}" />
  {:else}
    <button on:click="{() => (editing = {})}">Create new venue</button>
  {/if}
{/if}
