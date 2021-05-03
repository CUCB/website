<script context="module" lang="ts">
  import { handleErrors, makeClient } from "../../../graphql/client";
  import { notLoggedIn } from "../../../client-auth.js";
  import { QueryAllGigSignupSummary } from "../../../graphql/gigs";
  import { DateTime, Settings } from "luxon";

  export interface User {
    id: number;
    first: string;
    last: string;
    gig_notes: string | null;
  }
  export interface LineupEntry {
    approved: boolean | null;
    user: User;
    user_available: boolean | null;
    user_only_if_necessary: boolean | null;
    user_notes: string | null;
  }
  export interface Gig {
    id: number;
    date: string;
    sort_date: string;
    lineup: LineupEntry[];
    title: string;
  }

  export async function load({ fetch, session }) {
    Settings.defaultZoneName = "Europe/London";

    const loginFail = notLoggedIn(session);
    if (loginFail) return loginFail;

    let client = makeClient(fetch);

    let res: { data: { since: { gig: Gig }[]; signupsOpen: Gig[] } };
    try {
      res = await client.query({
        query: QueryAllGigSignupSummary,
        variables: { since: DateTime.local().minus({ months: 1 }) },
      });
    } catch (e) {
      return handleErrors(e, session);
    }

    return {
      props: {
        sinceOneMonth: res.data.since.map((x) => x.gig),
        signupsOpen: res.data.signupsOpen,
      },
    };
  }
</script>

<script lang="ts">
  Settings.defaultZoneName = "Europe/London";
  import SignupAdmin from "../../../components/Gigs/Lineup/SignupAdmin.svelte";
  import { List, Map } from "immutable";

  export let sinceOneMonth: Gig[], signupsOpen: Gig[];
  $: noLineup = signupsOpen.filter(hasNoLineup);
  $: futureGigs = sinceOneMonth.filter(isInFuture);
  $: signupsOpenOrLineupSelectedForFuture = List(
    Map([
      ...futureGigs.map<[number, Gig]>((gig) => [gig.id, gig]),
      ...signupsOpen.map<[number, Gig]>((gig) => [gig.id, gig]),
    ]).values(),
  )
    .sortBy((gig: Gig) => gig.sort_date)
    .toJS();
  const VIEWS = { signupsOpen: {}, sinceOneMonth: {}, noLineup: {} };
  let view = VIEWS.signupsOpen;
  $: gigs =
    view === VIEWS.signupsOpen
      ? signupsOpenOrLineupSelectedForFuture
      : view === VIEWS.sinceOneMonth
      ? sinceOneMonth
      : noLineup;

  const hasNoLineup = (gig: Gig) => gig.lineup.filter((person: LineupEntry) => person.approved).length === 0;
  const isInFuture = (gig: Gig) => DateTime.local().startOf("day") < DateTime.fromISO(gig.date).startOf("day");
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
