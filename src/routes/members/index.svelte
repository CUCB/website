<script context="module">
  import { makeClient } from "../../graphql/client";
  import { QueryGigSignup } from "../../graphql/gigs";
  import { notLoggedIn } from "../../client-auth.js";

  export async function preload(page, session) {
    if (notLoggedIn.bind(this)(session)) return;
    const client = await makeClient(this.fetch, {
      role: "current_user",
    });
    let res = await client.query({ query: QueryGigSignup });
    let gigSignups = res.data.cucb_gigs;
    let userInstruments = res.data.cucb_users_instruments;
    return { gigSignups, userInstruments };
  }
</script>

<script>
  import GigSignup from "../../components/Gigs/Signup.svelte";
  import { makeTitle } from "../../view";
  export let gigSignups, userInstruments;
</script>

<svelte:head>
  <title>{makeTitle('Members')}</title>
</svelte:head>

<h1>Members</h1>

<h2>Gig signup</h2>
{#each gigSignups as gig}
  <GigSignup {gig} {userInstruments} />
{/each}
