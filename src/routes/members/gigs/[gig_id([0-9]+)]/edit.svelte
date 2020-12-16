<script context="module">
  import {
    QueryEditGigDetails,
    QueryVenues,
    QueryGigTypes,
    UpdateGig,
    QueryContacts,
    UpsertGigContact,
    RemoveGigContact,
  } from "../../../../graphql/gigs";
  import { notLoggedIn } from "../../../../client-auth";
  import { makeClient, handleErrors } from "../../../../graphql/client";

  function sortVenues(venues) {
    venues.sort((a, b) => {
      a = { name: a.name && a.name.toLowerCase(), subvenue: a.subvenue && a.subvenue.toLowerCase() };
      b = { name: b.name && a.name.toLowerCase(), subvenue: b.subvenue && b.subvenue.toLowerCase() };
      a.name < b.name ? -1 : a.name > b.name ? 1 : a.subvenue < b.subvenue ? -1 : a.subvenue > b.subvenue ? 1 : 0;
    });
  }

  function sortContacts(contacts) {
    contacts.sort((a, b) => {
      a = a.contact ? a.contact : a;
      b = b.contact ? b.contact : b;
      a = { name: a.name && a.name.toLowerCase(), organization: a.organization && a.organization.toLowerCase() };
      b = { name: b.name && b.name.toLowerCase(), organization: b.organization && b.organization.toLowerCase() };
      return a.name < b.name
        ? -1
        : b.name < a.name
        ? 1
        : a.organization < b.organization
        ? -1
        : b.organization < a.organization
        ? 1
        : 0;
    });
  }

  export async function preload({ params }, session) {
    let { gig_id } = params;

    if (notLoggedIn.bind(this)(session)) return;

    let client = makeClient(this.fetch);

    let res_gig, res_venues, res_gigTypes, res_contacts;
    let gig, venues, gigTypes, allContacts;
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
      res_contacts = await client.query({
        query: QueryContacts,
      });
    } catch (e) {
      await handleErrors.bind(this)(e, session);
      return;
    }

    if (res_gig && res_gig.data && res_gig.data.cucb_gigs_by_pk) {
      gig = res_gig.data.cucb_gigs_by_pk;
      venues = res_venues.data.cucb_gig_venues;
      gigTypes = res_gigTypes.data.cucb_gig_types;
      allContacts = res_contacts.data.cucb_contacts;
      sortVenues(venues);
      sortContacts(gig.contacts);
    } else {
      this.error(404, "Gig not found");
      return;
    }

    return {
      ...gig,
      lastSaved: gig,
      venues,
      gigTypes,
      allContacts,
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
    id,
    admins_only,
    advertise,
    allow_signups,
    food_provided,
    notes_admin,
    notes_band,
    summary,
    contacts,
    allContacts;
  import { makeTitle, themeName } from "../../../../view";
  import moment from "moment";
  import Select from "../../../../components/Forms/Select.svelte";
  import VenueEditor from "../../../../components/Gigs/VenueEditor.svelte";
  import ContactEditor from "../../../../components/Gigs/ContactEditor.svelte";
  import Fuse from "fuse.js";
  import { client as graphqlClient } from "../../../../graphql/client";
  import { tick } from "svelte";
  import { tweened } from "svelte/motion"; // TODO move the messages to their own component
  import { fade } from "svelte/transition";

  let venueSearch = "";
  let displayVenueEditor = false;
  let displayContactEditor = false;
  let editingSubvenue = false;
  let recentlySavedOpacity = tweened(0, { duration: 150 });
  let recentlySavedTimer = () => recentlySavedOpacity.set(0);
  let searchedVenuesList,
    searchVenuesField,
    venueListElement,
    clientListElement,
    callerListElement,
    selectedClient,
    selectedCaller,
    contactToEdit,
    editContactType;
  $: clients = contacts.filter(contact => contact.client);
  $: callers = contacts.filter(contact => contact.calling);

  $: saved =
    lastSaved.type_id === type_id &&
    lastSaved.title === title.trim() &&
    lastSaved.date === date &&
    lastSaved.venue_id === venue_id &&
    lastSaved.summary === (summary && summary.trim()) &&
    lastSaved.notes_admin === (notes_admin && notes_admin.trim()) &&
    lastSaved.notes_band === (notes_band && notes_band.trim());

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
    editingSubvenue = Object.keys(venue).length === 1; // Only name set for this
    lastSaved.venue = { ...lastSaved.venue };
    displayVenueEditor = true;
    venueSearch = "";
  }

  function contactDisplayName(contact) {
    return contact.name
      ? contact.organization
        ? `${contact.name} @ ${contact.organization}`
        : contact.name
      : contact.organization;
  }

  async function updateVenue(_) {
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

  async function cancelEditVenue(_) {
    venue = lastSaved.venue;
    displayVenueEditor = false;
    await tick();
    venueListElement.focus();
  }

  async function saveGig(_) {
    try {
      let res = await $graphqlClient.mutate({
        mutation: UpdateGig,
        variables: {
          id,
          title: title.trim(),
          date,
          venue_id,
          type_id,
          advertise,
          admins_only,
          allow_signups,
          food_provided,
          notes_admin: notes_admin && notes_admin.trim(),
          notes_band: notes_band && notes_band.trim(),
          summary: summary && summary.trim(),
        },
      });
      if (res && res.data && res.data.update_cucb_gigs_by_pk) {
        window.clearTimeout(recentlySavedTimer);
        recentlySavedOpacity.set(0, { duration: 50 });
        window.setTimeout(recentlySavedTimer, 2000);
        recentlySavedOpacity.set(1);
        lastSaved = { ...res.data.update_cucb_gigs_by_pk };
      }
    } catch (e) {
      // Oh shit
      // TODO handle this better
      console.error(e);
    }
  }

  function keyboardShortcuts(e) {
    if (e.altKey && e.which === 83) {
      e.preventDefault();
      saveGig(e);
    }
  }

  const contactTypes = {
    CALLER: {},
    CLIENT: {},
  };

  async function selectContact(contactType, _) {
    let contact_id, existingContact;
    let is_client, is_calling;
    if (contactType === contactTypes.CLIENT) {
      contact_id = selectedClient;
      existingContact = contacts.find(contact => contact.id === contact_id);
      is_client = true;
      is_calling = (existingContact || false) && existingContact.calling;
    } else {
      contact_id = selectedCaller;
      existingContact = contacts.find(contact => contact.id === contact_id);
      is_calling = true;
      is_client = (existingContact || false) && existingContact.client;
    }
    try {
      let res = await $graphqlClient.mutate({
        mutation: UpsertGigContact,
        variables: {
          gig_id: id,
          contact_id,
          client: is_client,
          calling: is_calling,
        },
      });
      if (res && res.data && res.data.insert_cucb_gigs_contacts_one) {
        if (existingContact) {
          existingContact.client = res.data.insert_cucb_gigs_contacts_one.client;
          existingContact.calling = res.data.insert_cucb_gigs_contacts_one.calling;
          contacts = contacts;
        } else {
          let contactsClone = [...contacts, { ...res.data.insert_cucb_gigs_contacts_one, id: contact_id }];
          sortContacts(contactsClone);
          contacts = contactsClone;
        }
        contactType === contactTypes.CLIENT ? (selectedClient = undefined) : (selectedCaller = undefined);
      }
    } catch (e) {
      // TODO error handling
      console.error(e);
    }
  }

  let selectClient = e => selectContact(contactTypes.CLIENT, e);
  let selectCaller = e => selectContact(contactTypes.CALLER, e);

  async function removeContact(contactType, contact_id, _) {
    let existingContact = contacts.find(contact => contact.id === contact_id);
    if (existingContact.client && existingContact.calling) {
      let client, calling;
      // Only removing a role, so update the existing entry
      if (contactType === contactTypes.CLIENT) {
        client = false;
        calling = true;
      } else {
        client = true;
        calling = false;
      }
      try {
        let res = await $graphqlClient.mutate({
          mutation: UpsertGigContact,
          variables: {
            gig_id: id,
            contact_id,
            client,
            calling,
          },
        });
        if (res && res.data && res.data.insert_cucb_gigs_contacts_one) {
          existingContact.client = res.data.insert_cucb_gigs_contacts_one.client;
          existingContact.calling = res.data.insert_cucb_gigs_contacts_one.calling;
          contacts = contacts;
        }
      } catch (e) {
        // TODO error handling
        console.error(e);
      }
    } else {
      try {
        await $graphqlClient.mutate({
          mutation: RemoveGigContact,
          variables: {
            gig_id: id,
            contact_id,
          },
        });
        contacts = contacts.filter(contact => contact.id !== contact_id);
      } catch (e) {
        // TODO real error handling
        console.error(e);
      }
    }
  }

  let removeClient = id => e => removeContact(contactTypes.CLIENT, id, e);
  let removeCaller = id => e => removeContact(contactTypes.CALLER, id, e);

  function editContact(contact_id, contactType) {
    return _ => {
      editContactType = contactType;
      contactToEdit = { ...contacts.find(contact => contact.id === contact_id).contact, id: contact_id };
      displayContactEditor = true;
    };
  }

  async function updateContact(e) {
    let updatedContact = e.detail.contact;
    let currentContact = allContacts.find(contact => contact.id === updatedContact.id);
    if (currentContact) {
      currentContact.name = updatedContact.name;
      currentContact.email = updatedContact.email;
      currentContact.organization = updatedContact.organization;
      currentContact.notes = updatedContact.notes;
      currentContact.caller = updatedContact.caller;
      let gigContact = contacts.find(contact => contact.id === updatedContact.id);
      gigContact.contact = { ...updatedContact };
      sortContacts(allContacts);
      sortContacts(contacts);
      contacts = contacts;
      displayContactEditor = false;
    } else {
      allContacts.push(updatedContact);
      sortContacts(allContacts);
      displayContactEditor = false;
      await tick();
      if (editContactType === contactTypes.CLIENT) {
        selectedClient = updatedContact.id;
        clientListElement.focus();
      } else {
        selectedCaller = updatedContact.id;
        callerListElement.focus();
      }
    }
  }

  async function cancelEditContact(_) {
    displayContactEditor = false;
  }

  async function newClient(_) {
    editContactType = contactTypes.CLIENT;
    contactToEdit = { caller: false };
    displayContactEditor = true;
  }

  async function newCaller(_) {
    editContactType = contactTypes.CALLER;
    contactToEdit = { caller: true };
    displayContactEditor = true;
  }

  // TODO edit selected caller/client??
  // TODO search for clients/callers

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

  form:not(.contacts) * {
    width: 100%;
    box-sizing: border-box;
  }
  form.contacts > * {
    width: 100%;
  }

  button {
    width: unset;
  }

  .temporary-message {
    position: fixed;
    display: flex;
    justify-content: center;
    top: 3em;
    padding: 0.25em 0.5em;
    background: var(--background);
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    border-radius: 5px;
    font-size: 1.2rem;
    width: 150px;
    box-shadow: 0 0 4px var(--form_color);
  }

  .gig-contact {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding-left: 0.25em;
  }

  .gig-contact:nth-child(2n) {
    background: rgba(var(--accent_triple), 0.1);
  }

  .button-group {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
  }

  .button-group button {
    width: unset;
    margin: 0.25em 0.25em;
  }

  hr {
    margin: 1em 0;
  }
</style>

<svelte:head>
  <title>{makeTitle(`Edit gig: ${title.trim()}`)}</title>
</svelte:head>

<svelte:window on:beforeunload="{unloadIfSaved}" on:keydown="{keyboardShortcuts}" />

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
{#if $recentlySavedOpacity}
  <div class="temporary-message heading-font" style="opacity:{$recentlySavedOpacity}">Saved</div>
{/if}
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

    <div class="button-group">
      <button on:click="{newVenue}" data-test="gig-edit-{id}-create-venue">Create new venue</button>
      &nbsp;
      <button on:click="{newSubvenue}">Create new subvenue</button>
      &nbsp;
      <button on:click="{editVenue}">Edit this venue</button>
    </div>
  {:else}
    <VenueEditor on:saved="{updateVenue}" on:cancel="{cancelEditVenue}" {...venue} nameEditable="{!editingSubvenue}" />
  {/if}
</form>
<hr />
<h3>Client/caller details</h3>
{#if !displayContactEditor}
  <h4>Clients</h4>
  <form on:submit|preventDefault class="theme-{$themeName} contacts" data-test="client-form">
    <div data-test="gig-edit-{id}-client-list">
      {#each clients as contact (contact.id)}
        <div class="gig-contact" transition:fade|local>
          <span data-test="contact-name">{contactDisplayName(contact.contact)}</span>
          <div class="button-group">
            <button
              on:click="{editContact(contact.id, contactTypes.CLIENT)}"
              data-test="gig-edit-{id}-clients-{contact.id}-edit"
            >Edit</button>
            <button
              on:click="{removeClient(contact.id)}"
              data-test="gig-edit-{id}-clients-{contact.id}-remove"
            >Remove</button>
          </div>
        </div>
      {/each}
    </div>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label data-test="gig-edit-{id}-client-select">Add client
      <Select bind:value="{selectedClient}" bind:select="{clientListElement}">
        <option selected="selected" disabled value="{undefined}">--- SELECT A CLIENT ---</option>
        {#each allContacts as contact}
          <!-- TODO don't show selected clients in this list -->
          <option value="{contact.id}">{contactDisplayName(contact)}</option>
        {/each}
      </Select></label>
    <div class="button-group">
      <button on:click="{selectClient}" data-test="gig-edit-{id}-client-select-confirm">Select client</button>
      <button on:click="{newClient}" data-test="gig-edit-{id}-client-new">Create new client</button>
    </div>
  </form>
  <h4>Callers</h4>
  <form on:submit|preventDefault class="theme-{$themeName} contacts" data-test="caller-form">
    <div data-test="gig-edit-{id}-caller-list">
      {#each callers as contact (contact.id)}
        <div class="gig-contact" transition:fade|local>
          <span data-test="contact-name">{contactDisplayName(contact.contact)}</span>
          <div class="button-group">
            <button
              on:click="{editContact(contact.id, contactTypes.CALLER)}"
              data-test="gig-edit-{id}-callers-{contact.id}-edit"
            >Edit</button>
            <button
              on:click="{removeCaller(contact.id)}"
              data-test="gig-edit-{id}-callers-{contact.id}-remove"
            >Remove</button>
          </div>
        </div>
      {/each}
    </div>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label data-test="gig-edit-{id}-caller-select">Add caller
      <Select bind:value="{selectedCaller}" bind:select="{callerListElement}">
        <option selected="selected" disabled value="{undefined}">--- SELECT A CALLER ---</option>
        {#each allContacts.filter(contact => contact.caller) as contact}
          <!-- TODO don't show selected clients in this list -->
          <option value="{contact.id}">{contactDisplayName(contact)}</option>
        {/each}
      </Select>
    </label>
    <div class="button-group">
      <button on:click|preventDefault="{selectCaller}" data-test="gig-edit-{id}-caller-select-confirm">Select caller</button>
      <button on:click|preventDefault="{newCaller}" data-test="gig-edit-{id}-caller-new">Create new caller</button>
    </div>
  </form>
{:else}
  <form on:submit|preventDefault class="theme-{$themeName} contacts">
    <ContactEditor {...contactToEdit} on:saved="{updateContact}" on:cancel="{cancelEditContact}" />
  </form>
{/if}
<hr />
<h3>Notes</h3>
<form on:submit|preventDefault class="theme-{$themeName}">
  <label>{#if advertise}Public advert{:else}Summary{/if}<textarea
      bind:value="{summary}"
      rows="7"
      data-test="gig-edit-{id}-summary"
    ></textarea></label>
  <label>Band notes<textarea bind:value="{notes_band}" rows="7" data-test="gig-edit-{id}-notes-band"></textarea></label>
  <label>Admin notes<textarea
      bind:value="{notes_admin}"
      rows="7"
      data-test="gig-edit-{id}-notes-admin"
    ></textarea></label>
</form>

<button on:click="{saveGig}" data-test="gig-edit-{id}-save">Save changes</button>
