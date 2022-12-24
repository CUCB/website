<script lang="ts">
  import type { PageData } from "./$types";
  export let data: PageData;
  let {
    title,
    date,
    time,
    posting_time,
    posting_user,
    editing_time,
    editing_user,
    lastSaved,
    venues,
    venue: venue_id,
    type: type_id,
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
    quote_date,
    session,
  } = data;
  import { makeTitle, themeName, createValidityChecker } from "../../../../../view";
  import Select from "../../../../../components/Forms/Select.svelte";
  import VenueEditor from "../../../../../components/Gigs/VenueEditor.svelte";
  import ContactEditor from "../../../../../components/Gigs/ContactEditor.svelte";
  import Summary from "../../../../../components/Gigs/Summary.svelte";
  import Fuse from "fuse.js";
  import { tick } from "svelte";
  import { tweened } from "svelte/motion"; // TODO move the messages to their own component (#34)
  import { fade } from "svelte/transition";
  import SearchBox from "../../../../../components/SearchBox.svelte";
  import { DateTime, Settings } from "luxon";
  import { sortContacts, sortVenues } from "./sort";
  Settings.defaultZoneName = "Europe/London"; // https://moment.github.io/luxon/docs/manual/zones#changing-the-default-zone

  let checkValid = createValidityChecker();

  let venue;
  let displayVenueEditor = false;
  let displayContactEditor = false;
  let editingSubvenue = false;
  let recentlySavedOpacity = tweened(0, { duration: 150 });
  let recentlySavedTimer = () => recentlySavedOpacity.set(0);
  let runningTimer = null;
  let venueListElement,
    clientListElement,
    callerListElement,
    selectedClient,
    selectedCaller,
    contactToEdit,
    editContactType,
    clearVenueSearch;
  let previewSummary = false;
  time = time && DateTime.fromISO(`1970-01-01T${time}`).toFormat("HH:mm"); // Remove seconds from time if they are present
  let arrive_time_date = (arrive_time && DateTime.fromISO(arrive_time).toFormat("yyyy-LL-dd")) || null;
  let arrive_time_time = (arrive_time && DateTime.fromISO(arrive_time).toFormat("HH:mm")) || null;
  let finish_time_date = (finish_time && DateTime.fromISO(finish_time).toFormat("yyyy-LL-dd")) || null;
  let finish_time_time = (finish_time && DateTime.fromISO(finish_time).toFormat("HH:mm")) || null;
  let fields = {
    finish_time_date: null as HTMLImageElement | null,
    finish_time_time: null as HTMLImageElement | null,
    arrive_time_time: null as HTMLImageElement | null,
    arrive_time_date: null as HTMLImageElement | null,
    quote_date: null as HTMLInputElement | null,
    time: null as HTMLInputElement | null,
    end_date: null as HTMLInputElement | null,
    start_date: null as HTMLInputElement | null,
  };
  $: timingWarnings = [
    arrive_time &&
      date &&
      time &&
      DateTime.fromISO(arrive_time) <= DateTime.fromISO(`${date}T${time}`).minus({ hours: 3 }) &&
      "Arrive time is 3 hours or more before the start time. Have you accidentally put a time in the morning rather than the evening?",
    arrive_time &&
      finish_time &&
      DateTime.fromISO(arrive_time) < DateTime.fromISO(finish_time).minus({ hours: 6 }) &&
      "Gig is longer than 6 hours. Have you accidentally put a time in the morning rather than the evening?",
    arrive_time &&
      arrive_time_time === time &&
      DateTime.fromISO(date).equals(DateTime.fromISO(arrive_time_date)) &&
      "Arrive time is the same as start time.",
  ].filter((x) => x);

  $: arrive_time =
    (arrive_time_time && arrive_time_date && DateTime.fromISO(`${arrive_time_date}T${arrive_time_time}`).toISO()) ||
    null;
  $: finish_time =
    (finish_time_time && finish_time_date && DateTime.fromISO(`${finish_time_date}T${finish_time_time}`).toISO()) ||
    null;
  $: clients = contacts.filter((contact) => contact.client);
  $: callers = contacts.filter((contact) => contact.calling);
  $: clientSet = new Set(clients.map((c) => c.contact.id));
  $: callerSet = new Set(callers.map((c) => c.contact.id));
  $: potentialClients = allContacts.filter((contact) => !clientSet.has(contact.id));
  $: potentialCallers = allContacts.filter((contact) => contact.caller && !callerSet.has(contact.id));

  $: saved =
    lastSaved.type === type_id &&
    lastSaved.title === title.trim() &&
    lastSaved.date === ((typeCode !== "calendar" && date) || null) &&
    lastSaved.venue === venue_id &&
    (lastSaved.summary ?? "") === (summary ?? ("" && summary.trim())) &&
    lastSaved.notes_admin === (notes_admin && notes_admin.trim()) &&
    lastSaved.notes_band === (notes_band && notes_band.trim()) &&
    ((!lastSaved.arrive_time && !arrive_time) ||
      DateTime.fromISO(lastSaved.arrive_time).equals(DateTime.fromISO(arrive_time))) &&
    ((!lastSaved.finish_time && !finish_time) ||
      DateTime.fromISO(lastSaved.finish_time).equals(DateTime.fromISO(finish_time))) &&
    ((!lastSaved.time && !time) ||
      DateTime.fromISO(`1970-01-01T${lastSaved.time}`).equals(DateTime.fromISO(`1970-01-01T${time}`))) &&
    lastSaved.admins_only === admins_only &&
    lastSaved.advertise === advertise &&
    lastSaved.allow_signups === allow_signups &&
    lastSaved.food_provided === food_provided &&
    ((!lastSaved.quote_date && !quote_date) ||
      DateTime.fromISO(lastSaved.quote_date).hasSame(DateTime.fromISO(quote_date), "day")) &&
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
    date: (typeCode !== "calendar" && date && DateTime.fromISO(date).toJSDate()) || null,
    venue_id,
    type_id,
    type: gigTypes.find((type) => type_id === type.id),
    advertise,
    admins_only,
    allow_signups: typeCode !== "calendar" && allow_signups,
    food_provided: typeCode !== "calendar" && food_provided,
    notes_admin: notes_admin && notes_admin.trim(),
    notes_band: notes_band && notes_band.trim(),
    summary: summary && summary.trim(),
    arrive_time:
      typeCode === "calendar"
        ? DateTime.fromISO(arrive_time_date).toJSDate()
        : DateTime.fromISO(arrive_time).toJSDate(),
    finish_time:
      typeCode === "calendar"
        ? DateTime.fromISO(finish_time_date).toJSDate()
        : DateTime.fromISO(finish_time).toJSDate(),
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

  function unloadIfSaved(e) {
    if (saved || "Cypress" in window) {
      delete e["returnValue"];
    } else {
      e.preventDefault();
      e.returnValue = "";
    }
  }

  function selectVenueSearch(e) {
    venue_id = e.detail.id;
    venueListElement.focus();
  }

  function selectClientSearch(e) {
    selectedClient = e.detail.id;
    clientListElement.focus();
  }

  function selectCallerSearch(e) {
    selectedCaller = e.detail.id;
    callerListElement.focus();
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
    // A subvenue only has a name set, so one key
    editingSubvenue = venue && Object.keys(venue).length === 1;
    clearVenueSearch();
    displayVenueEditor = true;
  }

  function contactDisplayName(contact) {
    return contact.name
      ? contact.organization
        ? `${contact.name} @ ${contact.organization}`
        : contact.name
      : contact.organization;
  }

  function venueDisplayName(venue) {
    return venue.subvenue ? `${venue.name} | ${venue.subvenue}` : venue.name;
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
    await tick();
    venueListElement.focus();
  }

  async function cancelEditVenue() {
    venue = venues.find((venue) => venue.id === venue_id);
    displayVenueEditor = false;
    await tick();
    await tick();
    venueListElement.focus();
  }

  async function saveGig(_e) {
    for (let field of Object.values(fields).filter((x) => x)) {
      field.dispatchEvent(new Event("change"));
      if (field.checkValidity && !field.checkValidity()) {
        field.reportValidity();
        return;
      }
    }
    try {
      const body = {
        id,
        title: title.trim(),
        date: (typeCode !== "calendar" && date) || null,
        venue_id,
        type_id,
        advertise,
        admins_only,
        allow_signups: typeCode !== "calendar" && allow_signups,
        food_provided: typeCode !== "calendar" && food_provided,
        notes_admin: notes_admin && notes_admin.trim(),
        notes_band: notes_band && notes_band.trim(),
        summary: summary && summary.trim(),
        arrive_time: typeCode === "calendar" ? DateTime.fromISO(arrive_time_date) : arrive_time,
        finish_time: typeCode === "calendar" ? DateTime.fromISO(finish_time_date) : finish_time,
        time: time || null,
        quote_date,
        finance: finance && finance.trim(),
        finance_deposit_received,
        finance_payment_received,
        finance_caller_paid,
      };
      let res = await fetch("", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }).then((r) => r.json());
      if (res) {
        window.clearTimeout(runningTimer);
        recentlySavedOpacity.set(0, { duration: 50 });
        runningTimer = window.setTimeout(recentlySavedTimer, 2000);
        recentlySavedOpacity.set(1);
        lastSaved = { ...res };
      }
      editing_user = { id: session.userId, first: session.firstName, last: session.lastName };
      editing_time = DateTime.local().toISO();
    } catch (e) {
      // Oh shit
      // TODO handle this better (#43)
      console.error(e);
    }
  }

  function keyboardShortcuts(e) {
    // Alt + S
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
      existingContact = contacts.find((contact) => (contact.id || contact.contact.id) === contact_id);
      is_client = true;
      is_calling = (existingContact || false) && existingContact.calling;
    } else {
      contact_id = selectedCaller;
      existingContact = contacts.find((contact) => (contact.id || contact.contact.id) === contact_id);
      is_calling = true;
      is_client = (existingContact || false) && existingContact.client;
    }
    try {
      const body = {
        contact: contact_id.toString(),
        client: is_client,
        calling: is_calling,
      };
      const res = await fetch("contacts", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }).then((r) => r.json());
      if (res) {
        if (existingContact) {
          existingContact.client = res.client;
          existingContact.calling = res.calling;
          contacts = contacts;
        } else {
          let contactsClone = [...contacts, res];
          sortContacts(contactsClone);
          contacts = contactsClone;
        }
        contactType === contactTypes.CLIENT ? (selectedClient = undefined) : (selectedCaller = undefined);
      }
    } catch (e) {
      // TODO error handling (#43)
      console.error(e);
    }
  }

  let selectClient = (e) => selectContact(contactTypes.CLIENT, e);
  let selectCaller = (e) => selectContact(contactTypes.CALLER, e);

  async function removeContact(contactType, contact_id, _) {
    let existingContact = contacts.find((contact) => (contact.id || contact.contact.id) === contact_id);
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
        const body = {
          contact: contact_id.toString(),
          client,
          calling,
        };
        const res = await fetch("contacts", {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        }).then((r) => r.json());
        if (res) {
          existingContact.client = res.client;
          existingContact.calling = res.calling;
          contacts = contacts;
        }
      } catch (e) {
        // TODO error handling (#43)
        console.error(e);
      }
    } else {
      try {
        const res = await fetch("contacts", {
          method: "DELETE",
          body: JSON.stringify({ contact: contact_id }),
          headers: { "Content-Type": "application/json" },
        });
        // TODO error handle status codes
        contacts = contacts.filter((contact) => contact.contact.id !== contact_id);
      } catch (e) {
        // TODO real error handling (#43)
        console.error(e);
      }
    }
  }

  let removeClient = (id) => (e) => removeContact(contactTypes.CLIENT, id, e);
  let removeCaller = (id) => (e) => removeContact(contactTypes.CALLER, id, e);

  function editContact(contact_id, contactType) {
    return (_) => {
      editContactType = contactType;
      contactToEdit = { ...contacts.find((contact) => contact.contact.id === contact_id).contact, id: contact_id };
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
      let gigContact = contacts.find((contact) => contact.contact.id === updatedContact.id);
      gigContact.contact = { ...updatedContact };
      sortContacts(allContacts);
      allContacts = allContacts;
      sortContacts(contacts);
      contacts = contacts;
      displayContactEditor = false;
    } else {
      allContacts.push(updatedContact);
      sortContacts(allContacts);
      allContacts = allContacts;
      displayContactEditor = false;
      while (!(callerListElement && clientListElement)) await tick();
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
    if (!time || DateTime.fromISO(`1970-01-01T${arrive_time_time}`) <= DateTime.fromISO(`1970-01-01T${time}`)) {
      arrive_time_date = date;
    } else {
      arrive_time_date = DateTime.fromISO(date).minus({ days: 1 }).toFormat("yyyy-LL-dd");
    }
    await tick();
    fields.arrive_time_date.dispatchEvent(new Event("change"));
    fields.arrive_time_time.dispatchEvent(new Event("change"));
  }

  async function fillFinishDate(e) {
    if (finish_time_date && !e.force) return;
    if (!finish_time_time) return;
    if (!time || DateTime.fromISO(`1970-01-01T${finish_time_time}`) >= DateTime.fromISO(`1970-01-01T${time}`)) {
      finish_time_date = date;
    } else {
      finish_time_date = DateTime.fromISO(date).plus({ days: 1 }).toFormat("yyyy-LL-dd");
    }
    await tick();
    fields.finish_time_date.dispatchEvent(new Event("change"));
    fields.finish_time_time.dispatchEvent(new Event("change"));
  }

  $: venueFuse = new Fuse(venues, {
    ignoreLocation: true,
    threshold: 0.35,
    keys: ["name", "subvenue", "notes_admin", "notes_band", "address", "postcode"],
  });
  $: clientFuse = new Fuse(potentialClients, {
    ignoreLocation: false,
    threshold: 0.35,
    keys: ["name", "organization", "email"],
  });
  $: callerFuse = new Fuse(potentialCallers, {
    ignoreLocation: false,
    threshold: 0.35,
    keys: ["name", "organization", "email"],
  });
</script>

<style lang="scss">
  @import "../../../../../sass/themes.scss";

  h3 {
    font-size: 1.3em;
  }
  label {
    font-size: 0.9rem;
    padding: 0;
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

  .warnings {
    padding: 0;
    * {
      margin: 0.5em 0;
      box-sizing: border-box;
      @include themeify($themes) {
        background: themed("warningBackground");
        color: themed("warningColor");
        border: 1px solid themed("warningBorderColor");
      }
      list-style-type: none;
      padding: 0.15em 0.25em;
    }
  }

  label.checkbox {
    display: block;

    input {
      width: auto;
    }
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
  <button class="gig-preview" on:click="{() => (previewSummary = false)}" data-test="gig-edit-{id}-hide-preview"
    >Hide gig preview</button
  >
  <Summary gig="{summaryGig}" displayLinks="{false}" session="{session}" />
  <!-- TODO show public advert when that's implemented (#35) -->
{:else}
  <button class="gig-preview" on:click="{() => (previewSummary = true)}" data-test="gig-edit-{id}-show-preview"
    >Show gig preview</button
  >
{/if}

<p>
  {#if editing_time}
    This gig was last edited at
    {DateTime.fromISO(editing_time).toFormat("HH:mm dd/LL/yyyy")}
    {#if editing_user}
      &nbsp;by user
      <a href="/members/users/{editing_user.id}">{editing_user.first}&#32;{editing_user.last}</a>
    {/if}.
  {/if}
  {#if posting_time}
    It was created at
    {DateTime.fromISO(posting_time).toFormat("HH:mm dd/LL/yyyy")}
    {#if posting_user}
      &nbsp;by user
      <a href="/members/users/{posting_user.id}">{posting_user.first}&#32;{posting_user.last}</a>
    {/if}.
  {/if}
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
    <label data-test="gig-edit-{id}-type">
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
    {#if typeCode === "calendar"}
      <label>
        Start date
        <input
          type="date"
          bind:this="{fields.start_date}"
          use:checkValid="{{
            validityErrors: { rangeOverflow: 'Start date should be the same as or before the end date.' },
          }}"
          bind:value="{arrive_time_date}"
          data-test="gig-edit-{id}-arrive-time-date"
          max="{finish_time_date}"
        />
      </label>
      <label>
        End date
        <input
          type="date"
          bind:this="{fields.end_date}"
          use:checkValid="{{
            validityErrors: { rangeOverflow: 'End date should be the same as or after the start date.' },
          }}"
          bind:value="{finish_time_date}"
          data-test="gig-edit-{id}-finish-time-date"
          min="{arrive_time_date}"
        />
      </label>
    {:else}
      <label>
        Date
        <input
          type="date"
          bind:value="{date}"
          data-test="gig-edit-{id}-date"
          disabled="{cancelled}"
          required="{!cancelled}"
        />
      </label>
    {/if}
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label data-test="gig-edit-{id}-venue-select">
      Venue
      <Select bind:value="{venue_id}" bind:select="{venueListElement}" disabled="{cancelled}">
        <option selected="{true}" disabled value="{undefined}">--- SELECT A VENUE ---</option>
        {#each venues as venue}
          <option value="{venue.id}">
            {venue.name}
            {#if venue.subvenue}| {venue.subvenue}{/if}
          </option>
        {/each}
      </Select>
    </label>
    <SearchBox
      placeholder="Search venues"
      toId="{(venue) => venue.id}"
      toDisplayName="{venueDisplayName}"
      fuse="{venueFuse}"
      on:select="{selectVenueSearch}"
      bind:clearSearch="{clearVenueSearch}"
      data-test="gig-edit-{id}-venue"
      disabled="{cancelled}"
    />

    <div class="button-group">
      <button on:click="{newVenue}" data-test="gig-edit-{id}-create-venue" disabled="{cancelled}"
        >Create new venue</button
      >
      &nbsp;
      <button on:click="{newSubvenue}" data-test="gig-edit-{id}-create-subvenue" disabled="{cancelled}"
        >Create new subvenue</button
      >
      &nbsp;
      <button on:click="{editVenue}" data-test="gig-edit-{id}-edit-venue" disabled="{cancelled}">Edit this venue</button
      >
    </div>
  {:else}
    <VenueEditor on:saved="{updateVenue}" on:cancel="{cancelEditVenue}" {...venue} nameEditable="{!editingSubvenue}" />
  {/if}
</form>
<hr />
{#if typeCode !== "calendar"}
  <h3>Client/caller details</h3>
  {#if !displayContactEditor}
    <h4>Clients</h4>
    <form on:submit|preventDefault class="theme-{$themeName} contacts" data-test="client-form">
      <div data-test="gig-edit-{id}-client-list">
        {#each clients as contact (contact.contact.id)}
          <div class="gig-contact" transition:fade|local>
            <span data-test="contact-name">{contactDisplayName(contact.contact)}</span>
            <div class="button-group">
              <button
                on:click="{editContact(contact.contact.id, contactTypes.CLIENT)}"
                data-test="gig-edit-{id}-clients-{contact.contact.id}-edit"
                disabled="{cancelled}">Edit</button
              >
              <button
                on:click="{removeClient(contact.contact.id)}"
                data-test="gig-edit-{id}-clients-{contact.contact.id}-remove"
                disabled="{cancelled}">Remove</button
              >
            </div>
          </div>
        {/each}
      </div>
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label data-test="gig-edit-{id}-client-select"
        >Add client
        <Select bind:value="{selectedClient}" bind:select="{clientListElement}" disabled="{cancelled}">
          <option selected="{true}" disabled value="{undefined}">--- SELECT A CLIENT ---</option>
          {#each potentialClients as contact}
            <option value="{contact.id}">{contactDisplayName(contact)}</option>
          {/each}
        </Select></label
      >
      <SearchBox
        placeholder="Search clients"
        fuse="{clientFuse}"
        toId="{(client) => client.id}"
        toDisplayName="{contactDisplayName}"
        on:select="{selectClientSearch}"
        data-test="gig-edit-{id}-client"
        disabled="{cancelled}"
      />
      <div class="button-group">
        <button on:click="{selectClient}" data-test="gig-edit-{id}-client-select-confirm" disabled="{cancelled}"
          >Select client</button
        >
        <button on:click="{newClient}" data-test="gig-edit-{id}-client-new" disabled="{cancelled}"
          >Create new client</button
        >
      </div>
    </form>
    {#if typeCode !== "kit"}
      <h4>Callers</h4>
      <form on:submit|preventDefault class="theme-{$themeName} contacts" data-test="caller-form">
        <div data-test="gig-edit-{id}-caller-list">
          {#each callers as contact (contact.contact.id)}
            <div class="gig-contact" transition:fade|local>
              <span data-test="contact-name">{contactDisplayName(contact.contact)}</span>
              <div class="button-group">
                <button
                  on:click="{editContact(contact.contact.id, contactTypes.CALLER)}"
                  data-test="gig-edit-{id}-callers-{contact.contact.id}-edit"
                  disabled="{cancelled}">Edit</button
                >
                <button
                  on:click="{removeCaller(contact.contact.id)}"
                  data-test="gig-edit-{id}-callers-{contact.contact.id}-remove"
                  disabled="{cancelled}">Remove</button
                >
              </div>
            </div>
          {/each}
        </div>
        <!-- svelte-ignore a11y-label-has-associated-control -->
        <label data-test="gig-edit-{id}-caller-select"
          >Add caller
          <Select bind:value="{selectedCaller}" bind:select="{callerListElement}" disabled="{cancelled}">
            <option selected="{true}" disabled value="{undefined}">--- SELECT A CALLER ---</option>
            {#each potentialCallers as contact}
              <option value="{contact.id}">{contactDisplayName(contact)}</option>
            {/each}
          </Select>
        </label>
        <SearchBox
          placeholder="Search callers"
          fuse="{callerFuse}"
          toId="{(client) => client.id}"
          toDisplayName="{contactDisplayName}"
          on:select="{selectCallerSearch}"
          data-test="gig-edit-{id}-caller"
          disabled="{cancelled}"
        />
        <div class="button-group">
          <button
            on:click|preventDefault="{selectCaller}"
            data-test="gig-edit-{id}-caller-select-confirm"
            disabled="{cancelled}">Select caller</button
          >
          <button on:click|preventDefault="{newCaller}" data-test="gig-edit-{id}-caller-new" disabled="{cancelled}"
            >Create new caller</button
          >
        </div>
      </form>
    {/if}
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
        use:checkValid="{{
          validityErrors: { rangeOverflow: 'Arrive time should be before start time and finish time' },
          bothPresent: { id: 'arrive_time', error: 'Arrive time needs both date and time' },
        }}"
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
        use:checkValid="{{
          validityErrors: { rangeOverflow: 'Arrive time should be before start time and finish time' },
          bothPresent: { id: 'arrive_time', error: 'Arrive time needs both date and time' },
        }}"
        on:blur="{fillArriveDate}"
        max="{arrive_time_date === date && time
          ? time
          : arrive_time_date === finish_time_date
          ? finish_time_time
          : undefined}"
        data-test="gig-edit-{id}-arrive-time-time"
        disabled="{cancelled}"
      />
    </label>
    <div class="button-group">
      <button on:click="{(e) => fillArriveDate({ ...e, force: true })}" disabled="{cancelled}">Infer arrive date</button
      >
    </div>
    <label
      >Start time
      <input
        type="time"
        step="60"
        bind:value="{time}"
        bind:this="{fields.time}"
        min="{arrive_time_date === date ? arrive_time_time : undefined}"
        max="{finish_time_date === date ? finish_time_time : undefined}"
        use:checkValid="{{
          validityErrors: {
            rangeOverflow: 'Start time should not be before arrive time',
            rangeUnderflow: 'Start time should not be after finish time',
          },
        }}"
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
        use:checkValid="{{
          validityErrors: { rangeUnderflow: 'Finish time should be after start time and arrive time' },
          bothPresent: { id: 'finish_time', error: 'Date and time must be specified' },
        }}"
        data-test="gig-edit-{id}-finish-time-date"
        disabled="{cancelled}"
      />
      <input
        type="time"
        bind:value="{finish_time_time}"
        bind:this="{fields.finish_time_time}"
        use:checkValid="{{
          validityErrors: { rangeUnderflow: 'Finish time should be after start time and arrive time' },
          bothPresent: { id: 'finish_time', error: 'Date and time must be specified' },
        }}"
        min="{finish_time_date === date && time
          ? time
          : finish_time_date === arrive_time_date
          ? arrive_time_time
          : undefined}"
        data-test="gig-edit-{id}-finish-time-time"
        disabled="{cancelled}"
      />
    </label>
    <div class="button-group">
      <button
        on:click="{(e) => fillFinishDate({ ...e, force: true })}"
        disabled="{cancelled}"
        data-test="gig-edit-{id}-infer-finish-date">Infer finish date</button
      >
    </div>
  </form>
  <hr />
{/if}
{#if typeCode !== "kit"}
  <h3>Options</h3>
  <form on:submit|preventDefault class="theme-{$themeName}">
    <label class="checkbox"
      >Admins only:
      <input type="checkbox" bind:checked="{admins_only}" data-test="gig-edit-{id}-admins-only" /><br />
      (Whether to hide from normal users)</label
    >
    {#if typeCode !== "calendar"}
      <label class="checkbox"
        >Advertise publicly:
        <input type="checkbox" bind:checked="{advertise}" data-test="gig-edit-{id}-advertise" /><br />
        (Whether to display on home page)</label
      >
      <label class="checkbox"
        >Allow signups:
        <input type="checkbox" bind:checked="{allow_signups}" data-test="gig-edit-{id}-allow-signups" /><br />
        (Whether to allow users to express an interest in playing)</label
      >
      <label class="checkbox"
        >Food provided:
        <input type="checkbox" bind:checked="{food_provided}" data-test="gig-edit-{id}-food-provided" /><br />
        (Whether food is provided at the gig. Will request dietary requirements when people sign up.)</label
      >
    {/if}
  </form>
  <hr />
{/if}
<h3>Notes</h3>
<form on:submit|preventDefault class="theme-{$themeName}">
  <label
    >{#if advertise}Public advert{:else}Summary{/if}<textarea
      bind:value="{summary}"
      rows="7"
      data-test="gig-edit-{id}-summary"></textarea>
    <p><i>Note:</i> HTML is allowed here, though paragraphing is managed automatically based on new lines.</p>
  </label>
  {#if typeCode !== "kit"}
    <label
      >Band notes<textarea bind:value="{notes_band}" rows="7" data-test="gig-edit-{id}-notes-band"></textarea></label
    >
  {/if}
  <label
    >Admin notes<textarea bind:value="{notes_admin}" rows="7" data-test="gig-edit-{id}-notes-admin"></textarea></label
  >
</form>
{#if typeCode !== "calendar"}
  <hr />
  <h3>Financial details</h3>
  <form on:submit|preventDefault class="theme-{$themeName}">
    <label
      >Quote date<input
        type="date"
        bind:this="{fields.quote_date}"
        use:checkValid="{{ validityErrors: { rangeOverflow: 'Quote date cannot be set to the future.' } }}"
        bind:value="{quote_date}"
        max="{DateTime.local().toFormat('yyyy-LL-dd')}"
      /></label
    >
    <label>Finance notes<textarea bind:value="{finance}" rows="7" data-test="gig-edit-{id}-finance"></textarea></label>
    <label class="checkbox"
      >Deposit received:<input
        type="checkbox"
        bind:checked="{finance_deposit_received}"
        data-test="gig-edit-{id}-finance-deposit"
      /></label
    >
    {#if typeCode !== "gig_enquiry"}
      <label class="checkbox"
        >Payment received:<input
          type="checkbox"
          bind:checked="{finance_payment_received}"
          data-test="gig-edit-{id}-finance-payment"
        /></label
      >
      {#if typeCode !== "kit"}
        <label class="checkbox"
          >Caller paid:<input
            type="checkbox"
            bind:checked="{finance_caller_paid}"
            data-test="gig-edit-{id}-finance-caller"
          /></label
        >
      {/if}
    {/if}
  </form>
{/if}

<div class="button-group"><button on:click="{saveGig}" data-test="gig-edit-{id}-save">Save changes</button></div>
