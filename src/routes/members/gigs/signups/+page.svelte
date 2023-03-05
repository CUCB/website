<script lang="ts">
  Settings.defaultZoneName = "Europe/London";
  import SignupAdmin from "../../../../components/Gigs/Lineup/SignupAdmin.svelte";
  import { List, Map } from "immutable";
  import { DateTime, Settings } from "luxon";
  import type { Gig, LineupEntry } from "./types";
  import type { PageData } from "./$types";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { destroy_block } from "svelte/internal";

  export let data: PageData;
  let { sinceOneMonth, signupsOpen } = data;
  $: noLineup = signupsOpen.filter(hasNoLineup);
  $: futureGigs = sinceOneMonth.filter(isInFuture);
  $: signupsOpenOrLineupSelectedForFuture = List(
    Map([
      ...futureGigs.map<[string, Gig]>((gig) => [gig.id, gig]),
      ...signupsOpen.map<[string, Gig]>((gig) => [gig.id, gig]),
    ]).values(),
  )
    .sortBy((gig: Gig) => gig.sort_date)
    .toJS() as typeof signupsOpen;
  const VIEWS = { signupsOpen: {}, sinceOneMonth: {}, noLineup: {} };
  $: view = VIEWS[$page.url.searchParams.get("view") || "signupsOpen"] || VIEWS.signupsOpen;
  $: gigs =
    view === VIEWS.signupsOpen
      ? signupsOpenOrLineupSelectedForFuture
      : view === VIEWS.sinceOneMonth
      ? sinceOneMonth
      : noLineup;

  const hasNoLineup = (gig: Gig) => gig.lineup.filter((person: LineupEntry) => person.approved).length === 0;
  const isInFuture = (gig: Gig) =>
    gig.date && DateTime.local().startOf("day") < DateTime.fromISO(gig.date).startOf("day");
  $: sortedBy = $page.url.searchParams.get("sortedBy");

  const searchParam = (key: string, value: string): string => {
    const params = new URLSearchParams($page.url.searchParams);
    params.set(key, value);
    return `?${params}`;
  };

  type View = keyof typeof VIEWS;
  $: links = {
    signupsOpen: searchParam("view", "signupsOpen"),
    noLineup: searchParam("view", "noLineup"),
    sinceOneMonth: searchParam("view", "sinceOneMonth"),
  };

  const localLink = (node: HTMLAnchorElement) => {
    node.addEventListener("click", (e: Event) => {
      e.preventDefault();
      node.focus();
      goto(node.href, { noScroll: true, keepFocus: true });
    });
  };
</script>

<h1>Gig signup admin</h1>

{#if view === VIEWS.signupsOpen}
  <p>
    Showing all upcoming gigs.
    <a href="{links.noLineup}" use:localLink data-test="show-upcoming-no-lineup"
      >Seememehow only upcoming gigs without a lineup</a
    >
    &#32;|
    <a href="{links.sinceOneMonth}" use:localLink data-test="show-past-month">Show all gigs since one month back</a>
  </p>
{:else if view === VIEWS.noLineup}
  <p>
    Showing upcoming gigs without a lineup.
    <a href="{links.signupsOpen}" use:localLink data-test="show-upcoming">Show all upcoming gigs</a>
    &#32;|
    <a href="{links.sinceOneMonth}" use:localLink data-test="show-past-month">Show all gigs since one month back</a>
  </p>
{:else}
  <p>
    Showing all gigs since one month back.
    <a href="{links.noLineup}" use:localLink data-test="show-upcoming-no-lineup"
      >Show only upcoming gigs without a lineup</a
    >
    &#32;|
    <a href="{links.signupsOpen}" use:localLink data-test="show-upcoming">Show all upcoming gigs</a>.
  </p>
{/if}
<SignupAdmin
  gigs="{gigs}"
  on:select="{({ detail: { gig } }) => goto(searchParam('sortedBy', gig), { noScroll: true, keepFocus: true })}"
  sortedBy="{sortedBy}"
/>
