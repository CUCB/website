<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { CreateVenue, UpdateVenue } from "../../graphql/gigs";
  import { Tuple, Number } from "runtypes";

  export let id: string,
    name: string,
    subvenue: string,
    map_link: string,
    distance_miles: string,
    notes_admin: string,
    notes_band: string | null,
    address: string | null,
    postcode: string | null,
    latitude: number | null,
    longitude: number | null,
    nameEditable = true;
  let initiated = false;

  const dispatch = createEventDispatcher();
  const latLngFrom = (map_link: string): [number | null, number | null] => {
    try {
      return Tuple(Number, Number).check(map_link.split(/@/)[1].split(/,/).slice(0, 2).map(parseFloat));
    } catch {
      return [null, null];
    }
  };

  const updateLatLng = (latLngFromLink: [number | null, number | null]) => {
    if (!initiated) {
      initiated = true;
      return;
    }
    latitude = map_link ? latLngFromLink[0] : null;
    longitude = map_link ? latLngFromLink[1] : null;
  };
  $: latLngFromLink = latLngFrom(map_link); // Reactivity is implemented manually with on:change because otherwise you can't edit lat and long fields manually
  $: updateLatLng(latLngFromLink);

  const saveVenue = async () => {
    if (!name.trim()) {
      return;
    }
    let variables = {
      name: name.trim(),
      subvenue: (subvenue && subvenue.trim()) || null,
      map_link: (map_link && map_link.trim()) || null,
      distance_miles: distance_miles || null,
      notes_admin: (notes_admin && notes_admin.trim()) || null,
      notes_band: (notes_band && notes_band.trim()) || null,
      address: (address && address.trim()) || null,
      postcode: (postcode && postcode.trim()) || null,
      latitude: latitude || null,
      longitude: longitude || null,
    };

    try {
      let url = `/members/gigs/venues`;
      if (id) {
        url += `/${id}`;
      }
      const body = JSON.stringify(variables);
      const res = await fetch(url, { method: "POST", body, headers: { "Content-Type": "application/json" } }).then(
        (res) => res.json(),
      );

      dispatch("saved", {
        venue: res,
      });
    } catch (e) {
      // Oh shit, probably should do something here
      console.error(e);
    }
  };
</script>

<style lang="scss">
  form,
  form * {
    width: 100%;
    box-sizing: border-box;
  }
  input[type="submit"],
  button {
    width: unset;
    margin: 0.25;
  }
  .buttons {
    display: flex;
    justify-content: center;
  }
  input:disabled {
    filter: opacity(0.5);
  }
</style>

<form on:submit|preventDefault>
  <label>
    Name
    <input type="text" bind:value="{name}" disabled="{!nameEditable}" required data-test="venue-editor-name" />
  </label>
  <label> Subvenue <input type="text" bind:value="{subvenue}" data-test="venue-editor-subvenue" /> </label>
  <label> Map link <input type="text" bind:value="{map_link}" data-test="venue-editor-map-link" /> </label>
  <label>
    Distance (miles)
    <input type="number" bind:value="{distance_miles}" min="0" max="100" data-test="venue-editor-distance" />
  </label>
  <label> Band notes <input type="text" bind:value="{notes_band}" data-test="venue-editor-notes-band" /> </label>
  <label> Admin notes <input type="text" bind:value="{notes_admin}" data-test="venue-editor-notes-admin" /> </label>
  <label> Address <input type="text" bind:value="{address}" data-test="venue-editor-address" /> </label>
  <label> Postcode <input type="text" bind:value="{postcode}" data-test="venue-editor-postcode" /> </label>
  <label>
    Latitude
    {#if latitude === latLngFromLink[0]}(inferred from map link){/if}
    <input
      type="number"
      step="0.00000001"
      min="-90"
      max="90"
      bind:value="{latitude}"
      data-test="venue-editor-latitude"
    />
  </label>
  <label>
    Longitude
    {#if longitude === latLngFromLink[1]}(inferred from map link){/if}
    <input
      type="number"
      step="0.00000001"
      min="-180"
      max="180"
      bind:value="{longitude}"
      data-test="venue-editor-longitude"
    />
  </label>
  <div class="buttons">
    <input type="submit" value="Save venue" data-test="venue-editor-save" on:click="{saveVenue}" /><button
      on:click="{() => dispatch('cancel')}"
      data-test="venue-editor-cancel">Cancel</button
    >
  </div>
</form>
