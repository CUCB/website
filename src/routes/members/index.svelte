<script context="module">
  import { makeClient, handleErrors } from "../../graphql/client";
  import { QueryGigSignup } from "../../graphql/gigs";
  import { notLoggedIn } from "../../client-auth.js";

  export async function load({ session, fetch }) {
    const loginError = notLoggedIn(session);
    if (loginError) return loginError;

    const client = makeClient(fetch, {
      role: "current_user",
    });
    let res;
    try {
      res = await client.query({ query: QueryGigSignup });
    } catch (e) {
      return handleErrors(e);
    }
    let gigSignups = res.data.cucb_gigs;
    let userInstruments = res.data.cucb_users_instruments;
    return { props: { gigSignups, userInstruments } };
  }
</script>

<script>
  import GigSignup from "../../components/Gigs/Signup.svelte";
  import { makeTitle } from "../../view";
  import { session } from "$app/stores";
  export let gigSignups, userInstruments;
</script>

<svelte:head>
  <title>{makeTitle('Members')}</title>
</svelte:head>

<h1>Members</h1>

<h2>Gig signup</h2>
{#if ['webmaster', 'president', 'secretary'].includes($session.hasuraRole)}
  <p>You're an important person. You can <a href="/members/gigs/signups">view the gig signup summary</a>.</p>
{/if}
{#each gigSignups as gig}
  <GigSignup gig="{gig}" userInstruments="{userInstruments}" />
{:else}No gigs are open for signups at the moment :(.{/each}
