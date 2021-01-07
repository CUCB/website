<script context="module">
  import { extractAttributes } from "../../../../graphql/gigs/lineups/users/attributes";
  import { QueryGigLineup } from "../../../../graphql/gigs/lineups";
  import { QueryGigType } from "../../../../graphql/gigs";
  import { handleErrors, makeClient } from "../../../../graphql/client";
  import { notLoggedIn } from "../../../../client-auth.js";

  export async function preload({ params }, session) {
    let { gig_id } = params;

    if (notLoggedIn.bind(this)(session)) return;

    let client = makeClient(this.fetch);

    let res;
    let people;
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
      }
    } catch (e) {
      await handleErrors.bind(this)(e, session);
      return;
    }

    if (res && res.data && res.data.cucb_gigs_by_pk) {
      people = res.data.cucb_gigs_by_pk.lineup;
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

    return { people: personLookup, gigId: gig_id };
  }
</script>

<script>
  import Editor from "../../../../components/Lineup/Editor/Editor.svelte";
  import { setInstrumentApproved } from "../../../../graphql/gigs/lineups/users/instruments";
  import { setRole } from "../../../../graphql/gigs/lineups/users/roles";
  import { setApproved } from "../../../../graphql/gigs/lineups";
  import { client } from "../../../../graphql/client";
  import { Map } from "immutable";
  export let people;
  export let gigId;
  let peopleStore = new Map(people);
  let errors = [];

  const wrap = (fn) => (userId) => async (...args) => {
    let res = await fn({ client: $client, people: peopleStore, errors, gigId, userId }, ...args);

    peopleStore = res.people;
    errors = res.errors;
  };

  let updaters = {
    setInstrumentApproved: wrap(setInstrumentApproved),
    setRole: wrap(setRole),
    setApproved: wrap(setApproved),
  };
  $: available = Object.fromEntries(
    Object.entries(peopleStore.toObject()).filter(
      ([k, v]) => v.user_available && !v.user_only_if_necessary && v.approved === null,
    ),
  );
  $: if_necessary = Object.fromEntries(
    Object.entries(peopleStore.toObject()).filter(([k, v]) => v.user_only_if_necessary && v.approved === null),
  );
  $: approved = Object.fromEntries(Object.entries(peopleStore.toObject()).filter(([k, v]) => v.approved));
  $: unapproved = Object.fromEntries(Object.entries(peopleStore.toObject()).filter(([k, v]) => v.approved === false));
  $: nope = Object.fromEntries(
    Object.entries(peopleStore.toObject()).filter(([k, v]) => v.approved === null && v.user_available === false),
  );
</script>

Gig id:
{gigId}
{#if Object.entries(approved).length}
  <h2>Approved lineup</h2>
  <div data-test="lineup-editor-approved">
    <Editor people="{approved}" updaters="{updaters}" />
  </div>
{/if}
{#if Object.entries(available).length + Object.entries(if_necessary).length}
  <h2>Applicants/maybes</h2>
  <div data-test="lineup-editor-applicants">
    {#if Object.entries(available).length}
      <div data-test="signup-yes">
        <Editor people="{available}" updaters="{updaters}" />
      </div>
    {/if}
    {#if Object.entries(if_necessary).length}
      <h3>Only if necessary</h3>
      <div data-test="signup-maybe">
        <Editor people="{if_necessary}" updaters="{updaters}" />
      </div>
    {/if}
  </div>
{/if}
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
