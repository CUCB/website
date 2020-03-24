<script context="module">
    import gql from "graphql-tag";
    import { extractAttributes } from "../../../../graphql/gigs/lineups/users/attributes";
    import { QueryGigLineup } from '../../../../graphql/gigs/lineups';
    import { getContext, onMount } from 'svelte';
    import { makeClient } from '../../../../graphql/client';

    let client;
    
    export async function preload({ params }) {
        let { gig_id } = params;

        let client = makeClient(this.fetch);
        
        let res = await client.query({
            query: QueryGigLineup,
            variables: { gig_id }
        });

        if (res.data.cucb_gigs_by_pk) {
            res = res.data.cucb_gigs_by_pk.lineup;
        } else {
            this.error(404, "Not Found");
        }

        let personLookup = {};
        for (let person of res) {
            person.user.attributes = extractAttributes(person.user);
            person.user.prefs = undefined;

            let user_instruments = {};
            for (let instrument of person.user_instruments) {
                user_instruments[instrument.user_instrument.id] = instrument;
            }
            person.user_instruments = user_instruments;
            personLookup[person.user.id] = person;
        }

        return { people: personLookup, client, gigId: gig_id };
    }
</script>

<script>
    import Editor from "../../../../components/Lineup/Editor/Editor.svelte";
    import { setInstrumentApproved } from "../../../../graphql/gigs/lineups/users/instruments";
    import { setRole } from "../../../../graphql/gigs/lineups/users/roles";
    export let people;
    export let gigId;
    export let client;

    let updaters = { setInstrumentApproved, setRole };
</script>

Gig id: {gigId}
<Editor {people} {gigId} {client} {updaters} />
