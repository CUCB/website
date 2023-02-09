<script lang="ts">
  import { Loader } from "@googlemaps/js-api-loader";
  import { onMount } from "svelte";
  import { env } from "$env/dynamic/public";
  export let lat: number,
    lng: number,
    venues: {
      id: string;
      name: string;
      subvenue?: string;
      mapLink?: string;
      totalEvents: number;
      currentUserEvents: number;
      latitude: number;
      longitude: number;
    }[];
  let mapElem: HTMLDivElement;
  let map: google.maps.Map;
  let infoWindow: google.maps.InfoWindow;

  $: recenter(lat, lng);

  function recenter(lat: number, lng: number): void {
    if (map) {
      map.panTo({ lat, lng });
      infoWindow.close();
    }
  }

  onMount(() => {
    const loader = new Loader({
      // TODO this should probably send an error to sentry if it doesn't exist (although maybe not every time someone loads the page)
      apiKey: env.PUBLIC_GOOGLE_MAPS_API_KEY || "",
      version: "weekly",
    });
    loader.load().then(() => {
      map = new google.maps.Map(mapElem, { center: { lat, lng }, zoom: 15 });
      infoWindow = new google.maps.InfoWindow();

      for (const venue of venues) {
        const html = `<a data-sveltekit-noscroll data-sveltekit-preload-data="hover" href="/members/gigs/venues/${
          venue.id
        }">${venue.name}${venue.subvenue ? ` | ${venue.subvenue}` : ""}</a> ${
          venue.mapLink ? `<a href="${venue.mapLink}" target="_blank">[map]</a>` : ``
        } ${venue.totalEvents} events (you: ${venue.currentUserEvents})`;
        const icon = {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: venue.totalEvents > 0 ? (venue.currentUserEvents > 0 ? "purple" : "red") : "blue",
          fillOpacity: 0.4 + 0.6 * (1 - Math.exp(-venue.totalEvents / 100)),
          scale: 6 + 2 * Math.sqrt(venue.totalEvents),
          strokeColor: "gold",
          strokeWeight: 2,
        };
        const marker = new google.maps.Marker({
          icon,
          position: { lat: venue.latitude, lng: venue.longitude },
          map,
        });

        google.maps.event.addListener(marker, "click", () => {
          infoWindow.setContent(html);
          infoWindow.open(map, marker);
        });
      }
    });
  });
</script>

<style>
  div {
    height: 600px;
    width: 100%;
    display: block;
  }
  div :global(:not(a)) {
    color: black;
  }
  div :global(a) {
    color: rgb(7, 92, 21);
    font-weight: 500;
    text-underline-offset: 0.15em;
  }
</style>

<div bind:this="{mapElem}"></div>
