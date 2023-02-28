<script context="module" lang="ts">
  import { get, writable, type Writable } from "svelte/store";
  export const mapTitle = writable("");
  export const pageTitle = writable("");
  export const mapCentre: Writable<null | { lat: number; lng: number }> = writable(null);
  export const selectedVenue: Writable<string | null> = writable(null);

  export async function gotoVenue(selectedVenue: string) {
    if (get(page).params.venue_id) {
      goto(selectedVenue);
    } else {
      goto(`venues/${selectedVenue}`);
    }
  }
</script>

<script lang="ts">
  import VenueMap from "$lib/VenueMap.svelte";
  import Select from "../../../../components/Forms/Select.svelte";
  import { goto } from "$app/navigation";
  import SearchBox from "../../../../components/SearchBox.svelte";
  import Fuse from "fuse.js";
  import type { LayoutServerData } from "./$types";
  import { page } from "$app/stores";

  export let data: LayoutServerData;
  $: ({ allVenues, allVenueNames } = data);

  let fuse = new Fuse(data.allVenueNames, {
    threshold: 0.35,
    keys: ["name", "subvenue", "address", "postcode"],
  });
</script>

<style>
  button {
    margin-bottom: 0.5em;
  }
</style>

<h1>{$pageTitle}</h1>

<p>Choose a venue:</p>
<Select
  value="{$selectedVenue}"
  on:change="{(e) => {
    // @ts-ignore
    if (e.target?.value) {
      // @ts-ignore
      gotoVenue(e.target?.value);
    }
  }}"
>
  {#each allVenueNames as option}
    <option value="{option.id}"
      >{option.name}{#if option.subvenue}{` | ${option.subvenue}`}{/if}</option
    >
  {/each}
</Select>
<p>
  <SearchBox
    fuse="{fuse}"
    placeholder="Search all venues..."
    toId="{(venue) => venue.id}"
    on:select="{(e) => {
      $selectedVenue = e.detail.id;
      gotoVenue(e.detail.id);
    }}"
    toDisplayName="{(venue) => [venue.name, venue.subvenue].filter((i) => i != null).join(' | ')}"
  />
</p>

<slot />

{#if $mapCentre}
  <h2>{$mapTitle}</h2>
  <p>
    Check it out! Larger discs correspond to venues we've played more often. Purple ones are where you've played, red
    ones where you haven't but others have!
  </p>
  <p>Let the webmaster know if you find any mistakes!</p>
  <VenueMap lat="{$mapCentre.lat}" lng="{$mapCentre.lng}" venues="{allVenues}" />
{/if}
