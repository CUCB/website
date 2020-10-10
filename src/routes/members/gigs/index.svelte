<script context="module">
  export async function preload(page, session) {
    let client = makeClient(this.fetch);
    let clientCurrentUser = makeClient(this.fetch, { role: "current_user" });

    let res_gig, res_signup, res_gig_2;
    let gig;
    try {
      res_gig = await client.query({
        query: QueryMultiGigDetails(session.hasuraRole),
        variables: {
          where: {
            _or: [{ date: { _gte: "now()" } }, { arrive_time: { _gte: "now()" } }, { finish_time: { _gte: "now()" } }],
          },
          order_by: [{ date: "asc" }, { arrive_time: "asc" }],
        },
      });
      res_gig_2 = await client.query({
        query: QueryMultiGigDetails(session.hasuraRole),
        variables: {
          where: {
            _or: [
              {
                date: {
                  _gte: moment()
                    .startOf("month")
                    .format(),
                  _lte: moment()
                    .endOf("month")
                    .format(),
                },
              },
              {
                arrive_time: {
                  _gte: moment()
                    .startOf("month")
                    .format(),
                  _lte: moment()
                    .endOf("month")
                    .format(),
                },
              },
              {
                finish_time: {
                  _gte: moment()
                    .startOf("month")
                    .format(),
                  _lte: moment()
                    .endOf("month")
                    .format(),
                },
              },
            ],
          },
          order_by: { date: "asc" },
        },
      });
      res_signup = await clientCurrentUser.query({
        query: QueryMultiGigSignup,
        variables: { where: { allow_signups: { _eq: true } } },
      });
    } catch (e) {
      await handleErrors.bind(this)(e, session);
      return;
    }

    if (res_gig && res_gig.data && res_gig.data.cucb_gigs) {
      let gigs = res_gig.data.cucb_gigs;
      // Sort the gigs pre render since the database can't sort by computed field
      gigs = gigs.sort((gigA, gigB) => new Date(gigA.sort_date) - new Date(gigB.sort_date));

      let signup_dict = {};
      let signups = res_signup.data.cucb_gigs;
      for (let gig of signups) {
        signup_dict[gig.id] = gig;
      }

      let currentCalendarMonth = moment().format("YYYY-MM");

      return {
        gigs,
        signupGigs: signup_dict,
        userInstruments: res_signup.data.cucb_users_instruments,
        calendarGigs: {
          [currentCalendarMonth]: res_gig_2.data.cucb_gigs.sort(
            (gigA, gigB) => new Date(gigA.sort_date) - new Date(gigB.sort_date),
          ),
        },
        currentCalendarMonth,
      };
    } else {
      this.error(500, "Couldn't retrieve gig details");
      return;
    }
  }
</script>

<script>
  import { makeTitle, calendarStartDay } from "../../../view";
  import { makeClient, handleErrors, client } from "../../../graphql/client";
  import { QueryMultiGigDetails, QueryMultiGigSignup } from "../../../graphql/gigs";
  import { stores } from "@sapper/app";
  import Summary from "../../../components/Gigs/Summary.svelte";
  import Calendar from "../../../components/Gigs/Calendar.svelte";
  import moment from "moment";
  import { writable } from "svelte/store";
  export let gigs, calendarGigs, currentCalendarMonth, userInstruments, signupGigs;

  $: reloadSignupGigs(gigs);
  function reloadSignupGigs(gigs) {
    signupGigs = Object.fromEntries(
      gigs.map(gig => (gig.id in signupGigs ? [gig.id, writable(mergeDeep(signupGigs[gig.id], gig))] : [])),
    );
  }
  let allUpcoming = gigs;
  $: currentCalendarMonthMoment = moment(currentCalendarMonth, "YYYY-MM");
  let { session } = stores();
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

  const display = toDisplay => {
    if (toDisplay === "byMonth") {
      gigs = calendarGigs[currentCalendarMonth];
    }
    if (toDisplay === "allUpcoming") {
      gigs = allUpcoming;
    }
    displaying = toDisplay;
  };

  $: currentCalendarMonth && display(displaying);

  let gotoMonth = n => async () => {
    let newMonth = moment(currentCalendarMonth, "YYYY-MM")
      .add(n, "month")
      .format("YYYY-MM");
    if (!(newMonth in calendarGigs)) {
      let res_gig_2 = await $client.query({
        query: QueryMultiGigDetails($session.hasuraRole),
        variables: {
          where: {
            _or: [
              {
                date: {
                  _gte: moment(newMonth, "YYYY-MM")
                    .startOf("month")
                    .format(),
                  _lte: moment(newMonth, "YYYY-MM")
                    .endOf("month")
                    .format(),
                },
              },
              {
                arrive_time: {
                  _gte: moment(newMonth, "YYYY-MM")
                    .startOf("month")
                    .format(),
                  _lte: moment(newMonth, "YYYY-MM")
                    .endOf("month")
                    .format(),
                },
              },
              {
                finish_time: {
                  _gte: moment(newMonth, "YYYY-MM")
                    .startOf("month")
                    .format(),
                  _lte: moment(newMonth, "YYYY-MM")
                    .endOf("month")
                    .format(),
                },
              },
            ],
          },
          order_by: { date: "asc" },
        },
      });
      calendarGigs[newMonth] = res_gig_2.data.cucb_gigs;
      calendarGigs[newMonth] = calendarGigs[newMonth].sort(
        (gigA, gigB) => new Date(gigA.sort_date) - new Date(gigB.sort_date),
      );
    }
    currentCalendarMonth = newMonth;
  };
  let gotoPreviousCalendarMonth = gotoMonth(-1);
  let gotoNextCalendarMonth = gotoMonth(1);
</script>

<style>
  .heading {
    display: grid;
    grid-template-columns: 1fr 21em;
    grid-gap: 1em;
    margin-bottom: 1em;
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
<!-- TODO deal with draft gigs -->
<div class="heading">
  <div class="information">
    <h1>Gig Diary</h1>

    <p>This is a listing of all our gigs. Some things you may be interested in are:</p>
    <ul>
      <li>
        <a href="/members/gigs/help">How to use the gig diary</a>
      </li>
      <li>
        Specifically,&nbsp;
        <a href="/members/gigs/help#calendar-feeds">how to set-up a calendar feed</a>
        which automatically updates with the gigs you are on the lineup for
      </li>
      <li>
        <a href="/members/gigs/venues">The venues we've played at</a>
      </li>
      <li>
        <a href="/members/gigs/venues">The people associated with the band</a>
      </li>
    </ul>
  </div>
  <div class="calendar">
    <Calendar
      gigs="{calendarGigs[currentCalendarMonth]}"
      displayedMonth="{currentCalendarMonthMoment}"
      startDay="{$calendarStartDay}"
      on:clickPrevious="{gotoPreviousCalendarMonth}"
      on:clickNext="{gotoNextCalendarMonth}"
    />
    <p>Display:</p>
    <ul>
      <li>
        {#if displaying === 'allUpcoming'}
          All upcoming gigs (currently shown)
        {:else}
          <span class="link" on:click="{() => display('allUpcoming')}">All upcoming gigs</span>
        {/if}
      </li>
      <li>
        {#if displaying === 'byMonth'}
          Gigs by month (currently shown)
        {:else}
          <span class="link" on:click="{() => display('byMonth')}">Gigs by month</span>
        {/if}
      </li>
    </ul>
  </div>
</div>

{#each gigs as gig (gig.id)}
  {#if gig.id in signupGigs}
    <Summary {gig} signupGig="{signupGigs[gig.id]}" {userInstruments} linkHeading="{true}" />
  {:else}
    <Summary {gig} {userInstruments} linkHeading="{true}" />
  {/if}
{:else}No gigs to display{/each}
