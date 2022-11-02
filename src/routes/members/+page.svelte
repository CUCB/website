<script lang="ts">
  import GigSignup from "../../components/Gigs/Signup.svelte";
  import { makeTitle } from "../../view";
  import type { PageData } from "./$types";
  export let data: PageData;
  let { gigSignups, userInstruments, session } = data;
</script>

<svelte:head>
  <title>{makeTitle("Members")}</title>
</svelte:head>

<h1>Members</h1>

<h2>Gig signup</h2>
{#if ["webmaster", "president", "secretary"].includes(session.hasuraRole)}
  <p>You're an important person. You can <a href="/members/gigs/signups">view the gig signup summary</a>.</p>
{/if}
{#each gigSignups as gig}
  <GigSignup gig="{gig}" userInstruments="{userInstruments}" user="{session}" />
{:else}No gigs are open for signups at the moment :(.{/each}
