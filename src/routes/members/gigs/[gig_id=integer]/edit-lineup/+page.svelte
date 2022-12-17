<script lang="ts">
  import Select from "../../../../../components/Forms/Select.svelte";
  import Editor from "../../../../../components/Gigs/Lineup/Editor/Editor.svelte";
  import { setRole } from "../../../../../graphql/gigs/lineups/users/roles";
  import { client } from "../../../../../graphql/client";
  import { Map } from "immutable";
  import Fuse from "fuse.js";
  import SearchBox from "../../../../../components/SearchBox.svelte";
  import { makeTitle, themeName } from "../../../../../view";
  import Lineup from "../../../../../components/Gigs/Lineup.svelte";
  import type { PageData } from "./$types";
  import { extractAttributes } from "../../../../../graphql/gigs/lineups/users/attributes";
  export let data: PageData;
  let { people, gigId, allPeople, title } = data;
  let searchText = "";
  let peopleStore = Map(people);
  let errors = [];
  let selectedUser = undefined;
  let userSelectBox;
  let showPreview = false;

  const addUserUpdater = async ({ gigId, people, errors }, userId) => {
    const body = JSON.stringify({ type: "addUser", id: userId });
    const person = await fetch(`/members/gigs/${gigId}/edit-lineup/update`, { method: "POST", body }).then((res) =>
      res.json(),
    );
    person.user.attributes = extractAttributes(person.user);
    person.user.prefs = undefined;
    return {
      people: people.set(userId, person),
      errors,
    };
  };

  const setInstrumentApproved = async (
    { gigId, userId, people, errors },
    user_instrument_id: string,
    approved: boolean,
  ) => {
    const body = JSON.stringify({ type: "setInstrumentApproved", id: user_instrument_id, approved });
    const instrumentApproved = await fetch(`/members/gigs/${gigId}/edit-lineup/update`, { method: "POST", body }).then(
      (res) => res.json(),
    );
    return {
      people: people.setIn([userId, "user_instruments", user_instrument_id, "approved"], instrumentApproved.approved),
      errors,
    };
  };

  const setPersonApproved = async ({ gigId, people, errors, userId }, approved) => {
    const body = JSON.stringify({ type: "setPersonApproved", id: userId, approved });

    const personApproved = await fetch(`/members/gigs/${gigId}/edit-lineup/update`, { method: "POST", body }).then(
      (res) => res.json(),
    );
    return {
      people: people.setIn([userId, "approved"], personApproved.approved),
      errors,
    };
  };

  const setAdminNotes = async ({ gigId, people, errors, userId }, admin_notes) => {
    const body = JSON.stringify({ type: "setAdminNotes", id: userId, admin_notes });
    const response = await fetch(`/members/gigs/${gigId}/edit-lineup/update`, { method: "POST", body }).then((res) =>
      res.json(),
    );
    return {
      people: people.setIn([userId, "admin_notes"], response.admin_notes),
      errors,
    };
  };

  const destroyLineupInformation = async ({ gigId, people, errors }) => {
    const body = JSON.stringify({ type: "destroyLineupInformation" });
    await fetch(`/members/gigs/${gigId}/edit-lineup/update`, { method: "POST", body });
    return {
      people: Map(),
      errors,
    };
  };

  const addInstrument = async ({ gigId, people, errors, userId }, userInstrumentId) => {
    const body = JSON.stringify({ type: "addInstrument", id: userInstrumentId });
    const instrument = await fetch(`/members/gigs/${gigId}/edit-lineup/update`, { method: "POST", body }).then((res) =>
      res.json(),
    );
    return {
      people: people.updateIn([userId, "user_instruments"], (instruments) => ({
        ...instruments,
        [instrument.user_instrument.id]: instrument,
      })),
      errors,
    };
  };

  const wrap =
    (fn) =>
    (userId) =>
    async (...args) => {
      let res = await fn({ client: $client, people: peopleStore, errors, gigId, userId }, ...args);

      peopleStore = res.people;
      errors = res.errors;
    };

  const addUser = async () => {
    await wrap(addUserUpdater)(null)(selectedUser);
    selectedUser = undefined;
  };

  const selectUser = async (e) => {
    selectedUser = e.detail.id;
    searchText = "";
    userSelectBox.focus();
  };

  let updaters = {
    setInstrumentApproved: wrap(setInstrumentApproved),
    setRole: wrap(setRole),
    setApproved: wrap(setPersonApproved),
    setAdminNotes: wrap(setAdminNotes),
    addInstrument: wrap(addInstrument),
  };
  $: available = Object.fromEntries(
    Object.entries(peopleStore.toObject()).filter(
      ([_, v]) => ((v.user_available && !v.user_only_if_necessary) || v.user_available === null) && v.approved === null,
    ),
  );
  $: if_necessary = Object.fromEntries(
    Object.entries(peopleStore.toObject()).filter(([_, v]) => v.user_only_if_necessary && v.approved === null),
  );
  $: approved = Object.fromEntries(Object.entries(peopleStore.toObject()).filter(([_, v]) => v.approved));
  $: unapproved = Object.fromEntries(Object.entries(peopleStore.toObject()).filter(([_, v]) => v.approved === false));
  $: nope = Object.fromEntries(
    Object.entries(peopleStore.toObject()).filter(([_, v]) => v.approved === null && v.user_available === false),
  );
  $: selectedUserIds = new Set([...peopleStore.keys()].map((i) => parseInt(i)));
  $: unselectedUsers = allPeople
    .filter((user) => !selectedUserIds.has(user.id))
    .map((person) => ({ ...person, fullName: `${person.first} ${person.last}` }));
  $: userFuse = new Fuse(unselectedUsers, {
    threshold: 0.35,
    keys: ["fullName", "last"],
  });
  $: previewPeople = Object.values(approved).map((person) => ({
    ...person,
    user_instruments: Object.values(person.user_instruments)
      .filter((i) => i.approved)
      .map((i) => ({
        ...i,
        user_instrument_id: i.user_instrument.id,
      })),
  }));
  $: lineupWarnings = [
    previewPeople.length > 0 && previewPeople.filter((person) => person.leader).length === 0 && "No leader selected",
    previewPeople.length > 0 && previewPeople.filter((person) => person.equipment).length === 0 && "No techie selected",
    previewPeople.filter((person) => person.leader && person.equipment).length !== 0 && "Someone leading and teching",
    previewPeople.filter((person) => person.money_collector && !person.money_collector_notified).length !== 0 &&
      "Money collector not notified about financial details",
    previewPeople.filter((person) => person.user_available === false).length !== 0 &&
      "Someone unavailable selected in approved lineup",
  ].filter((x) => x);

  const checkDestroyLineup = async () => {
    if (confirm("Are you sure you wish to delete all lineup information?")) {
      await wrap(destroyLineupInformation)(null)();
    }
  };
</script>

<style lang="scss">
  @import "../../../../../sass/themes.scss";
  .add-person {
    display: flex;
    align-items: center;
  }

  .people-search {
    max-width: 100%;
    width: 400px;
  }
  h2 {
    margin-top: 0.5em;
  }
  #add-person-form {
    margin: 1em 0;
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
  button {
    margin: 0.25em;
  }
</style>

<svelte:head>
  <title>{makeTitle(`${title} | Lineup Editor`)}</title>
</svelte:head>

<h1>{title}</h1>
{#if !showPreview}
  <button on:click="{() => (showPreview = true)}">Show preview</button>
{:else}
  <button on:click="{() => (showPreview = false)}">Hide preview</button>
  <Lineup people="{previewPeople}" />
{/if}
{#if Object.entries(approved).length}
  <h2>Approved lineup</h2>
  {#if lineupWarnings.length > 0}
    <div class="theme-{$themeName}">
      Warnings:
      <ul class="warnings" data-test="lineup-warnings">
        {#each lineupWarnings as warning}
          <li>{warning}</li>
        {/each}
      </ul>
    </div>
  {/if}
  <div data-test="lineup-editor-approved">
    <Editor people="{approved}" updaters="{updaters}" />
  </div>
{/if}
<h2>Applicants/maybes</h2>
<div data-test="lineup-editor-applicants">
  {#if Object.entries(available).length}
    <div data-test="signup-yes">
      <Editor people="{available}" updaters="{updaters}" />
    </div>
  {/if}
  <div id="add-person-form" data-test="add-lineup-person">
    <div class="add-person">
      <Select bind:value="{selectedUser}" bind:select="{userSelectBox}" aria-label="User to add">
        <option value="{undefined}" disabled>---PICK ONE---</option>
        {#each unselectedUsers as userToAdd}
          <option value="{userToAdd.id}">{userToAdd.first}&#32;{userToAdd.last}</option>
        {/each}
      </Select>
      <button on:click="{addUser}" data-test="confirm-add-lineup-person">Add user</button>
    </div>
    <div class="people-search">
      <SearchBox
        toId="{(user) => user.id}"
        toDisplayName="{(user) => `${user.first} ${user.last}`}"
        fuse="{userFuse}"
        data-test="people"
        placeholder="Type to search..."
        aria-label="Search user to add"
        on:select="{selectUser}"
        bind:value="{searchText}"
      />
    </div>
  </div>
  {#if Object.entries(if_necessary).length}
    <hr />
    <h3>Only if necessary</h3>
    <div data-test="signup-maybe">
      <Editor people="{if_necessary}" updaters="{updaters}" />
    </div>
  {/if}
</div>
<hr />
<p>
  <b>Warning: Do not use this link unless you really need to!</b>
  <button on:click="{checkDestroyLineup}" data-test="destroy-lineup"
    >Destroy all lineup information and lineup applications</button
  >
</p>
<hr />
{#if Object.entries(nope).length + Object.entries(unapproved).length}
  <h2>Unavailable/discarded</h2>
  <div data-test="lineup-editor-nope">
    {#if Object.entries(unapproved).length}
      <h3>Discarded applicants</h3>
      <div data-test="people-discarded">
        <Editor people="{unapproved}" updaters="{updaters}" />
      </div>
    {/if}
    {#if Object.entries(nope).length}
      <h3>Unavailable</h3>
      <div data-test="signup-nope">
        <Editor people="{nope}" updaters="{updaters}" />
      </div>
    {/if}
  </div>
{/if}
