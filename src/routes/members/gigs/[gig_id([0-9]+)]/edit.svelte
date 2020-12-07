<script context="module">
  import { QueryEditGigDetails, QueryVenues } from "../../../../graphql/gigs";
  import { notLoggedIn } from "../../../../client-auth";
  import { makeClient, handleErrors } from "../../../../graphql/client";

  export async function preload({ params }, session) {
    let { gig_id } = params;

    if (notLoggedIn.bind(this)(session)) return;

    let client = makeClient(this.fetch);

    let res_gig, res_venues;
    let gig, venues;
    try {
      res_gig = await client.query({
        query: QueryEditGigDetails,
        variables: { gig_id },
      });
      res_venues = await client.query({
        query: QueryVenues,
      });
    } catch (e) {
      await handleErrors.bind(this)(e, session);
      return;
    }

    if (res_gig && res_gig.data && res_gig.data.cucb_gigs_by_pk) {
      gig = res_gig.data.cucb_gigs_by_pk;
      venues = res_venues.data.cucb_gig_venues;
      venues.sort((a, b) =>
        a.name < b.name ? -1 : a.name > b.name ? 1 : a.subvenue < b.subvenue ? -1 : a.subvenue > b.subvenue ? 1 : 0,
      );
    } else {
      this.error(404, "Gig not found");
      return;
    }

    return {
      ...gig,
      lastSaved: gig,
      venues,
    };
  }
</script>

<script>
  export let title, date, posting_time, posting_user, editing_time, editing_user, lastSaved, venues, venue_id;
  import { makeTitle } from "../../../../view";
  import moment from "moment";
  import Select from "../../../../components/Forms/Select.svelte";
  import Fuse from "fuse.js";
  let venueSearch = "";

  $: saved = lastSaved.title === title.trim() && lastSaved.date === date && lastSaved.venue_id === venue_id;

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
      document.getElementById("searched-venues").childNodes[0].focus();
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
      document.activeElement.previousSibling.focus();
    } else if (e.which === 32) {
      // spacebar
      e.preventDefault();
      document.activeElement.click();
    }
  }

  function selectVenue(selectedVenueId) {
    return e => {
      venue_id = selectedVenueId;
      venueSearch = "";
      document.getElementById("venue-list").focus();
    };
  }

  let venueFuse = new Fuse(venues, {
    ignoreLocation: true,
    threshold: 0.4,
    keys: ["name", "subvenue", "notes_admin", "notes_band", "address", "postcode"],
  });

  $: searchedVenues = venueSearch.length < 3 ? [] : venueFuse.search(venueSearch).map(searchRes => searchRes.item);
</script>

<style>
  h3 {
    font-size: 1.3em;
  }
  label {
    font-size: 0.9rem;
  }
  .link,
  .link:hover,
  .link:focus {
    display: inline;
    border: none;
    background: none;
    box-shadow: none;
  }
  #searched-venues {
    display: flex;
    flex-direction: column;
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
    This gig was last edited at {moment(editing_time).format('HH:mm DD/MM/YY')}
    {#if editing_user}
      &nbsp;by user
      <a href="/members/users/{editing_user.id}">{editing_user.first}&#32;{editing_user.last}</a>
    {/if}
    .
  {/if}
  {#if posting_time}
    It was created on {moment(posting_time).format('HH:mm DD/MM/YY')}
    {#if posting_user}
      &nbsp;by user
      <a href="/members/users/{posting_user.id}">{posting_user.first}&#32;{posting_user.last}</a>
    {/if}
    .
  {/if}
</p>

<p>
  Always remember to click 'Save' after changing anything to be safe! You should also be able to use Alt-S or
  Alt-Shift-S or Ctrl-Alt-S. Pressing enter also often works. (Note that some fields are automatically saved:
  clients/callers/lineups and specifically changes to venue information but not the venue field itself.)
</p>
<h3>Main details</h3>

<form on:submit|preventDefault>
  <!-- svelte-ignore a11y-label-has-associated-control -->
  <label>
    Event type
    <Select>
      <!-- {#each gigTypes as gigType}
             
        {/each} -->
    </Select>
  </label>
  <label>
    Title
    <input type="text" bind:value="{title}" />
  </label>
  <label>
    Date
    <input type="date" bind:value="{date}" />
  </label>
  <!-- svelte-ignore a11y-label-has-associated-control -->
  <label>
    Venue
    <Select bind:value="{venue_id}" id="venue-list">
      {#each venues as venue}
        <option value="{venue.id}">
          {venue.name}
          {#if venue.subvenue}&nbsp;| {venue.subvenue}{/if}
        </option>
      {/each}
    </Select>
  </label>
  <input type="text" placeholder="Search venues" bind:value="{venueSearch}" on:keydown="{firstVenue}" />
  <div id="searched-venues">
    {#each searchedVenues as venue}
      <div class="link" on:click="{selectVenue(venue.id)}" on:keydown="{nextVenue}" tabindex="0">
        {venue.name}
        {#if venue.subvenue}&nbsp;| {venue.subvenue}{/if}
      </div>
    {/each}
  </div>

  <span>
    <button class="link">Create new venue</button>
    <button class="link">Edit this venue</button>
  </span>
</form>

<h3>Client/caller details</h3>
<h3>Notes</h3>
