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
  import { client } from "../../../../graphql/client";
  export let people;
  export let gigId;

  let updaters = { setInstrumentApproved, setRole };
  $: available = Object.fromEntries(Object.entries(people).filter(([k, v]) => v.user_available && v.approved === null));
  $: approved = Object.fromEntries(Object.entries(people).filter(([k, v]) => v.approved));
  $: nope = Object.fromEntries(Object.entries(people).filter(([k, v]) => v.approved === false || (v.approved === null && v.user_available === false)));
</script>

Gig id:
{gigId}
<h2>Approved lineup</h2>
<div data-test="lineup-editor-approved">
  <Editor people="{approved}" gigId="{gigId}" client="{$client}" updaters="{updaters}" />
</div>
<h2>Applicants/maybes</h2>
<div data-test="lineup-editor-applicants">
  <Editor people="{available}" gigId="{gigId}" client="{$client}" updaters="{updaters}" />
</div>
<h2>Unavailable/discarded</h2>
<div data-test="lineup-editor-nope">
  <Editor people="{nope}" gigId="{gigId}" client="{$client}" updaters="{updaters}" />
</div>