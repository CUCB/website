<script>
  import keyMap from "graphql/jsutils/keyMap";
  import moment from "moment";
  import { createEventDispatcher, onMount } from "svelte";
  import { writable } from "svelte/store";
  import tippy from "tippy.js";
  import AnnotatedIcon from "../AnnotatedIcon.svelte";
  import { goto } from "@sapper/app";
  import TooltipText from "../TooltipText.svelte";
  export let gigs;
  export let displayedMonth = moment();
  export let startDay = "mon";
  let dispatchEvent = createEventDispatcher();
  let dayOffsets = {
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
    sun: 0,
  };
  $: locale = moment.locale();
  $: dayOffset = dayOffsets[startDay || "mon"];
  $: moment.updateLocale(locale, {
    week: {
      dow: dayOffset,
      doy: 4,
    },
  }) && displayedMonth.locale(locale);

  $: rotate = array => [...array.slice(dayOffset - 1), ...array.slice(0, dayOffset - 1)];

  $: dayOfWeek = date => (moment(date).isoWeekday() - 1 + dayOffset) % 7;

  function daysInMonth(month) {
    let currentDate = moment(month)
      .startOf("month")
      .startOf("week");
    let currentWeek = [...Array(7).keys()].map(offset => moment(currentDate).add(offset, "days"));
    let result = [currentWeek];
    currentDate = currentDate.add(1, "week");
    for (; currentDate.month() === moment(month).month(); currentDate = currentDate.add(1, "week")) {
      currentWeek = [...Array(7).keys()].map(offset => moment(currentDate).add(offset, "days"));
      result.push(currentWeek);
    }
    return result;
  }
  $: weeks =
    startDay &&
    daysInMonth(displayedMonth).map(week =>
      week.map(date => ({
        inCurrentMonth: date.month() === displayedMonth.month(),
        dayOfWeek: dayOfWeek(date),
        number: date.date(),
        tooltip: date.format(),
        moment: date,
        id: `calendar_date_${date.format("YYYYMMDD")}`,
        gigs: gigs.filter(
          gig =>
            moment(gig.date, "YYYY-MM-DD").isSame(date, "day") ||
            ((gig.type === "calendar" || gig.date === null) &&
              moment(gig.arrive_time).isSameOrBefore(date, "day") &&
              moment(gig.finish_time).isSameOrAfter(date, "day")),
        ),
      })),
    );

  let prefixGigType = gig => {
    if (gig.type.code === "gig_cancelled") {
      return `Cancelled: ${gig.title}`;
    } else if (gig.type.code === "gig_enquiry") {
      return `Enquiry: ${gig.title}`;
    } else if (gig.type.code === "kit") {
      return `Kit hire: ${gig.title}`;
    } else if (gig.type.code === "calendar") {
      return `Calendar date: ${gig.title}`;
    } else if (gig.type.code === "gig") {
      if (gig.admins_only) {
        return `Hidden gig: ${gig.title}`;
      } else {
        return `Gig: ${gig.title}`;
      }
    } else {
      return gig.title;
    }
  };
</script>

<style>
  h3 {
    text-align: center;
  }
  .different-month {
    filter: opacity(0.3);
    border-color: rgba(var(--accent_triple), calc(0.1 / 0.3));
  }

  table {
    border-spacing: 0;
    width: 100%;
  }

  th {
    background: rgba(var(--accent_triple), 0.1);
    padding: 0.2em 0em;
    font-family: var(--title);
    text-transform: capitalize;
    color: var(--accent);
  }

  th,
  td {
    width: 3em;
    margin: 0;
    box-sizing: border-box;
    user-select: none;
  }
  td {
    text-align: center;
    padding: 0.4em 0.2em;
    vertical-align: middle;
    border: 1px solid rgba(var(--accent_triple), 0.1);
    position: relative;
  }

  :global(.calendar-entry .tooltip-text.tooltip-text) {
    display: flex;
    border-bottom: none;
    justify-content: center;
    align-items: center;
  }

  @media (max-width: 600px) {
    td {
      height: 3em;
    }
  }

  .events {
    position: absolute;
    top: 0px;
    right: 0px;
    left: 0px;
    bottom: 0px;
    margin: 2px;
    display: flex;
    justify-content: stretch;
    flex-direction: column;
    filter: opacity(0.7);
    z-index: -1;
  }

  .events div {
    box-shadow: inset 0 0 8px var(--shadow);
    width: 100%;
    height: 100%;
  }

  .events :first-child {
    border-top-left-radius: 3px;
    border-top-right-radius: 3px;
  }

  .events :last-child {
    border-bottom-left-radius: 3px;
    border-bottom-right-radius: 3px;
  }

  .gigtype-gig {
    --shadow: var(--accent);
  }

  .gigtype-gig_cancelled {
    --shadow: var(--form_color);
  }

  .gigtype-gig_enquiry {
    --shadow: var(--neutral);
  }

  .gigtype-calendar {
    --shadow: var(--negative);
  }

  .gigtype-gig.admins-only {
    --shadow: var(--blue_gig);
  }

  .gigtype-kit {
    --shadow: var(--kit_hire);
  }

  .today {
    color: var(--accent);
  }

  .title-bar {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    justify-content: center;
    margin: 0.5em 0;
  }

  .title-bar button.left {
    margin-right: auto;
  }

  .title-bar button.right {
    margin-left: auto;
  }

  .title-bar button {
    padding: 0.1em 0.5em;
    flex-basis: 200px;
  }

  .title-bar h3 {
    flex-shrink: 0;
    margin: 0;
  }
</style>

<div class="title-bar">
  <button on:click="{() => dispatchEvent('clickPrevious')}" class="left">Prev</button>
  <h3>{displayedMonth.format('MMMM YYYY')}</h3>
  <button on:click="{() => dispatchEvent('clickNext')}" class="right">Next</button>
</div>
<table>
  <!--TODO blue gigs don't yet work!!-->
  <tr>
    {#each rotate(Object.keys(dayOffsets)) as dayName}
      <th>{dayName}</th>
    {/each}
  </tr>
  {#each weeks as week}
    <tr>
      {#each week as day (day.id)}
        <td
          class:different-month="{!day.inCurrentMonth}"
          id="{day.id}"
          class="calendar-entry"
          class:today="{day.moment.isSame(moment(), 'day')}"
        >
          {#if day.gigs.length > 0}
            <TooltipText content="{day.gigs.map(prefixGigType).join('\n')}">{day.number}</TooltipText>
          {:else}{day.number}{/if}
          <div class="events">
            {#each day.gigs as gig}
              <div
                class="gigtype-{gig.type.code}"
                class:admins-only="{gig.admins_only}"
                on:click="{() => goto(`/members/gigs/${gig.id}`)}"
              ></div>
            {/each}
          </div>
        </td>
      {/each}
    </tr>
  {/each}
</table>
