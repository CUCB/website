<script context="module">
  import { QueryGigDetails, QuerySingleGig, QuerySingleGigSignupSummary } from "../../../../graphql/gigs";
  import { notLoggedIn } from "../../../../client-auth";
  import { makeClient, handleErrors } from "../../../../graphql/client";

  export async function preload({ params }, session) {
    let { gig_id } = params;

    if (notLoggedIn.bind(this)(session)) return;

    let client = makeClient(this.fetch);
    let clientCurrentUser = makeClient(this.fetch, { role: "current_user" });

    let res_gig, res_signup, signupSummary = undefined;
    let gig;
    try {
      res_gig = await client.query({
        query: QueryGigDetails(session.hasuraRole),
        variables: { gig_id },
      });
      res_signup = await clientCurrentUser.query({
        query: QuerySingleGig,
        variables: { gig_id },
      });
    } catch (e) {
      await handleErrors.bind(this)(e, session);
      return;
    }

    try {
      signupSummary = (await client.query({
          query: QuerySingleGigSignupSummary,
          variables: { gig_id },
      })).data.cucb_gigs_lineups;
    } catch (e){
        console.log(e)
    }

    if (res_gig && res_gig.data && res_gig.data.cucb_gigs_by_pk) {
      gig = res_gig.data.cucb_gigs_by_pk;
    } else {
      this.error(404, "Gig not found");
      return;
    }

    return {
      gig,
      signupGig: res_signup.data.cucb_gigs && res_signup.data.cucb_gigs[0],
      userInstruments: res_signup.data.cucb_users_instruments,
      signupSummary,
    };
  }
</script>

<script>
  import Summary from "../../../../components/Gigs/Summary.svelte";
  import { makeTitle } from "../../../../view";
  import { writable } from "svelte/store";
  export let gig, userInstruments, signupGig, signupSummary;
  let signupGig2 = writable(signupGig);
</script>

<svelte:head>
  <title>{makeTitle(`Gig: ${gig.title}`)}</title>
</svelte:head>

<h1>Gigs</h1>
<Summary {gig} signupGig="{signupGig2}" signups={signupSummary} {userInstruments} />
