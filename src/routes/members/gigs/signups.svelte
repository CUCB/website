<script context="module">
  import { handleErrors, makeClient } from "../../../graphql/client";
  import { notLoggedIn } from "../../../client-auth.js";
  import { QueryAllGigSignupSummary } from "../../../graphql/gigs";
  import { DateTime, Settings } from "luxon";

  export async function preload(_, session) {
    Settings.defaultZoneName = "Europe/London";

    if (notLoggedIn.bind(this)(session)) return;

    let client = makeClient(this.fetch);

    let res;
    try {
      res = await client.query({
        query: QueryAllGigSignupSummary,
        variables: { since: DateTime.local().minus({ months: 1 }) },
      });
    } catch (e) {
      handleErrors.bind(this)(e, session);
      return;
    }

    return {
      sinceOneMonth: res.data.since.map((x) => x.gig),
      signupsOpen: res.data.signupsOpen,
    };
  }
</script>

<script>
  Settings.defaultZoneName = "Europe/London";
  import SignupAdmin from "../../../components/Gigs/Lineup/SignupAdmin.svelte";
  import { List, Map } from "immutable";

  export let sinceOneMonth, signupsOpen;
  $: noLineup = signupsOpen.filter(hasNoLineup);
  $: futureGigs = sinceOneMonth.filter(isInFuture);
  $: signupsOpenOrLineupSelectedForFuture = List(
    Map([...futureGigs.map((gig) => [gig.id, gig]), ...signupsOpen.map((gig) => [gig.id, gig])]).values(),
  )
    .sortBy((gig) => gig.sort_date)
    .toJS();
  const VIEWS = { signupsOpen: {}, sinceOneMonth: {}, noLineup: {} };
  let view = VIEWS.signupsOpen;
  $: gigs =
    view === VIEWS.signupsOpen
      ? signupsOpenOrLineupSelectedForFuture
      : view === VIEWS.sinceOneMonth
      ? sinceOneMonth
      : noLineup;

  const hasNoLineup = (gig) => gig.lineup.filter((person) => person.approved).length === 0;
  const isInFuture = (gig) => DateTime.local().startOf("day") < DateTime.fromISO(gig.date).startOf("day");
</script>

<style>
  .link:focus {
    outline: none;
    box-shadow: none;
  }

  button.link:hover {
    filter: none;
  }
  button.link {
    border-top: none;
    border-left: none;
    border-right: none;
    border-radius: 0;
    padding-left: 0;
    padding-right: 0;
    height: auto;
    width: auto;
  }
</style>

<h1>Gig signup admin</h1>

{#if view === VIEWS.signupsOpen}
  <p>
    Showing all upcoming gigs.
    <button class="link" data-test="show-upcoming-no-lineup" on:click="{() => (view = VIEWS.noLineup)}"
      >Show only upcoming gigs without a lineup</button
    >
    &#32;|
    <button class="link" data-test="show-past-month" on:click="{() => (view = VIEWS.sinceOneMonth)}"
      >Show all gigs since one month back</button
    >
  </p>
{:else if view === VIEWS.noLineup}
  <p>
    Showing upcoming gigs without a lineup.
    <button class="link" data-test="show-upcoming" on:click="{() => (view = VIEWS.signupsOpen)}"
      >Show all upcoming gigs</button
    >. &#32;|
    <button class="link" data-test="show-past-month" on:click="{() => (view = VIEWS.sinceOneMonth)}"
      >Show all gigs since one month back</button
    >
  </p>
{:else}
  <p>
    Showing all gigs since one month back.
    <button class="link" data-test="show-upcoming-no-lineup" on:click="{() => (view = VIEWS.noLineup)}"
      >Show only upcoming gigs without a lineup</button
    >
    &#32;|
    <button class="link" data-test="show-upcoming" on:click="{() => (view = VIEWS.signupsOpen)}"
      >Show all upcoming gigs</button
    >.
  </p>
{/if}
<SignupAdmin gigs="{gigs}" />
