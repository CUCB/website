<script>
  import { makeTitle } from "../../../../../view";
  import { DateTime } from "luxon";
  import { VIEW_HIDDEN_GIGS } from "$lib/permissions";

  export let data;

  $: ({ session, contact, bookedGigs, calledGigs } = data);

  $: displayName = `${contact.name}${contact.organization ? ` @ ${contact.organization}` : ``}`;
</script>

<svelte:head>
  <title>{makeTitle(`Contact: ${displayName}`)}</title>
</svelte:head>

<h1>
  Contact info: {displayName}
</h1>

<!-- TODO dropdown/seach/(add/edit buttons) -->

<p>
  Contact name: <b>{displayName}</b>
</p>

{#if contact.user?.id}
  <p>The have an <a href="/members/users/{contact.user.id}">account on this site</a>.</p>
{/if}

{#if contact.caller}
  <p>This person is a <b>caller</b>.</p>
{/if}

{#if VIEW_HIDDEN_GIGS.guard(session) && bookedGigs}
  <h2>Gigs Booked</h2>
  <p>There are {bookedGigs.length} gig(s) booked/handled by {contact.name}.</p>

  <ul>
    {#each bookedGigs as gig}
      <li>
        <a href="/members/gigs/{gig.id}">{gig.title}</a>
        {#if gig.venue}({gig.venue.name}{gig.venue.subvenue ? ` | ${gig.venue.subvenue}` : ``}){/if}
        on {DateTime.fromJSDate(gig.date).toLocaleString()}
      </li>
    {/each}
  </ul>
{/if}

{#if calledGigs}
  <h2>Gigs Called</h2>
  <p>There are {calledGigs.length} gig(s) called by {contact.name}.</p>

  <ul>
    {#each calledGigs as gig}
      <li>
        <a href="/members/gigs/{gig.id}">{gig.title}</a>
        {#if gig.venue}({gig.venue.name}{gig.venue.subvenue ? ` | ${gig.venue.subvenue}` : ``}){/if}
        on {DateTime.fromJSDate(gig.date).toLocaleString()}
      </li>
    {/each}
  </ul>
{/if}
