<script context="module">
  export async function preload(_page, session) {
    let client = makeClient(this.fetch);
    let clientCurrentUser = makeClient(this.fetch, { role: "current_user" });

    let res_gig, res_signup, res_gig_2;
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
                  _gte: dayjs()
                    .startOf("month")
                    .format(),
                  _lte: dayjs()
                    .endOf("month")
                    .format(),
                },
              },
              {
                arrive_time: {
                  _gte: dayjs()
                    .startOf("month")
                    .format(),
                  _lte: dayjs()
                    .endOf("month")
                    .format(),
                },
              },
              {
                finish_time: {
                  _gte: dayjs()
                    .startOf("month")
                    .format(),
                  _lte: dayjs()
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

      let currentCalendarMonth = dayjs().format("YYYY-MM");

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
  import { makeTitle, calendarStartDay, themeName } from "../../../view";
  import { makeClient, handleErrors, client } from "../../../graphql/client";
  import { QueryMultiGigDetails, QueryMultiGigSignup } from "../../../graphql/gigs";
  import { stores } from "@sapper/app";
  import Summary from "../../../components/Gigs/Summary.svelte";
  import Calendar from "../../../components/Gigs/Calendar.svelte";
  import dayjs from "dayjs";
  import { writable } from "svelte/store";
  export let gigs, calendarGigs, currentCalendarMonth, userInstruments, signupGigs;
  $: reloadSignupGigs(gigs);
  function reloadSignupGigs(gigs) {
    let newlyMerged = gigs.map(gig =>
      gig.id in signupGigs && typeof signupGigs[gig.id].subscribe === "undefined"
        ? [
            gig.id,
            writable({
              ...mergeDeep(signupGigs[gig.id], gig),
              lineup: signupGigs[gig.id].lineup.filter(person => person.user_id),
            }),
          ]
        : [],
    );
    signupGigs = Object.fromEntries([...Object.entries(signupGigs), ...newlyMerged]);
  }
  let allUpcoming = gigs;
  let { session } = stores();
  let drafts = gigs.filter(gig => gig.type.code === "draft");
  $: currentCalendarMonthDayjs = dayjs(currentCalendarMonth, "YYYY-MM");
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

  let gotoDate = newDate => async () => {
    if (!(newDate in calendarGigs)) {
      let res_gig_2 = await $client.query({
        query: QueryMultiGigDetails($session.hasuraRole),
        variables: {
          where: {
            _or: [
              {
                date: {
                  _gte: dayjs(newDate, "YYYY-MM")
                    .startOf("month")
                    .format(),
                  _lte: dayjs(newDate, "YYYY-MM")
                    .endOf("month")
                    .format(),
                },
              },
              {
                arrive_time: {
                  _gte: dayjs(newDate, "YYYY-MM")
                    .startOf("month")
                    .format(),
                  _lte: dayjs(newDate, "YYYY-MM")
                    .endOf("month")
                    .format(),
                },
              },
              {
                finish_time: {
                  _gte: dayjs(newDate, "YYYY-MM")
                    .startOf("month")
                    .format(),
                  _lte: dayjs(newDate, "YYYY-MM")
                    .endOf("month")
                    .format(),
                },
              },
            ],
          },
          order_by: { date: "asc" },
        },
      });
      calendarGigs[newDate] = res_gig_2.data.cucb_gigs;
      calendarGigs[newDate] = calendarGigs[newDate].sort(
        (gigA, gigB) => new Date(gigA.sort_date) - new Date(gigB.sort_date),
      );
    }
    currentCalendarMonth = newDate;
    gigs = gigs;
  };
  $: gotoPreviousCalendarMonth = gotoDate(
    dayjs(currentCalendarMonth, "YYYY-MM")
      .subtract(1, "month")
      .format("YYYY-MM"),
  );
  $: gotoNextCalendarMonth = gotoDate(
    dayjs(currentCalendarMonth, "YYYY-MM")
      .add(1, "month")
      .format("YYYY-MM"),
  );
  $: changeCalendarDate = async event => {
    if (event.detail.month !== undefined) {
      await gotoDate(
        dayjs(currentCalendarMonth, "YYYY-MM")
          .month(event.detail.month)
          .format("YYYY-MM"),
      )();
    }
    if (event.detail.year !== undefined) {
      await gotoDate(
        dayjs(currentCalendarMonth, "YYYY-MM")
          .year(event.detail.year)
          .format("YYYY-MM"),
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
        {dayjs(gig.posting_time).format('HH:MM, DD/MM')}
        by
        {(gig.user && gig.user.first) || 'someone?'}],
      {/each}
      so please don't leave them here forever
    {/if}
  </div>
  <div class="calendar theme-{$themeName}">
    <Calendar
      gigs="{calendarGigs[currentCalendarMonth]}"
      displayedMonth="{currentCalendarMonthDayjs}"
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
