<script context="module">
  import { extractAttributes } from "../../../../graphql/gigs/lineups/users/attributes";
  import { QueryGigLineup, AllUserNames } from "../../../../graphql/gigs/lineups";
  import { QueryGigType } from "../../../../graphql/gigs";
  import { handleErrors, makeClient } from "../../../../graphql/client";
  import { notLoggedIn } from "../../../../client-auth.js";

  export async function preload({ params }, session) {
    let { gig_id } = params;

    if (notLoggedIn.bind(this)(session)) return;

    let client = makeClient(this.fetch);

    let res, res_allPeople;
    let people, allPeople, title;
    try {
      let gigType = await client.query({
        query: QueryGigType,
        variables: { id: gig_id },
      });
      if (gigType && gigType.data && gigType.data.cucb_gigs_by_pk && gigType.data.cucb_gigs_by_pk.type.code === "gig") {
        res = await client.query({
          query: QueryGigLineup,
          variables: { gig_id },
        });
        res_allPeople = await client.query({
          query: AllUserNames,
        });
        title = gigType.data.cucb_gigs_by_pk.title;
      }
    } catch (e) {
      await handleErrors.bind(this)(e, session);
      return;
    }

    if (res && res.data && res.data.cucb_gigs_by_pk) {
      people = res.data.cucb_gigs_by_pk.lineup;
      allPeople = res_allPeople.data.cucb_users;
    } else {
      this.error(404, "Gig not found");
      return;
    }

    let personLookup = {};
    for (let person of people) {
      person.user.attributes = extractAttributes(person.user);
      person.user.prefs = undefined;

      let user_instruments = {};
      for (let instrument of person.user_instruments) {
        user_instruments[instrument.user_instrument.id] = instrument;
      }
      person.user_instruments = user_instruments;
      personLookup[person.user.id] = person;
    }

    return { people: personLookup, gigId: gig_id, allPeople, title };
  }
</script>

<script>
  import Select from "../../../../components/Forms/Select.svelte";
  import Editor from "../../../../components/Gigs/Lineup/Editor/Editor.svelte";
  import { setInstrumentApproved, addInstrument } from "../../../../graphql/gigs/lineups/users/instruments";
  import { setRole } from "../../../../graphql/gigs/lineups/users/roles";
  import { setApproved, setAdminNotes, addUser as addUserUpdater } from "../../../../graphql/gigs/lineups";
  import { client } from "../../../../graphql/client";
  import { Map } from "immutable";
  import Fuse from "fuse.js";
  import SearchBox from "../../../../components/SearchBox.svelte";
  import { makeTitle } from "../../../../view";
  export let people, gigId, allPeople, searchText, title;
  let peopleStore = new Map(people);
  let errors = [];
  let selectedUser = undefined;

  const wrap = (fn) => (userId) => async (...args) => {
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
  };

  let updaters = {
    setInstrumentApproved: wrap(setInstrumentApproved),
    setRole: wrap(setRole),
    setApproved: wrap(setApproved),
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
</script>

<style>
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
</style>

<svelte:head>
  <title>{makeTitle(`${title} | Lineup Editor`)}</title>
</svelte:head>

<h1>{title}</h1>
{#if Object.entries(approved).length}
  <h2>Approved lineup</h2>
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
      <Select bind:value="{selectedUser}">
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
        on:select="{selectUser}"
        bind:value="{searchText}"
      />
    </div>
  </div>
  {#if Object.entries(if_necessary).length}
    <h3>Only if necessary</h3>
    <div data-test="signup-maybe">
      <Editor people="{if_necessary}" updaters="{updaters}" />
    </div>
  {/if}
</div>
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
