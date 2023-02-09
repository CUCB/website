<script lang="ts">
  import { DateTime } from "luxon";
  import type { PageServerData } from "./$types";
  import { makeTitle } from "../../../../../view";
  import { goto } from "$app/navigation";
  import VenueEditor from "../../../../../components/Gigs/VenueEditor.svelte";
  import { UPDATE_GIG_DETAILS } from "../../../../../lib/permissions";
  import { mapCentre, mapTitle, pageTitle, selectedVenue } from "../+layout.svelte";

  export let data: PageServerData;
  $: pageTitle.set(`Venue info: ${venue.name}${venue.subvenue ? ` | ${venue.subvenue}` : ""}`);
  mapTitle.set("Map near the venue!");
  $: mapCentre.set((venue.latitude && venue.longitude && { lat: venue.latitude, lng: venue.longitude }) || null);
  $: selectedVenue.set(venue.id);

  let editing: Omit<typeof data.venue, "gigs"> | {} | null = null;
  let confirmDelete = false;
  $: ({ venue, session, lineupPeople, contacts, subvenues } = data);
  const marks = (gig: { contacts: { contact: { user?: { id: string } } }[]; lineup: { user: { id: string } }[] }) =>
    [
      gig.contacts.find((u) => u.contact.user?.id && session.userId && u.contact.user.id === session.userId) && "C",
      gig.lineup.find((u) => u.user.id === session.userId) && "X",
    ].filter((i) => i);
  $: gigs = venue.gigs.filter((gig) => gig.type.code === "gig");
  $: calendarEvents = venue.gigs.filter((gig) => gig.type.code === "calendar");
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
  <title>{makeTitle(`Venue: ${venue.name}`)}</title>
</svelte:head>

{#if UPDATE_GIG_DETAILS.guard(session)}
  {#if editing}
    <VenueEditor
      {...editing}
      on:saved="{(e) => {
        const gigs = venue.gigs;
        venue = e.detail.venue;
        venue.gigs = gigs;
        $selectedVenue = venue.id;
        goto(venue.id);
        editing = null;
      }}"
      on:cancel="{() => (editing = null)}"
    />
  {:else if confirmDelete}
    <p>Are you sure you wish to delete <em>{venue.name}{venue.subvenue ? ` | ${venue.subvenue}` : ""}</em>?</p>
    <button
      on:click="{async () => {
        const res = await fetch('', { method: 'DELETE' });
        if (res.status >= 300) {
          // TODO sentry
          console.error('Oh shit');
          confirmDelete = false;
        } else {
          await goto('.');
        }
      }}">Confirm</button
    >
    <button on:click="{() => (confirmDelete = false)}">Cancel</button>
  {:else}
    <button on:click="{() => (editing = {})}">Create new venue</button>
    <button on:click="{() => (editing = { ...venue })}">Edit this venue</button>
    <button on:click="{() => (confirmDelete = true)}">Delete this venue</button>
  {/if}
{/if}

<p>
  Venue name: {#if venue.subvenue}<b>{venue.subvenue}</b> within {/if}<b>{venue.name}</b>. {#if venue.map_link}A map is <a
      href="{venue.map_link}">available here</a
    >.{/if}
</p>

{#if venue.address}
  <blockquote>
    {@html venue.address.replace(",", "<br />")}{#if venue.postcode}<br /><b>{venue.postcode}</b>{/if}
  </blockquote>
{/if}

{#if subvenues.length > 1}
  <h2>Related venues</h2>
  <p>The following venues are in the same location:</p>
  <ul>
    {#each subvenues as subvenue}
      {@const isSelected = subvenue.id === venue.id}
      <li>
        <svelte:element
          this="{isSelected ? 'b' : 'a'}"
          href="{isSelected ? undefined : `/members/gigs/venues/${subvenue.id}`}"
          >{subvenue.name}{#if subvenue.subvenue}{` | ${subvenue.subvenue}`}{/if}</svelte:element
        >
      </li>
    {/each}
  </ul>
{/if}

{#if calendarEvents.length > 0}<h2>Calendar Events Held Here</h2>
  <p>The following calendar events were held here:</p>
  <ul>
    {#each calendarEvents as event}
      <li>
        <a href="/members/gigs/{event.id}">{event.title}</a>
        {#if event.arrive_time}on {DateTime.fromJSDate(event.arrive_time).toLocaleString()}{/if}
      </li>
    {/each}
  </ul>
{/if}

<h2>Gigs held here</h2>
{#if gigs.length > 0}
  <p>
    There are {gigs.length} gig(s) listed at this venue. Any gigs you have played are marked with an [X]; any you have called
    with a [C].
  </p>
  <ul>
    {#each gigs as gig}
      {@const m = marks(gig)}
      <li>
        {#if m.length > 0}<b>[{m.join("")}]</b>{/if}
        <a href="/members/gigs/{gig.id}">{gig.title}</a>
        {#if gig.date}on {DateTime.fromJSDate(gig.date).toLocaleString()}{/if}
      </li>
    {/each}
  </ul>
{:else}
  <p>There are no listed gigs at this location.</p>
{/if}
{#if lineupPeople.length > 0}
  <h2>People Who've Played Here</h2>
  <table>
    <tbody
      >{#each lineupPeople as [count, people]}
        <tr>
          <td>
            {count}&nbsp;{`time${count !== 1 ? "s" : ""}`}
          </td>
          <td>
            {#each people as person, i}
              <a href="/members/users/{person.id}" class:highlight="{person.id === session.userId}"
                >{person.first}&nbsp;{person.last}</a
              >{#if i < people.length - 1}{`, `}{/if}
            {/each}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
{#if contacts.length > 0}
  <h2>People Who've Called Here</h2>
  <table>
    <tbody
      >{#each contacts as [count, contacts_]}
        <tr>
          <td>
            {count}
            {`time${count !== 1 ? "s" : ""}`}
          </td>
          <td>
            {#each contacts_ as contact, i}
              <a href="/members/gigs/contacts/{contact.id}">{contact.name}</a>{#if i < contacts_.length - 1}{`, `}{/if}
            {/each}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
