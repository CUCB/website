<script lang="ts">
  import type { PageData } from "./$types";
  import Summary from "../../../../components/Gigs/Summary.svelte";
  import { makeTitle } from "../../../../view";
  import { writable } from "svelte/store";
  import { DateTime } from "luxon";

  export let data: PageData;
  let { gig, userInstruments, signupGig, signupSummary, session } = data;

  // TODO remove this bodging
  if (gig.arrive_time && typeof gig.arrive_time === "object") {
    gig.arrive_time = DateTime.fromJSDate(gig.arrive_time).toISO();
  }
  if (gig.date && typeof gig.date === "object") {
    gig.date = DateTime.fromJSDate(gig.date).toISODate();
  }
  if (gig.finish_time && typeof gig.finish_time === "object") {
    gig.finish_time = DateTime.fromJSDate(gig.finish_time).toISO();
  }
</script>

<svelte:head>
  <title>{makeTitle(`Gig: ${gig.title}`)}</title>
</svelte:head>

<h1>Gigs</h1>
<Summary
  gig="{gig}"
  signupGig="{writable(signupGig)}"
  signups="{signupSummary}"
  userInstruments="{userInstruments.map((user_instrument) => ({ user_instrument }))}"
  session="{session}"
/>
