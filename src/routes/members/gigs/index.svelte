<script context="module">
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
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }

    return mergeDeep(target, ...sources);
  }

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
          order_by: [{ arrive_time: "asc" }, { date: "asc" }],
          // TODO ^^^ fix the sorting, we want these to effectively be interleaved
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
        variables: { where: { date: { _gte: "now()" } } },
      });
    } catch (e) {
      await handleErrors.bind(this)(e, session);
      return;
    }

    if (res_gig && res_gig.data && res_gig.data.cucb_gigs) {
      let gigs = res_gig.data.cucb_gigs;
      let signup_dict = {};
      let signups = res_signup.data.cucb_gigs;
      for (let gig of signups) {
        signup_dict[gig.id] = gig;
      }
      for (let gig of gigs) {
        if (gig.id in signup_dict) {
          gig = mergeDeep(signup_dict[gig.id], gig);
        }
      }

      return { gigs, userInstruments: res_signup.data.cucb_users_instruments, calendarGigs: res_gig_2.data.cucb_gigs };
    } else {
      this.error(500, "Couldn't retrieve gig details");
      return;
    }
  }
</script>

<script>
  import { makeTitle } from "../../../view";
  import { makeClient, handleErrors } from "../../../graphql/client";
  import { QueryMultiGigDetails, QueryMultiGigSignup } from "../../../graphql/gigs";
  import Summary from "../../../components/Gigs/Summary.svelte";
  import Calendar from "../../../components/Gigs/Calendar.svelte";
  import moment from "moment";
  export let gigs, calendarGigs;
</script>

<style>
  .heading {
    display: grid;
    grid-template-columns: 1fr 21em;
    grid-gap: 1em;
    margin-bottom: 1em;
  }

  .calendar {
    margin-top: 0.5em;
  }

  .heading p:first-of-type {
    margin-top: 0;
  }

  .calendar {
    justify-self: end;
  }

  @media only screen and (max-width: 600px) {
    .heading {
      grid-template-columns: 1fr;
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
  <div>
    <h1>Gig Diary</h1>

    <p>
      This is a listing of all our gigs - for help on how to use it, click here. In particular, see here to find out how
      to subscribe to either the all gig calendar feed, which will allow you to sync all gigs into your calendar, or
      your very own personalized calendar feed with just the gigs you're playing! Click here to investigate the venues
      we've played at, and here to investigate people associated to the band.
    </p>
  </div>
  <div class="calendar">
    <Calendar gigs="{calendarGigs}" />
  </div>
</div>

{#each gigs as gig}
  <Summary {gig} signupGig="{gig}" linkHeading="{true}" />
{:else}No gigs to display{/each}
