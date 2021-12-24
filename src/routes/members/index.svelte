<script context="module">
  import { makeClient } from "../../graphql/client";
  import { QueryGigSignup } from "../../graphql/gigs";
  import { notLoggedIn } from "../../client-auth.js";

  export async function preload(_, session) {
    if (notLoggedIn.bind(this)(session)) return;
    const client = makeClient(this.fetch, {
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
  import { stores } from "@sapper/app";
  export let gigSignups, userInstruments;
  let { session } = stores();
</script>

<svelte:head>
  <title>{makeTitle("Members")}</title>
</svelte:head>

<h1>Members</h1>

<h2>Gig signup</h2>
{#if ["webmaster", "president", "secretary"].includes($session.hasuraRole)}
  <p>You're an important person. You can <a href="/members/gigs/signups">view the gig signup summary</a>.</p>
{/if}
{#each gigSignups as gig}
  <GigSignup gig="{gig}" userInstruments="{userInstruments}" />
{:else}No gigs are open for signups at the moment :(.{/each}
