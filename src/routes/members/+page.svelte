<script lang="ts">
  import GigSignup from "../../components/Gigs/Signup.svelte";
  import { SELECT_GIG_LINEUPS, UPDATE_LIST042 } from "$lib/permissions";
  import { makeTitle } from "../../view";
  import type { PageData } from "./$types";
  export let data: PageData;
  let { gigSignups, userInstruments, session, userNotes } = data;
</script>

<svelte:head>
  <title>{makeTitle("Members")}</title>
</svelte:head>

<h1>Members</h1>

<h2>Gig signup</h2>
{#if SELECT_GIG_LINEUPS.guard(session)}
  <p>You're an important person. You can <a href="/members/gigs/signups">view the gig signup summary</a>.</p>
{/if}
{#if UPDATE_LIST042.guard(session)}
  <p>
    You are also allowed to <a href="/members/list042">update the list of emails authorized to sign up to the website</a
    >.
  </p>
{/if}
{#each gigSignups as gig}
  <!-- TODO find some way of convincing this that session.userId definitely exists -->
  <GigSignup
    gig="{gig}"
    initialUserNotes="{userNotes}"
    userInstruments="{userInstruments.map((user_instrument) => ({ user_instrument }))}"
    session="{session}"
  />
{:else}No gigs are open for signups at the moment :(.{/each}
