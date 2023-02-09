<script lang="ts">
  import { mapCentre, mapTitle, pageTitle, selectedVenue } from "./+layout.svelte";
  import { makeTitle } from "../../../../view";

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
