<script>
  import keyMap from "graphql/jsutils/keyMap";
  import moment from "moment";
  import { onMount } from "svelte";
  import { writable } from "svelte/store";
  import tippy from "tippy.js";
  import AnnotatedIcon from "../AnnotatedIcon.svelte";
  import TooltipText from "../TooltipText.svelte";
  export let gigs;
  export let displayedMonth = moment();

  let dayOffsets = {
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
    sun: 0,
  };
  let startDay = writable("mon");
  $: locale = moment.locale();
  $: dayOffset = dayOffsets[$startDay];
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
    $startDay &&
    daysInMonth(displayedMonth).map(week =>
      week.map(date => ({
        inCurrentMonth: date.month() === displayedMonth.month(),
        dayOfWeek: dayOfWeek(date),
        number: date.date(),
        tooltip: date.format(),
        moment: date,
        id: `calendar_date_${date.format("YYYYMMDD")}`,
        gigs: gigs.filter(gig => moment(gig.date, "YYYY-MM-DD").isSame(date, "day")),
      })),
    );
  $: console.log(weeks.map(week => week.map(day => day.gigs.map(gig => gig.title))));
</script>

<style>
  .different-month {
    filter: opacity(0.3);
    border-color: rgba(var(--accent_triple), calc(0.1 / 0.3));
  }

  .has-gigs {
    background: rgba(var(--accent_triple), 0.1);
  }

  table {
    border-spacing: 0;
    width: 100%;
  }

  th {
    background: rgba(var(--accent_triple), 0.1);
    font-family: var(--title);
    text-transform: capitalize;
    color: var(--accent);
  }

  th,
  td {
    width: 3em;
    padding: 0.2em 0em;
    margin: 0;
    box-sizing: border-box;
    user-select: none;
  }
  td {
    text-align: center;
    vertical-align: middle;
    border: 1px solid rgba(var(--accent_triple), 0.1);
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
</style>

<!-- <select bind:value="{$startDay}">
  {#each Object.keys(dayOffsets) as dayName}
    <option value="{dayName}">{dayName}</option>
  {/each}
</select> -->

<table>
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
          class:has-gigs="{day.gigs.length > 0}"
        >
          {#if day.gigs.length > 0}
            <TooltipText content="{day.gigs.map(gig => gig.title).join('\n')}">{day.number}</TooltipText>
          {:else}{day.number}{/if}
        </td>
      {/each}
    </tr>
  {/each}
</table>
