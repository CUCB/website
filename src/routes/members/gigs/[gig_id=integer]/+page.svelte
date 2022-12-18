<script lang="ts">
  import type { PageData } from "./$types";
  import Summary from "../../../../components/Gigs/Summary.svelte";
  import { makeTitle } from "../../../../view";
  import { writable } from "svelte/store";
  import { DateTime } from "luxon";

  export let data: PageData;
  let { gig, userInstruments, signupGig, signupSummary, session } = data;
  let signupStore = writable({ ...signupGig });

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
  let newUserInstruments = [...(signupGig?.lineup?.[0]?.user_instruments || [])];
  newUserInstruments.push(
    ...userInstruments
      .filter((signupUi) => !newUserInstruments.map((ui) => ui.user_instrument.id).includes(signupUi.id))
      .map((user_instrument) => ({ user_instrument })),
  );
</script>

<svelte:head>
  <title>{makeTitle(`Gig: ${gig.title}`)}</title>
</svelte:head>

<h1>Gigs</h1>
<Summary
  gig="{gig}"
  signupGig="{signupStore}"
  signups="{signupSummary}"
  userInstruments="{newUserInstruments}"
  session="{session}"
/>
