<script context="module">
  import { QueryGigDetails, QuerySingleGig, QuerySingleGigSignupSummary } from "../../../../graphql/gigs";
  import { notLoggedIn } from "../../../../client-auth";
  import { makeClient, handleErrors } from "../../../../graphql/client";
  import { writable } from "svelte/store";

  export async function load({ page: { params }, session, fetch }) {
    let { gig_id } = params;

    const loginFail = notLoggedIn(session);
    if (loginFail) return loginFail;

    let client = makeClient(fetch);
    let clientCurrentUser = makeClient(fetch, { role: "current_user" });

    let res_gig,
      res_signup,
      signupSummary = undefined;
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
      return handleErrors(e, session);
    }

    try {
      signupSummary = (
        await client.query({
          query: QuerySingleGigSignupSummary,
          variables: { gig_id },
        })
      ).data.cucb_gigs_lineups;
    } catch (e) {
      console.error(e);
    }

    if (res_gig && res_gig.data && res_gig.data.cucb_gigs_by_pk) {
      gig = res_gig.data.cucb_gigs_by_pk;
    } else {
      return { status: 404, error: "Gig not found" };
    }

    return {
      props: {
        gig,
        signupGig: writable(res_signup.data.cucb_gigs?.[0]),
        userInstruments: res_signup.data.cucb_users_instruments,
        signupSummary,
      },
    };
  }
</script>

<script>
  import Summary from "../../../../components/Gigs/Summary.svelte";
  import { makeTitle } from "../../../../view";
  export let gig, userInstruments, signupGig, signupSummary;
</script>

<svelte:head>
  <title>{makeTitle(`Gig: ${gig.title}`)}</title>
</svelte:head>

<h1>Gigs</h1>
<Summary gig="{gig}" signupGig="{signupGig}" signups="{signupSummary}" userInstruments="{userInstruments}" />
