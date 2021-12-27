<script context="module">
  import { makeClient, handleErrors } from "../../../graphql/client";
  import { QueryMultiGigDetails, QueryMultiGigSignup } from "../../../graphql/gigs";

  export async function load({ fetch, session }) {
    Settings.defaultZoneName = "Europe/London";

    let res_gig, res_signup, res_gig_2;
    let preloadClient = makeClient(fetch);
    let preloadClientCurrentUser = makeClient(fetch, { role: "current_user" });
    try {
      res_gig = await preloadClient.query({
        query: QueryMultiGigDetails(session.hasuraRole),
        variables: {
          where: {
            _or: [{ date: { _gte: "now()" } }, { arrive_time: { _gte: "now()" } }, { finish_time: { _gte: "now()" } }],
          },
          order_by: [{ date: "asc" }, { arrive_time: "asc" }],
        },
      });
      res_gig_2 = await preloadClient.query({
        query: QueryMultiGigDetails(session.hasuraRole),
        variables: {
          where: {
            _or: [
              {
                date: {
                  _gte: DateTime.local().startOf("month").toISO(),
                  _lte: DateTime.local().endOf("month").toISO(),
                },
              },
              {
                arrive_time: {
                  _gte: DateTime.local().startOf("month").toISO(),
                  _lte: DateTime.local().endOf("month").toISO(),
                },
              },
              {
                finish_time: {
                  _gte: DateTime.local().startOf("month").toISO(),
                  _lte: DateTime.local().endOf("month").toISO(),
                },
              },
            ],
          },
          order_by: { date: "asc" },
        },
      });
      res_signup = await preloadClientCurrentUser.query({
        query: QueryMultiGigSignup,
        variables: { where: { allow_signups: { _eq: true } } },
      });
    } catch (e) {
      return handleErrors(e, session);
    }

    if (res_gig && res_gig.data && res_gig.data.cucb_gigs) {
      let gigs = res_gig.data.cucb_gigs;
      // Sort the gigs before rendering since the database can't sort by computed field
      gigs = gigs.sort((gigA, gigB) => new Date(gigA.sort_date).getTime() - new Date(gigB.sort_date).getTime());

      let signup_dict = {};
      let signups = res_signup.data.cucb_gigs;
      for (let gig of signups) {
        signup_dict[gig.id] = gig;
      }

      let currentCalendarMonth = DateTime.local().toFormat("yyyy-LL");

      return {
        props: {
          gigs,
          signupGigs: signup_dict,
          userInstruments: res_signup.data.cucb_users_instruments,
          calendarGigs: {
            [currentCalendarMonth]: res_gig_2.data.cucb_gigs.sort(
              (gigA, gigB) => new Date(gigA.sort_date).getTime() - new Date(gigB.sort_date).getTime(),
            ),
          },
          currentCalendarMonth,
        },
      };
    } else {
      return { status: 500, error: "Couldn't retrieve gig details" };
    }
  }
</script>

<script lang="ts">
  import { makeTitle, calendarStartDay, themeName } from "../../../view";
  import { client } from "../../../graphql/client";
  import { session } from "$app/stores";
  import Summary from "../../../components/Gigs/Summary.svelte";
  import Calendar from "../../../components/Gigs/Calendar.svelte";
  import { DateTime, Settings } from "luxon";
  import { writable } from "svelte/store";
  export let gigs: any[], calendarGigs, currentCalendarMonth, userInstruments, signupGigs;
  Settings.defaultZoneName = "Europe/London";

  $: reloadSignupGigs(gigs);
  function reloadSignupGigs(gigs) {
    let newlyMerged = gigs.map((gig) =>
      gig.id in signupGigs && typeof signupGigs[gig.id].subscribe === "undefined"
        ? [
            gig.id,
            writable({
              ...mergeDeep(signupGigs[gig.id], gig),
              lineup: signupGigs[gig.id].lineup.filter((person) => person.user_id),
            }),
          ]
        : [],
    );
    signupGigs = Object.fromEntries([...Object.entries(signupGigs), ...newlyMerged]);
  }
  let allUpcoming = gigs;
  let drafts = gigs.filter((gig) => gig.type.code === "draft");
  $: currentCalendarMonthLuxon = DateTime.fromFormat(currentCalendarMonth, "yyyy-LL");
  let displaying = "allUpcoming";

  function isObject(item) {
    return item && typeof item === "object" && !Array.isArray(item);
  }
  function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
      for (const key in source) {
        if (isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          mergeDeep(target[key], source[key]);
        } else if (Array.isArray(source[key]) && Array.isArray(target[key])) {
          Object.assign(target, { [key]: [...target[key], ...source[key]] });
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }

    return mergeDeep(target, ...sources);
  }

  const display = (toDisplay) => {
    if (toDisplay === "byMonth") {
      gigs = calendarGigs[currentCalendarMonth];
    }
    if (toDisplay === "allUpcoming") {
      gigs = allUpcoming;
    }
    displaying = toDisplay;
  };

  $: currentCalendarMonth && display(displaying);

  let gotoDate = (newDate) => async () => {
    if (!(newDate in calendarGigs)) {
      let res_gig_2 = await $client.query({
        query: QueryMultiGigDetails($session.hasuraRole),
        variables: {
          where: {
            _or: [
              {
                date: {
                  _gte: DateTime.fromFormat(newDate, "yyyy-LL").startOf("month").toISO(),
                  _lte: DateTime.fromFormat(newDate, "yyyy-LL").endOf("month").toISO(),
                },
              },
              {
                arrive_time: {
                  _gte: DateTime.fromFormat(newDate, "yyyy-LL").startOf("month").toISO(),
                  _lte: DateTime.fromFormat(newDate, "yyyy-LL").endOf("month").toISO(),
                },
              },
              {
                finish_time: {
                  _gte: DateTime.fromFormat(newDate, "yyyy-LL").startOf("month").toISO(),
                  _lte: DateTime.fromFormat(newDate, "yyyy-LL").endOf("month").toISO(),
                },
              },
            ],
          },
          order_by: { date: "asc" },
        },
      });
      // @ts-ignore
      calendarGigs[newDate] = res_gig_2.data.cucb_gigs;
      calendarGigs[newDate] = calendarGigs[newDate].sort(
        (gigA, gigB) => new Date(gigA.sort_date).getTime() - new Date(gigB.sort_date).getTime(),
      );
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
  <title>{makeTitle('Gigs')}</title>
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
        <a style="font-style: italic" href="/members/gigs/{gig.id}">{gig.title || 'Unnamed draft'}</a>
        [created
        {DateTime.fromISO(gig.posting_time).toFormat('HH:mm, dd/LL')}
        by
        {(gig.user && gig.user.first) || 'someone?'}],
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
        {#if displaying === 'allUpcoming'}
          All upcoming gigs (currently shown)
        {:else}
          <button class="link" on:click="{() => display('allUpcoming')}" data-test="gigview-all-upcoming">
            <span tabindex="-1" on:click>All upcoming gigs</span>
          </button>
        {/if}
      </li>
      <li>
        {#if displaying === 'byMonth'}
          Gigs by month (currently shown)
        {:else}
          <button class="link" on:click="{() => display('byMonth')}" data-test="gigview-by-month">
            <span tabindex="-1" on:click>Gigs by month</span>
          </button>
        {/if}
      </li>
    </ul>
  </div>
</div>

{#each gigs as gig (gig.id)}
  {#if gig.id in signupGigs && typeof signupGigs[gig.id].subscribe !== 'undefined'}
    <Summary gig="{gig}" signupGig="{signupGigs[gig.id]}" userInstruments="{userInstruments}" linkHeading="{true}" />
  {:else}
    <Summary gig="{gig}" userInstruments="{userInstruments}" linkHeading="{true}" />
  {/if}
{:else}No gigs to display{/each}
