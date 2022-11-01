<script lang="ts">
  import type { PageData } from "./$types";
  import Summary from "../../../../components/Gigs/Summary.svelte";
  import { makeTitle } from "../../../../view";

  export let data: PageData;
  let { gig, userInstruments, signupGig, signupSummary, session } = data;
</script>

<svelte:head>
  <title>{makeTitle(`Gig: ${gig.title}`)}</title>
</svelte:head>

<h1>Gigs</h1>
<Summary
  gig="{gig}"
  signupGig="{signupGig}"
  signups="{signupSummary}"
  userInstruments="{userInstruments}"
  session="{session}"
/>
