<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { goto } from "$app/navigation";
  import TooltipText from "../TooltipText.svelte";
  import { Set, Map } from "immutable";
  import { themeName } from "../../view";
  import { DateTime, Settings } from "luxon";
  import Select from "../Forms/Select.svelte";
  import type { GigSummary } from "../../routes/members/types";
  import { rotateBy } from "./array";

  interface GigType {
    code: string;
    title: string;
  }
  interface CalendarGig {
    id: string;
    type: GigType;
    admins_only?: boolean;
    date?: Date | null | undefined;
    arrive_time?: Date | null | undefined;
    finish_time?: Date | null | undefined;
  }

  Settings.defaultZoneName = "Europe/London";
  Settings.defaultLocale = "en-gb";

  let dayOffsets = {
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
    sun: 0,
  } as const;
  type Day = keyof typeof dayOffsets;

  export let gigs: CalendarGig[];
  export let displayedMonth = DateTime.local();
  export let startDay: Day = "mon";
  let dispatchEvent = createEventDispatcher();
  let showKey = false;
  let showSelection = false;

  function generateKeyItems(gigs: CalendarGig[]): (GigType & { admins_only?: boolean })[] {
    let types = Set(gigs.filter((gig) => gig.type.code !== "gig").map((gig) => Map({ ...gig.type })));
    let standardOrHiddenGigs = Set(
      gigs.filter((gig) => gig.type.code === "gig").map((gig) => Map({ ...gig.type, admins_only: gig.admins_only })),
    );
    return [...types.toJS(), ...standardOrHiddenGigs.toJS()] as (GigType & { admins_only?: boolean })[];
  }

  $: keyItems = generateKeyItems(gigs);
  $: dayOffset = dayOffsets[startDay || "mon"];
  $: startOfWeek = function (date: DateTime) {
    const day = date.weekday % 7; // convert to 0=sunday .. 6=saturday
    const dayAdjust = day >= dayOffset ? -day + dayOffset : -day + dayOffset - 7;
    return date.plus({ days: dayAdjust });
  };

  $: rotate = rotateBy(dayOffset);

  $: dayOfWeek = (date: DateTime) => (date.weekday - 1 + dayOffset) % 7;

  function daysInMonth(month: DateTime) {
    let currentDate = startOfWeek(month.startOf("month"));
    let currentWeek = [...Array(7).keys()].map((offset) => currentDate.plus({ days: offset }));
    let result = [currentWeek];
    currentDate = currentDate.plus({ weeks: 1 });
    for (; currentDate.month === month.month; currentDate = currentDate.plus({ weeks: 1 })) {
      currentWeek = [...Array(7).keys()].map((offset) => currentDate.plus({ days: offset }));
      result.push(currentWeek);
    }
    return result;
  }
  $: weeks =
    startDay &&
    dayOffset !== undefined &&
    daysInMonth(displayedMonth).map((week) =>
      week.map((date) => ({
        inCurrentMonth: date.month === displayedMonth.month,
        dayOfWeek: dayOfWeek(date),
        number: date.day,
        tooltip: date.toISO(),
        luxonDate: date,
        id: `calendar_date_${date.toFormat("yyyyLLdd")}`,
        gigs: gigs.filter(
          (gig) =>
            (gig.date && DateTime.fromJSDate(gig.date).hasSame(date, "day")) ||
            ((gig.type.code === "calendar" || gig.date === null) &&
              gig.arrive_time &&
              DateTime.fromJSDate(gig.arrive_time).startOf("day") <= date.startOf("day") &&
              gig.finish_time &&
              DateTime.fromJSDate(gig.finish_time).startOf("day") >= date.startOf("day")),
        ),
      })),
    );

  let prefixGigType = (gig: GigSummary) => {
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

  function selectableMonths() {
    return [...Array(12).keys()];
  }

  function selectableYears() {
    let start = displayedMonth.minus({ years: 10 }).year;
    return [...Array(20).keys()].map((x) => x + start);
  }

  function changeMonth(e: Event & { target: HTMLSelectElement }) {
    dispatchEvent("changeDate", { month: e.target.value });
  }

  function changeYear(e: Event & { target: HTMLSelectElement }) {
    dispatchEvent("changeDate", { year: e.target.value });
  }
</script>

<style lang="scss">
  @import "../../sass/themes.scss";

  @function shadow($color) {
    @return inset 0 0 8px $color;
  }

  h3 {
    text-align: center;
  }
  .different-month {
    filter: opacity(0.3);
    @include themeify($themes) {
      border-color: rgba(themed("accent"), calc(0.1 / 0.3));
      border-color: rgba(var(--accent_triple), calc(0.1 / 0.3));
    }
  }

  table {
    border-spacing: 0;
    width: 100%;
  }

  th {
    @include themeify($themes) {
      background: rgba(themed("accent"), 0.1);
      background: rgba(var(--accent_triple), 0.1);
      color: themed("accent");
      color: var(--accent);
    }
    font-family: var(--title);
    padding: 0.2em 0em;
    text-transform: capitalize;
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
    @include themeify($themes) {
      border: 1px solid rgba(themed("accent"), 0.1);
      border: 1px solid rgba(var(--accent_triple), 0.1);
    }
    position: relative;
  }

  .calendar-entry :global(.tooltip-text) {
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

  .gigtype-gig_enquiry {
    @include themeifyThemeElement($themes) {
      &.calendar-entry,
      &.key-entry::before {
        box-shadow: shadow(themed("neutral"));
      }
    }
  }
  .gigtype-gig {
    @include themeifyThemeElement($themes) {
      &.calendar-entry,
      &.key-entry::before {
        box-shadow: shadow(themed("accent"));
        box-shadow: shadow(var(--accent));
      }
    }
  }
  .gigtype-gig_cancelled {
    @include themeifyThemeElement($themes) {
      &.calendar-entry,
      &.key-entry::before {
        box-shadow: shadow(themed("formColor"));
      }
    }
  }

  .gigtype-calendar {
    @include themeifyThemeElement($themes) {
      &.calendar-entry,
      &.key-entry::before {
        box-shadow: shadow(themed("negative"));
      }
    }
  }

  .gigtype-gig.admins-only {
    @include themeifyThemeElement($themes) {
      &.calendar-entry,
      &.key-entry::before {
        box-shadow: shadow(themed("blueGig"));
      }
    }
  }

  .gigtype-kit {
    @include themeifyThemeElement($themes) {
      &.calendar-entry,
      &.key-entry::before {
        box-shadow: shadow(themed("kitHire"));
      }
    }
  }

  .today {
    @include themeifyThemeElement($themes) {
      font-weight: bolder;
      color: themed("accent");
      color: var(--accent);
    }
  }

  .title-bar {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    justify-content: center;
    margin: 0.5em 0;
  }

  .title-bar .left {
    margin-right: auto;
  }

  .title-bar .right {
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

  .key.hidden {
    max-height: 0;
    opacity: 0;
    transition: 0.3s all linear;
    transition-delay: 0.1s;
  }

  .key {
    max-height: calc(6 * 3em + 4em);
    opacity: 1;
    transition: 0.3s all linear;
    overflow: hidden;
    margin-bottom: 0em;
  }

  .key ul {
    padding-left: 0.5em;
    margin-top: 0;
  }

  .key.hidden li {
    opacity: 0;
  }

  .key li {
    opacity: 1;
    transition: 0.3s all linear;
    display: flex;
    align-items: center;
  }

  .key li::before {
    display: flex;
    content: "24";
    width: 2.5em;
    height: 2em;
    border-radius: 3px;
    margin: 0.25em 0;
    align-items: center;
    justify-content: center;
    margin-right: 0.5em;
  }

  .key-title {
    margin: 0;
  }

  button.key-toggle {
    margin: 0.5em auto;
    display: block;
  }

  .key:not(.hidden) li {
    transition-delay: var(--delay);
  }

  .key.hidden li {
    transition-delay: 0;
  }
</style>

<div class="title-bar">
  <button on:click="{() => dispatchEvent('clickPrevious')}" class="left" data-test="gigcalendar-previous-month">
    Prev
  </button>
  <h3 data-test="gigcalendar-displayed-date">{displayedMonth.toFormat("LLLL yyyy")}</h3>
  <div class="right">
    <button on:click="{() => (showSelection = !showSelection)}" title="Select month">
      <i class="las la-calendar"></i>
    </button>
    <button on:click="{() => dispatchEvent('clickNext')}" data-test="gigcalendar-next-month">Next</button>
  </div>
</div>
{#if showSelection}
  <div class="month-selector">
    <Select on:change="{changeMonth}">
      {#each selectableMonths() as month (month)}
        <option value="{month}" selected="{month === displayedMonth.month}">
          {DateTime.local().set({ month }).toFormat("LLLL")}
        </option>
      {/each}
    </Select>
    <Select on:change="{changeYear}">
      {#each selectableYears() as year (year)}
        <option value="{year}" selected="{year === displayedMonth.year}">{year}</option>
      {/each}
    </Select>
  </div>
{/if}
<table class="theme-{$themeName}">
  <tr>
    {#each rotate(Object.keys(dayOffsets)) as dayName}
      <th>{dayName}</th>
    {/each}
  </tr>
  {#if weeks}
    {#each weeks as week}
      <tr>
        {#each week as day (day.id)}
          <td
            class:different-month="{!day.inCurrentMonth}"
            id="{day.id}"
            class="calendar-entry theme-{$themeName}"
            class:today="{DateTime.local().hasSame(day.luxonDate, 'day')}"
          >
            {#if day.gigs.length > 0}
              <TooltipText content="{day.gigs.map(prefixGigType).join('\n')}">{day.number}</TooltipText>
            {:else}{day.number}{/if}
            <div class="events">
              {#each day.gigs as gig}
                <div
                  class="gigtype-{gig.type.code} theme-{$themeName} calendar-entry"
                  class:admins-only="{gig.admins_only}"
                  on:click="{() => goto(`/members/gigs/${gig.id}`)}"
                ></div>
              {/each}
            </div>
          </td>
        {/each}
      </tr>
    {/each}
  {/if}
</table>
<button class="key-toggle" on:click="{() => (showKey = !showKey)}">
  {#if !showKey}Show key{:else}Hide key{/if}
</button>
<div class="key" class:hidden="{!showKey}">
  <p class="key-title">Key:</p>
  <ul class="key">
    {#each keyItems as item, n}
      <li
        style="--delay: {n * 0.1}s"
        class="gigtype-{item.code} theme-{$themeName} key-entry"
        class:admins-only="{item.admins_only}"
      >
        {#if item.admins_only && item.code === "gig"}Hidden Gig{:else}{item.title}{/if}
      </li>
    {:else}No gigs visible on calendar{/each}
  </ul>
</div>
