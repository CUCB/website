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
    return venues.sort(
      (a, b) => (a.name || "").localeCompare(b.name || "") || (a.subvenue || "").localeCompare(b.subvenue || ""),
    );
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
    time,
    posting_time,
    posting_user,
    editing_time,
    editing_user,
    lastSaved,
    venues,
    venue_id,
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
    allContacts,
    arrive_time,
    finish_time,
    finance,
    finance_deposit_received,
    finance_payment_received,
    finance_caller_paid,
    quote_date;
  import { makeTitle, themeName } from "../../../../view";
  import moment from "moment-timezone";
  import Select from "../../../../components/Forms/Select.svelte";
  import VenueEditor from "../../../../components/Gigs/VenueEditor.svelte";
  import ContactEditor from "../../../../components/Gigs/ContactEditor.svelte";
  import Summary from "../../../../components/Gigs/Summary.svelte";
  import Fuse from "fuse.js";
  import { client as graphqlClient } from "../../../../graphql/client";
  import { tick } from "svelte";
  import { tweened } from "svelte/motion"; // TODO move the messages to their own component
  import { fade } from "svelte/transition";
  import { stores } from "@sapper/app";

  const { session } = stores();

  let venue;
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
    editContactType,
    clientSearch,
    callerSearch;
  let previewSummary = false;
  moment.tz.setDefault("Europe/London");
  time = time && moment(`1970-01-01T${time}`).format("HH:mm"); // Remove seconds from time if they are present
  let arrive_time_date = (arrive_time && moment(arrive_time).format("YYYY-MM-DD")) || null;
  let arrive_time_time = (arrive_time && moment(arrive_time).format("HH:mm")) || null;
  let finish_time_date = (finish_time && moment(finish_time).format("YYYY-MM-DD")) || null;
  let finish_time_time = (finish_time && moment(finish_time).format("HH:mm")) || null;
  let fields = {
    arrive_time_date: {},
    arrive_time_time: {},
    finish_time_date: {},
    finish_time_time: {},
  };
  $: timingWarnings = [
    arrive_time &&
      finish_time &&
      moment(arrive_time).isBefore(moment(finish_time).subtract(6, "hours")) &&
      "Gig is longer than 6 hours. Have you accidentally put a time in the morning rather than the evening?",
    arrive_time &&
      arrive_time_time === time &&
      moment(date).isSame(moment(arrive_time_date)) &&
      "Arrive time is the same as start time.",
  ].filter((x) => x);

  $: arrive_time =
    (arrive_time_time && arrive_time_date && moment(`${arrive_time_date}T${arrive_time_time}`).format()) || null;
  $: finish_time =
    (finish_time_time && finish_time_date && moment(`${finish_time_date}T${finish_time_time}`).format()) || null;
  $: clients = contacts.filter((contact) => contact.client);
  $: callers = contacts.filter((contact) => contact.calling);

  $: saved =
    lastSaved.type_id === type_id &&
    lastSaved.title === title.trim() &&
    lastSaved.date === date &&
    lastSaved.venue_id === venue_id &&
    lastSaved.summary === (summary && summary.trim()) &&
    lastSaved.notes_admin === (notes_admin && notes_admin.trim()) &&
    lastSaved.notes_band === (notes_band && notes_band.trim()) &&
    ((!lastSaved.arrive_time && !arrive_time) || moment(lastSaved.arrive_time).isSame(arrive_time)) &&
    ((!lastSaved.finish_time && !finish_time) || moment(lastSaved.finish_time).isSame(finish_time)) &&
    ((!lastSaved.time && !time) || moment(`1970-01-01T${lastSaved.time}`).isSame(moment(`1970-01-01T${time}`))) &&
    lastSaved.admins_only === admins_only &&
    lastSaved.advertise === advertise &&
    lastSaved.allow_signups === allow_signups &&
    lastSaved.food_provided === food_provided &&
    lastSaved.finance == (finance && finance.trim()) &&
    lastSaved.finance_deposit_received == finance_deposit_received &&
    lastSaved.finance_payment_received == finance_payment_received &&
    lastSaved.finance_caller_paid == finance_caller_paid;

  $: typeCode = type_id && gigTypes.find((type) => type_id === type.id).code;
  $: cancelled = typeCode === "gig_cancelled";

  $: venue = venues.find((venue) => venue.id === venue_id);
  $: summaryGig = {
    id,
    title: title.trim(),
    date,
    venue_id,
    type_id,
    type: gigTypes.find((type) => type_id === type.id),
    advertise,
    admins_only,
    allow_signups,
    food_provided,
    notes_admin: notes_admin && notes_admin.trim(),
    notes_band: notes_band && notes_band.trim(),
    summary: summary && summary.trim(),
    arrive_time,
    finish_time,
    time: time || null,
    contacts,
    lineup: [],
    venue,
    finance: finance && finance.trim(),
    finance_deposit_received,
    finance_payment_received,
    finance_caller_paid,
    quote_date,
  };

  let validityFields = {};

  const checkValid = (node, options) => {
    if (options.bothPresent) {
      if (!validityFields[options.bothPresent.id]) {
        validityFields[options.bothPresent.id] = [];
      }
      validityFields[options.bothPresent.id].push(node);
    }
    const changeHandler = (e) => {
      for (let key of Object.keys(options.validityErrors)) {
        if (node.validity[key]) {
          node.setCustomValidity(options.validityErrors[key]);
          return;
        }
      }

      node.setCustomValidity("");

      if (options.bothPresent) {
        let presence = validityFields[options.bothPresent.id].map((field) => field.value.length > 0);
        if (!presence.every((x) => x) && !presence.every((x) => !x)) {
          for (let field of validityFields[options.bothPresent.id]) {
            if (!field.value.length) {
              field.setCustomValidity(options.bothPresent.error);
            }
          }
          return;
        }
        for (let field of validityFields[options.bothPresent.id]) {
          if (field.validationMessage === options.bothPresent.error) {
            field.setCustomValidity("");
            field.dispatchEvent(new Event("change"));
          }
        }
      }
    };

    node.addEventListener("change", changeHandler);

    return {
      destroy() {
        node.removeEventListener("change", changeHandler);
      },
    };
  };

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
    venue = { name: venues.find((venue) => venue.id === venue_id).name };
    editVenue();
  }

  function editVenue() {
    editingSubvenue = venue && Object.keys(venue).length === 1; // Only name set for this
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

  async function updateVenue(e) {
    venue = e.detail.venue;
    venue_id = venue.id;
    venues = [...venues.filter((elem) => elem.id !== venue.id), venue];
    sortVenues(venues);
    venues = venues;
    lastSaved.venue = venue;
    displayVenueEditor = false;
    await tick();
    venueListElement.focus();
  }

  async function cancelEditVenue() {
    displayVenueEditor = false;
    await tick();
    venueListElement.focus();
  }

  async function saveGig() {
    for (let field of Object.values(fields).filter((x) => x)) {
      field.dispatchEvent(new Event("change"));
      if (field.checkValidity && !field.checkValidity()) {
        field.reportValidity();
        return;
      }
    }
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
          arrive_time,
          finish_time,
          time: time || null,
          finance: finance && finance.trim(),
          finance_deposit_received,
          finance_payment_received,
          finance_caller_paid,
        },
      });
      if (res && res.data && res.data.update_cucb_gigs_by_pk) {
        window.clearTimeout(recentlySavedTimer);
        recentlySavedOpacity.set(0, { duration: 50 });
        window.setTimeout(recentlySavedTimer, 2000);
        recentlySavedOpacity.set(1);
        lastSaved = { ...res.data.update_cucb_gigs_by_pk };
        console.log(lastSaved);
      }
      editing_user = { id: $session.userId, first: $session.firstName, last: $session.lastName };
      editing_time = moment().format();
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
      existingContact = contacts.find((contact) => contact.id === contact_id);
      is_client = true;
      is_calling = (existingContact || false) && existingContact.calling;
    } else {
      contact_id = selectedCaller;
      existingContact = contacts.find((contact) => contact.id === contact_id);
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

  let selectClient = (e) => selectContact(contactTypes.CLIENT, e);
  let selectCaller = (e) => selectContact(contactTypes.CALLER, e);

  async function removeContact(contactType, contact_id, _) {
    let existingContact = contacts.find((contact) => contact.id === contact_id);
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
        contacts = contacts.filter((contact) => contact.id !== contact_id);
      } catch (e) {
        // TODO real error handling
        console.error(e);
      }
    }
  }

  let removeClient = (id) => (e) => removeContact(contactTypes.CLIENT, id, e);
  let removeCaller = (id) => (e) => removeContact(contactTypes.CALLER, id, e);

  function editContact(contact_id, contactType) {
    return (_) => {
      editContactType = contactType;
      contactToEdit = { ...contacts.find((contact) => contact.id === contact_id).contact, id: contact_id };
      displayContactEditor = true;
    };
  }

  async function updateContact(e) {
    let updatedContact = e.detail.contact;
    let currentContact = allContacts.find((contact) => contact.id === updatedContact.id);
    if (currentContact) {
      currentContact.name = updatedContact.name;
      currentContact.email = updatedContact.email;
      currentContact.organization = updatedContact.organization;
      currentContact.notes = updatedContact.notes;
      currentContact.caller = updatedContact.caller;
      let gigContact = contacts.find((contact) => contact.id === updatedContact.id);
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

  async function cancelEditContact() {
    displayContactEditor = false;
  }

  async function newClient() {
    editContactType = contactTypes.CLIENT;
    contactToEdit = { caller: false };
    displayContactEditor = true;
  }

  async function newCaller() {
    editContactType = contactTypes.CALLER;
    contactToEdit = { caller: true };
    displayContactEditor = true;
  }

  async function fillArriveDate(e) {
    if (arrive_time_date && !e.force) return;
    if (!arrive_time_time) return;
    // TODO could consider finish_time_time as a fallback for time
    if (!time || moment(`1970-01-01T${arrive_time_time}`).isSameOrBefore(`1970-01-01T${time}`)) {
      arrive_time_date = date;
    } else {
      arrive_time_date = moment(date).subtract(1, "day").format("YYYY-MM-DD");
    }
    await tick();
    fields.arrive_time_date.dispatchEvent(new Event("change"));
    fields.arrive_time_time.dispatchEvent(new Event("change"));
  }

  async function fillFinishDate(e) {
    if (finish_time_date && !e.force) return;
    if (!finish_time_time) return;
    // TODO could consider arrive_time_time as a fallback for time
    if (!time || moment(`1970-01-01T${finish_time_time}`).isSameOrAfter(`1970-01-01T${time}`)) {
      finish_time_date = date;
    } else {
      finish_time_date = moment(date).add(1, "day").format("YYYY-MM-DD");
    }
    await tick();
    fields.finish_time_date.dispatchEvent(new Event("change"));
    fields.finish_time_time.dispatchEvent(new Event("change"));
  }

  // TODO search for clients/callers

  $: venueFuse = new Fuse(venues, {
    ignoreLocation: true,
    threshold: 0.35,
    keys: ["name", "subvenue", "notes_admin", "notes_band", "address", "postcode"],
  });
  $: searchedVenues = venueSearch.length < 3 ? [] : venueFuse.search(venueSearch).map((searchRes) => searchRes.item);
  $: clientFuse = new Fuse(clients, {
    ignoreLocation: true,
    threshold: 0.35,
    keys: ["name", "organization"],
  });
  //   $: searchedClients = clientSearch.length < 3 ? [] : clientFuse.search(clientSearch).map(searchRes => searchRes.item);
  $: callerFuse = new Fuse(callers, {
    ignoreLocation: true,
    threshold: 0.35,
    keys: ["name", "organization"],
  });
  //   $: searchedCallers = callerSearch.length < 3 ? [] : callerFuse.search(callerSearch).map(searchRes => searchRes.item);
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

  *:disabled {
    filter: opacity(0.5);
  }

  .gig-gig_cancelled::before {
    content: "Cancelled: ";
  }

  .gig-gig_enquiry::before {
    content: "Enquiry: ";
  }

  .gig-kit::before {
    content: "Kit hire: ";
  }

  button.gig-preview {
    margin-bottom: 0.75em;
  }
</style>

<svelte:head>
  <title>{makeTitle(`Edit gig: ${title.trim()}`)}</title>
</svelte:head>

<svelte:window on:beforeunload="{unloadIfSaved}" on:keydown="{keyboardShortcuts}" />

<h1>Gig editor</h1>
<h2 class="gig-{typeCode}">
  {title.trim()}
  {#if !saved}&nbsp;(unsaved changes){/if}
</h2>

<a href="/members/gigs/{id}" rel="{!saved ? 'external' : undefined}">View gig summary</a><br /><br />

{#if previewSummary}
  <button class="gig-preview" on:click="{() => (previewSummary = false)}" data-test="gig-edit-{id}-hide-preview">Hide gig preview</button>
  <Summary gig="{summaryGig}" displayLinks="{false}" />
  <!-- TODO show public advert when that's implemented (#35) -->
{:else}<button class="gig-preview" on:click="{() => (previewSummary = true)}" data-test="gig-edit-{id}-show-preview">Show gig preview</button>{/if}

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
    It was created at
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
    <label>
      Title
      <input type="text" bind:value="{title}" data-test="gig-edit-{id}-title" disabled="{cancelled}" />
    </label>
    {#if typeCode === 'calendar'}
      <label>
        Start date
        <input type="date" bind:value="{arrive_time_date}" data-test="gig-edit-{id}-arrive-time-date" />
      </label>
      <label>
        End date
        <input type="date" bind:value="{finish_time_date}" data-test="gig-edit-{id}-finish-time-date" />
      </label>
    {:else}
      <label>
        Date
        <input type="date" bind:value="{date}" data-test="gig-edit-{id}-date" disabled="{cancelled}" />
      </label>
    {/if}
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label data-test="gig-edit-{id}-venue-select">
      Venue
      <Select bind:value="{venue_id}" bind:select="{venueListElement}" disabled="{cancelled}">
        <option selected="selected" disabled value="{undefined}">--- SELECT A VENUE ---</option>
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
      disabled="{cancelled}"
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
      <button on:click="{newVenue}" data-test="gig-edit-{id}-create-venue" disabled="{cancelled}">Create new venue</button>
      &nbsp;
      <button on:click="{newSubvenue}" data-test="gig-edit-{id}-create-subvenue" disabled="{cancelled}">Create new
        subvenue</button>
      &nbsp;
      <button on:click="{editVenue}" data-test="gig-edit-{id}-edit-venue" disabled="{cancelled}">Edit this venue</button>
    </div>
  {:else}
    <VenueEditor on:saved="{updateVenue}" on:cancel="{cancelEditVenue}" {...venue} nameEditable="{!editingSubvenue}" />
  {/if}
</form>
<hr />
{#if typeCode !== 'calendar'}
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
                disabled="{cancelled}"
              >Edit</button>
              <button
                on:click="{removeClient(contact.id)}"
                data-test="gig-edit-{id}-clients-{contact.id}-remove"
                disabled="{cancelled}"
              >Remove</button>
            </div>
          </div>
        {/each}
      </div>
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label data-test="gig-edit-{id}-client-select">Add client
        <Select bind:value="{selectedClient}" bind:select="{clientListElement}" disabled="{cancelled}">
          <option selected="selected" disabled value="{undefined}">--- SELECT A CLIENT ---</option>
          {#each allContacts as contact}
            <!-- TODO don't show selected clients in this list -->
            <option value="{contact.id}">{contactDisplayName(contact)}</option>
          {/each}
        </Select></label>
      <div class="button-group">
        <button on:click="{selectClient}" data-test="gig-edit-{id}-client-select-confirm" disabled="{cancelled}">Select
          client</button>
        <button on:click="{newClient}" data-test="gig-edit-{id}-client-new" disabled="{cancelled}">Create new client</button>
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
                disabled="{cancelled}"
              >Edit</button>
              <button
                on:click="{removeCaller(contact.id)}"
                data-test="gig-edit-{id}-callers-{contact.id}-remove"
                disabled="{cancelled}"
              >Remove</button>
            </div>
          </div>
        {/each}
      </div>
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label data-test="gig-edit-{id}-caller-select">Add caller
        <Select bind:value="{selectedCaller}" bind:select="{callerListElement}" disabled="{cancelled}">
          <option selected="selected" disabled value="{undefined}">--- SELECT A CALLER ---</option>
          {#each allContacts.filter((contact) => contact.caller) as contact}
            <!-- TODO don't show selected clients in this list -->
            <option value="{contact.id}">{contactDisplayName(contact)}</option>
          {/each}
        </Select>
      </label>
      <div class="button-group">
        <button
          on:click|preventDefault="{selectCaller}"
          data-test="gig-edit-{id}-caller-select-confirm"
          disabled="{cancelled}"
        >Select caller</button>
        <button on:click|preventDefault="{newCaller}" data-test="gig-edit-{id}-caller-new" disabled="{cancelled}">Create
          new caller</button>
      </div>
    </form>
  {:else}
    <form on:submit|preventDefault class="theme-{$themeName} contacts">
      <ContactEditor {...contactToEdit} on:saved="{updateContact}" on:cancel="{cancelEditContact}" />
    </form>
  {/if}
  <hr />
  <h3>Timings</h3>
  <form on:submit|preventDefault class="theme-{$themeName}">
    {#if timingWarnings.length > 0}
      Warnings:
      <ul class="warnings" data-test="gig-edit-{id}-timing-warnings">
        {#each timingWarnings as warning}
          <li>{warning}</li>
        {/each}
      </ul>
    {/if}
    <label>
      Arrive time
      <input
        type="date"
        bind:value="{arrive_time_date}"
        bind:this="{fields.arrive_time_date}"
        use:checkValid="{{ validityErrors: { rangeOverflow: 'Arrive time should be before start time and finish time' }, bothPresent: { id: 'arrive_time', error: 'Arrive time needs both date and time' } }}"
        max="{date || finish_time_date}"
        pattern="\d{4}-\d{2}-\d{2}"
        placeholder="YYYY-MM-DD"
        data-test="gig-edit-{id}-arrive-time-date"
        disabled="{cancelled}"
      />
      <input
        type="time"
        bind:value="{arrive_time_time}"
        bind:this="{fields.arrive_time_time}"
        use:checkValid="{{ validityErrors: { rangeOverflow: 'Arrive time should be before start time and finish time' }, bothPresent: { id: 'arrive_time', error: 'Arrive time needs both date and time' } }}"
        on:blur="{fillArriveDate}"
        max="{arrive_time_date === date && time ? time : arrive_time_date === finish_time_date ? finish_time_time : undefined}"
        data-test="gig-edit-{id}-arrive-time-time"
        disabled="{cancelled}"
      />
    </label>
    <div class="button-group">
      <button on:click="{(e) => fillArriveDate({ ...e, force: true })}" disabled="{cancelled}">Infer arrive date</button>
    </div>
    <label>Start time
      <input
        type="time"
        step="60"
        bind:value="{time}"
        bind:this="{fields.time}"
        min="{arrive_time_date === date ? arrive_time_time : undefined}"
        max="{finish_time_date === date ? finish_time_time : undefined}"
        use:checkValid="{{ validityErrors: { rangeOverflow: 'Start time should not be before arrive time', rangeUnderflow: 'Start time should not be after finish time' } }}"
        data-test="gig-edit-{id}-time"
        disabled="{cancelled}"
      />
    </label>
    <label>
      Finish time
      <input
        type="date"
        bind:value="{finish_time_date}"
        bind:this="{fields.finish_time_date}"
        min="{date || arrive_time_date}"
        use:checkValid="{{ validityErrors: { rangeUnderflow: 'Finish time should be after start time and arrive time' }, bothPresent: { id: 'finish_time' } }}"
        data-test="gig-edit-{id}-finish-time-date"
        disabled="{cancelled}"
      />
      <input
        type="time"
        bind:value="{finish_time_time}"
        bind:this="{fields.finish_time_time}"
        use:checkValid="{{ validityErrors: { rangeUnderflow: 'Finish time should be after start time and arrive time' }, bothPresent: { id: 'finish_time' } }}"
        min="{finish_time_date === date && time ? time : finish_time_date === arrive_time_date ? arrive_time_time : undefined}"
        data-test="gig-edit-{id}-finish-time-time"
        disabled="{cancelled}"
      />
    </label>
    <div class="button-group">
      <button on:click="{(e) => fillFinishDate({ ...e, force: true })}" disabled="{cancelled}" data-test="gig-edit-{id}-infer-finish-date">Infer finish date</button>
    </div>
  </form>
  <hr />
{/if}
<h3>Options</h3>
<form on:submit|preventDefault class="theme-{$themeName}">
  <label>Admins only: <input type="checkbox" bind:checked="{admins_only}" /> (Whether to hide from normal users)</label>
  <label>Advertise publicly:
    <input type="checkbox" bind:checked="{advertise}" data-test="gig-edit-{id}-advertise" />
    (Whether to allow users to express an interest in playing)</label>
  <label>Allow signups:
    <input type="checkbox" bind:checked="{allow_signups}" />
    (Whether to allow users to express an interest in playing)</label>
  <label>Food provided:
    <input type="checkbox" bind:checked="{food_provided}" />
    (Whether food is provided at the gig. Will request dietary requirements when people sign up.)</label>
</form>
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
{#if typeCode !== "calendar"}
<hr />
<h3>Financial details</h3>
<form on:submit|preventDefault class="theme-{$themeName}">
  <label>Quote date<input type="date" bind:value="{quote_date}" /></label>
  <label>Finance notes<textarea bind:value="{finance}" rows="7" data-test="gig-edit-{id}-finance"></textarea></label>
  <label>Deposit received:<input
      type="checkbox"
      bind:checked="{finance_deposit_received}"
      data-test="gig-edit-{id}-finance-deposit"
    /></label>
  <label>Payment received:<input
      type="checkbox"
      bind:checked="{finance_payment_received}"
      data-test="gig-edit-{id}-finance-payment"
    /></label>
  <label>Caller paid:<input
      type="checkbox"
      bind:checked="{finance_caller_paid}"
      data-test="gig-edit-{id}-finance-caller"
    /></label>
</form>
{/if}

<div class="button-group"><button on:click="{saveGig}" data-test="gig-edit-{id}-save">Save changes</button></div>
