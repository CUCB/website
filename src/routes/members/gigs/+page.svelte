<script lang="ts">
  import { makeTitle, calendarStartDay, themeName } from "../../../view";
  import Summary from "../../../components/Gigs/Summary.svelte";
  import Calendar from "../../../components/Gigs/Calendar.svelte";
  import { DateTime, Settings } from "luxon";
  import { writable } from "svelte/store";
  import type { Writable } from "svelte/store";
  import type { PageData } from "./$types";
  import type { GigSummary, SignupGig } from "../types";
  export let data: PageData;
  let { gigs, calendarGigs, currentCalendarMonth, userInstruments, userNotes, initialSignupGigs, session, signups } =
    data;
  let signupGigs: Record<string, SignupGig | Writable<SignupGig>> = initialSignupGigs;
  Settings.defaultZoneName = "Europe/London";

  function isStore(arg: SignupGig | Writable<SignupGig>): arg is Writable<SignupGig> {
    // @ts-expect-error
    return typeof arg.subscribe !== "undefined";
  }

  function isNotStore(arg: SignupGig | Writable<SignupGig>): arg is SignupGig {
    return !isStore(arg);
  }

  $: reloadSignupGigs(gigs);
  function reloadSignupGigs(gigs: GigSummary[]) {
    let newlyMerged: ([string, Writable<SignupGig>] | [])[] = gigs.map((gig) => {
      let signupGig = signupGigs[gig.id];
      return gig.id in signupGigs && isNotStore(signupGig)
        ? [
            gig.id.toString(),
            writable({
              ...signupGig,
              allow_signups: true,
            }),
          ]
        : [];
    });
    signupGigs = Object.fromEntries([...Object.entries(signupGigs), ...newlyMerged]);
  }
  let allUpcoming = gigs;
  let drafts = gigs.filter((gig) => gig.type.code === "draft");
  $: currentCalendarMonthLuxon = DateTime.fromFormat(currentCalendarMonth, "yyyy-LL");
  let displaying: "byMonth" | "allUpcoming" = "allUpcoming";

  const display = (toDisplay: "byMonth" | "allUpcoming") => {
    if (toDisplay === "byMonth") {
      gigs = calendarGigs[currentCalendarMonth];
    }
    if (toDisplay === "allUpcoming") {
      gigs = allUpcoming;
    }
    displaying = toDisplay;
  };

  $: currentCalendarMonth && display(displaying);

  let gotoDate = (newDate: string) => async () => {
    if (!(newDate in calendarGigs)) {
      const isoToJS = (date: string | null): Date | null => (date !== null ? DateTime.fromISO(date).toJSDate() : null);
      const gigs = await fetch(`/members/gigs.json?inMonth=${newDate}`).then((res) => res.json());
      type GigWithStringDates = Omit<
        GigSummary,
        "arrive_time" | "finish_time" | "sort_date" | "date" | "quote_date"
      > & {
        arrive_time: string | null;
        finish_time: string | null;
        sort_date: string | null;
        date: string | null;
        quote_date: string | null;
      };
      calendarGigs[newDate] = gigs.map((gig: GigWithStringDates) => ({
        ...gig,
        arrive_time: isoToJS(gig.arrive_time),
        finish_time: isoToJS(gig.finish_time),
        sort_date: isoToJS(gig.sort_date),
        date: isoToJS(gig.date),
        quote_date: isoToJS(gig.quote_date),
      }));
    }
    currentCalendarMonth = newDate;
    gigs = gigs;
  };
  $: gotoPreviousCalendarMonth = gotoDate(
    DateTime.fromFormat(currentCalendarMonth, "yyyy-LL").minus({ months: 1 }).toFormat("yyyy-LL"),
  );
  $: gotoNextCalendarMonth = gotoDate(
    DateTime.fromFormat(currentCalendarMonth, "yyyy-LL").plus({ months: 1 }).toFormat("yyyy-LL"),
  );
  $: changeCalendarDate = async (event: CustomEvent<{ month?: number; year?: number }>) => {
    if (event.detail.month !== undefined) {
      await gotoDate(
        DateTime.fromFormat(currentCalendarMonth, "yyyy-LL").set({ month: event.detail.month }).toFormat("yyyy-LL"),
      )();
    }
    if (event.detail.year !== undefined) {
      await gotoDate(
        DateTime.fromFormat(currentCalendarMonth, "yyyy-LL").set({ year: event.detail.year }).toFormat("yyyy-LL"),
      )();
    }
  };
</script>

<style lang="scss">
  @import "../../../sass/themes.scss";
  .heading {
    display: grid;
    grid-template-columns: 1fr 21em;
    grid-gap: 1em;
    margin-bottom: 1em;
  }

  .link:focus,
  .link > span:focus {
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

  .link:focus > span {
    outline: 2px solid;
    @include themeify($themes) {
      outline-color: themed("textColor");
    }
    outline-offset: 0.15em;
  }

  .calendar {
    margin-bottom: 0.5em;
    justify-self: end;
  }

  .calendar p {
    margin-bottom: 0;
  }

  .calendar ul {
    margin: 0;
  }

  .information p:first-of-type {
    margin-top: 0;
  }

  @media only screen and (min-width: 600px) {
    .calendar {
      margin-top: 0.5em;
    }
  }

  @media only screen and (max-width: 600px) {
    .heading {
      grid-template-columns: 1fr;
    }
    .heading p:last-of-type {
      margin-bottom: 0;
    }
    .calendar {
      justify-self: stretch;
    }
  }
</style>

<svelte:head>
  <title>{makeTitle("Gigs")}</title>
</svelte:head>
<div class="heading">
  <div class="information">
    <h1>Gig Diary</h1>

    <p>This is a listing of all our gigs. Some things you may be interested in are:</p>
    <ul>
      <li><a href="/members/gigs/help">How to use the gig diary</a></li>
      <li>
        Specifically,&nbsp;
        <a href="/members/gigs/help#calendar-feeds">how to set-up a calendar feed</a>
        which automatically updates with the gigs you are on the lineup for
      </li>
      <li><a href="/members/gigs/venues">The venues we've played at</a></li>
      <li><a href="/members/gigs/venues">The people associated with the band</a></li>
    </ul>
    {#if drafts.length > 0}
      There are some drafts lying around:
      {#each drafts as gig}
        <a style="font-style: italic" href="/members/gigs/{gig.id}">{gig.title || "Unnamed draft"}</a>
        [created
        {(gig.posting_time && DateTime.fromJSDate(gig.posting_time).toFormat("HH:mm, dd/LL")) || "somewhen?"}
        by
        {(gig.posting_user && gig.posting_user.first) || "someone?"}],
      {/each}
      so please don't leave them here forever
    {/if}
  </div>
  <div class="calendar theme-{$themeName}">
    <Calendar
      gigs="{calendarGigs[currentCalendarMonth]}"
      displayedMonth="{currentCalendarMonthLuxon}"
      startDay="{$calendarStartDay}"
      on:clickPrevious="{gotoPreviousCalendarMonth}"
      on:clickNext="{gotoNextCalendarMonth}"
      on:changeDate="{changeCalendarDate}"
    />
    <p>Display:</p>
    <ul>
      <li>
        {#if displaying === "allUpcoming"}
          All upcoming gigs (currently shown)
        {:else}
          <button class="link" on:click="{() => display('allUpcoming')}" data-test="gigview-all-upcoming">
            <span tabindex="-1" on:click on:keypress="{() => display('allUpcoming')}">All upcoming gigs</span>
          </button>
        {/if}
      </li>
      <li>
        {#if displaying === "byMonth"}
          Gigs by month (currently shown)
        {:else}
          <button class="link" on:click="{() => display('byMonth')}" data-test="gigview-by-month">
            <span tabindex="-1" on:click on:keypress="{() => display('byMonth')}">Gigs by month</span>
          </button>
        {/if}
      </li>
    </ul>
  </div>
</div>

{#each gigs as gig (gig.id)}
  {@const signupGig = signupGigs[gig.id]}
  {#if gig.id in signupGigs && isStore(signupGig)}
    <!-- TODO ensure tests cover the fact that the signup summary that should exist here -->
    <Summary
      gig="{gig}"
      signupGig="{signupGig}"
      initialUserNotes="{userNotes}"
      userInstruments="{userInstruments}"
      linkHeading="{true}"
      session="{session}"
      signups="{signups?.filter((entry) => entry.gig.id === gig.id)}"
    />
  {:else}
    <Summary
      gig="{gig}"
      userInstruments="{userInstruments}"
      linkHeading="{true}"
      session="{session}"
      signups="{signups?.filter((entry) => entry.gig.id === gig.id)}"
    />
  {/if}
{:else}No gigs to display{/each}
