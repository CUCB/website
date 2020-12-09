<script context="module">
  import { QueryEditGigDetails, QueryVenues, QueryGigTypes } from "../../../../graphql/gigs";
  import { notLoggedIn } from "../../../../client-auth";
  import { makeClient, handleErrors } from "../../../../graphql/client";

  function sortVenues(venues) {
    venues.sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : a.subvenue < b.subvenue ? -1 : a.subvenue > b.subvenue ? 1 : 0,
    );
  }

  export async function preload({ params }, session) {
    let { gig_id } = params;

    if (notLoggedIn.bind(this)(session)) return;

    let client = makeClient(this.fetch);

    let res_gig, res_venues, res_gigTypes;
    let gig, venues, gigTypes;
    try {
      res_gig = await client.query({
        query: QueryEditGigDetails,
        variables: { gig_id },
      });
      res_venues = await client.query({
        query: QueryVenues,
      });
      res_gigTypes = await client.query({
        query: QueryGigTypes,
      });
    } catch (e) {
      await handleErrors.bind(this)(e, session);
      return;
    }

    if (res_gig && res_gig.data && res_gig.data.cucb_gigs_by_pk) {
      gig = res_gig.data.cucb_gigs_by_pk;
      venues = res_venues.data.cucb_gig_venues;
      gigTypes = res_gigTypes.data.cucb_gig_types;
      sortVenues(venues);
    } else {
      this.error(404, "Gig not found");
      return;
    }

    return {
      ...gig,
      lastSaved: gig,
      venues,
      gigTypes,
    };
  }
</script>

<script>
  export let title,
    date,
    posting_time,
    posting_user,
    editing_time,
    editing_user,
    lastSaved,
    venues,
    venue_id,
    venue,
    type_id,
    gigTypes,
    id;
  import { makeTitle, themeName } from "../../../../view";
  import moment from "moment";
  import Select from "../../../../components/Forms/Select.svelte";
  import VenueEditor from "../../../../components/Gigs/VenueEditor.svelte";
  import Fuse from "fuse.js";
  import { tick } from "svelte";
  let venueSearch = "";
  let displayVenueEditor = false;
  let editingSubvenue = false;
  let searchedVenuesList, searchVenuesField, venueListElement;

  $: saved =
    lastSaved.type_id === type_id &&
    lastSaved.title === title.trim() &&
    lastSaved.date === date &&
    lastSaved.venue_id === venue_id;

  function unloadIfSaved(e) {
    if (saved) {
      delete e["returnValue"];
    } else {
      e.preventDefault();
      e.returnValue = "";
    }
  }

  function firstVenue(e) {
    if (e.which === 40) {
      searchedVenuesList.childNodes[0].focus();
    }
  }

  function nextVenue(e) {
    if (e.which === 40) {
      // arrow down
      e.preventDefault();
      document.activeElement.nextSibling.focus();
    } else if (e.which === 38) {
      // arrow up
      e.preventDefault();
      if (e.target === searchedVenuesList.childNodes[0]) {
        searchVenuesField.focus();
      } else {
        document.activeElement.previousSibling.focus();
      }
    } else if (e.which === 32) {
      // spacebar
      e.preventDefault();
      document.activeElement.click();
    }
  }

  function selectVenue(selectedVenueId) {
    return () => {
      venue_id = selectedVenueId;
      venueSearch = "";
      venueListElement.focus();
    };
  }

  function newVenue() {
    venue = {};
    editVenue();
  }

  function newSubvenue() {
    venue = { name: venue.name };
    editVenue();
  }

  function editVenue() {
    console.log(venue);
    console.log(Object.keys(venue).length);
    editingSubvenue = Object.keys(venue).length === 1; // Only name set for this
    console.log(editingSubvenue);
    lastSaved.venue = { ...lastSaved.venue };
    displayVenueEditor = true;
    venueSearch = "";
  }

  async function updateVenue(e) {
    if (venue.id !== undefined) {
      venue = e.detail.venue;
      sortVenues(venues);
      venueFuse.remove(doc => doc.id === venue.id);
    } else {
      venue = e.detail.venue;
      venue_id = venue.id;
      venues.push(venue);
      sortVenues(venues);
    }
    venueFuse.add(venue);
    lastSaved.venue = venue;
    displayVenueEditor = false;
    await tick();
    venueListElement.focus();
  }

  async function cancelEditVenue(e) {
    venue = lastSaved.venue;
    displayVenueEditor = false;
    await tick();
    venueListElement.focus();
  }

  let venueFuse = new Fuse(venues, {
    ignoreLocation: true,
    threshold: 0.4,
    keys: ["name", "subvenue", "notes_admin", "notes_band", "address", "postcode"],
  });

  $: searchedVenues = venueSearch.length < 3 ? [] : venueFuse.search(venueSearch).map(searchRes => searchRes.item);
</script>

<style lang="scss">
  @import "../../../../sass/themes.scss";

  h3 {
    font-size: 1.3em;
  }
  label {
    font-size: 0.9rem;
    padding: 0;
  }
  #searched-venues {
    display: flex;
    flex-direction: column;
  }

  form {
    max-width: 400px;
    width: 100%;
    margin: 0 0.5em;
  }

  form * {
    width: 100%;
    box-sizing: border-box;
  }

  button {
    width: unset;
  }
</style>

<svelte:head>
  <title>{makeTitle(`Edit gig: ${title.trim()}`)}</title>
</svelte:head>

<svelte:window on:beforeunload="{unloadIfSaved}" />

<h1>Gig editor</h1>
<h2>
  {title.trim()}
  {#if !saved}&nbsp;(unsaved changes){/if}
</h2>

<p>
  {#if editing_time}
    This gig was last edited at
    {moment(editing_time).format('HH:mm DD/MM/YY')}
    {#if editing_user}
      &nbsp;by user
      <a href="/members/users/{editing_user.id}">{editing_user.first}&#32;{editing_user.last}</a>
    {/if}.
  {/if}
  {#if posting_time}
    It was created on
    {moment(posting_time).format('HH:mm DD/MM/YY')}
    {#if posting_user}
      &nbsp;by user
      <a href="/members/users/{posting_user.id}">{posting_user.first}&#32;{posting_user.last}</a>
    {/if}.
  {/if}
</p>

<p>
  Always remember to click 'Save' after changing anything to be safe! You should also be able to use Alt-S or
  Alt-Shift-S or Ctrl-Alt-S. Pressing enter also often works. (Note that some fields are automatically saved:
  clients/callers/lineups and specifically changes to venue information but not the venue field itself.)
</p>
<h3>
  {#if !displayVenueEditor}Main details{:else}Edit venue{/if}
</h3>

<form on:submit|preventDefault class="theme-{$themeName}">
  {#if !displayVenueEditor}
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label>
      Event type
      <Select bind:value="{type_id}">
        {#each gigTypes as gigType}
          <option value="{gigType.id}">{gigType.title}</option>
        {/each}
      </Select>
    </label>
    <label> Title <input type="text" bind:value="{title}" data-test="gig-edit-{id}-title" /> </label>
    <label> Date <input type="date" bind:value="{date}" data-test="gig-edit-{id}-date" /> </label>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label>
      Venue
      <Select bind:value="{venue_id}" bind:select="{venueListElement}">
        {#each venues as venue}
          <option value="{venue.id}">
            {venue.name}
            {#if venue.subvenue}&nbsp;| {venue.subvenue}{/if}
          </option>
        {/each}
      </Select>
    </label>
    <input
      type="text"
      placeholder="Search venues"
      bind:value="{venueSearch}"
      on:keydown="{firstVenue}"
      bind:this="{searchVenuesField}"
      data-test="gig-edit-{id}-venue-search"
    />
    <div id="searched-venues" bind:this="{searchedVenuesList}">
      {#each searchedVenues as venue}
        <div
          class="link"
          data-test="gig-edit-{id}-venue-search-result"
          on:click="{selectVenue(venue.id)}"
          on:keydown="{nextVenue}"
          tabindex="0"
        >
          {venue.name}
          {#if venue.subvenue}&nbsp;| {venue.subvenue}{/if}
        </div>
      {/each}
    </div>

    <span>
      <button on:click="{newVenue}">Create new venue</button>
      &nbsp;
      <button on:click="{newSubvenue}">Create new subvenue</button>
      &nbsp;
      <button on:click="{editVenue}">Edit this venue</button>
    </span>
  {:else}
    <VenueEditor on:saved="{updateVenue}" on:cancel="{cancelEditVenue}" {...venue} nameEditable="{!editingSubvenue}" />
  {/if}
</form>

<h3>Client/caller details</h3>
<h3>Notes</h3>
