<script lang="ts">
  import { themeName } from "../../../../view";
  import tippy from "tippy.js";
  import "tippy.js/dist/tippy.css";
  import { onMount } from "svelte";
  import type { PageData } from "./$types";
  export let data: PageData;
  let { canEditGigs, calendarLinks, scheme, host } = data;
  let allCalendarTippy, myCalendarTippy;
  onMount(() => {
    const args = {
      content: "Copied to clipboard",
      trigger: "none",
      arrow: false,
    };
    allCalendarTippy = tippy(document.querySelector("#allCalendarButton"), args);
    myCalendarTippy = tippy(document.querySelector("#myCalendarButton"), args);
  });
  let runningTimer;
  console.log(calendarLinks);

  interface CalendarLinks {
    allgigs: string;
    mygigs: string;
  }
  function copyAllGigLink() {
    navigator.clipboard.writeText(`${scheme}://${host}${calendarLinks.allgigs}`);
    myCalendarTippy?.hide();
    allCalendarTippy?.show();
    window.clearTimeout(runningTimer);
    runningTimer = window.setTimeout(() => allCalendarTippy?.hide(), 2000);
  }
  function copyMyGigLink() {
    navigator.clipboard.writeText(`${scheme}://${host}${calendarLinks.mygigs}`);
    allCalendarTippy?.hide();
    myCalendarTippy?.show();
    window.clearTimeout(runningTimer);
    runningTimer = window.setTimeout(() => myCalendarTippy?.hide(), 2000);
  }
</script>

<style lang="scss">
  @import "../../../../sass/themes.scss";
  table,
  td {
    border: 1px solid black;
  }
  tr :first-child {
    font-weight: bold;
  }
  .error_box {
    margin: 0.5em 0;
    box-sizing: border-box;
    @include themeifyThemeElement($themes) {
      background: themed("warningBackground");
      color: themed("warningColor");
      border: 1px solid themed("warningBorderColor");
    }
    text-align: center;
    padding: 0.15em 0.25em;
  }
  .temporary-message {
    position: absolute;
    display: flex;
    justify-content: center;
    padding: 0.25em 0.5em;
    background: var(--background);
    bottom: 0em;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    border-radius: 5px;
    width: 150px;
    box-shadow: 0 0 4px var(--form_color);
  }
</style>

<h1>Gig Diary Help</h1>

<p>
  This page has lots of information about using the CUCB gig diary. Don't forget you can always use the webmaster
  contact details at the bottom of the page!
</p>

<h2>Viewing the diary</h2>

<p>
  By default, the diary displays a listing of upcoming ceilidhs in date order (it filters out those in the past). It
  also displays all of the details associated with each.
</p>

<p>You can change which ceilidhs are displayed using the calendar and drop down list box; and this works as follows:</p>

<table>
  <tr><td>All Upcoming:</td><td>The default choice - shows all future ceilidhs.</td></tr>
  <tr><td>By Month:</td><td>Show all gigs in the month selected in the calendar.</td></tr>
  <!-- <tr><td>My Gigs</td><td>Shows only those ceilidhs which include you on the lineup.</td></tr>
  <tr><td>Public Only</td><td>Shows only those ceilidhs which are visible to the public.</td></tr> -->
</table>

<p>**TODO** there were more available previously, I should implement them!</p>

<h2>The calendar</h2>

<p>
  The calendar highlights any days with events using a coloured box for each event, and clicking on that date shows all
  events that day. A key is available below the calendar. This updates to show only the gig types currently shown in the
  calendar view. You can go back and forth through the months using the 'Next' and 'Prev' buttons above the calendar, or
  the drop-down date selectors.
</p>

{#if canEditGigs}
  <h2>Adding new Ceilidhs</h2>

  <div class="error_box theme-{$themeName}">
    Apologies, this information is hilariously outdated. -- Carl Turner, 2014
  </div>
  <p>
    If you are entitled, a link will appear just above the list that you can click to add a Ceilidh. You will be
    presented with a form to fill in with the details for that Ceilidh. They are as follows:
  </p>
  <table>
    <tr
      ><td>Title</td>
      <td
        >A title for the Ceilidh to appear on the calendar - e.g. 'SCA Charity Ceilidh'. This must be filled in, and
        appears on the public section of the diary if it is a public Ceilidh.</td
      ></tr
    >
    <tr
      ><td>Venue</td>
      <td
        >The venue for the Ceilidh. This must be filled in, and appears on the public section of the diary if it is a
        public Ceilidh.</td
      ></tr
    >
    <tr
      ><td>Time</td>
      <td
        >The time of the Ceilidh. This is when the participants are supposed to arrive, rather than the band - see
        later. This must be filled in, and appears on the public section of the diary if it is a public Ceilidh.</td
      ></tr
    >
    <tr
      ><td>Date</td>
      <td
        >The date of the ceildih. This must be filled in, and appears on the public section of the diary if it is a
        public Ceilidh. It also controls where the Ceilidh appears on the calendar.</td
      ></tr
    >
    <tr
      ><td>Public Tickbox</td>
      <td
        >Ticking this box denotes this as a public Ceilidh, and causes it to appear in the public diary page. Only the
        title, summary, date, time and venue are viewable by the public.</td
      ></tr
    >
    <tr
      ><td>Summary</td>
      <td
        >A description of the Ceilidh. This is optional, but is useful for adding any extra notes that the public should
        see, such as a ticket price.</td
      ></tr
    >
    <tr
      ><td>Finance</td>
      <td
        >Financial info - This is a text field that can be used for any notes regarding band finances (how much we are
        paid, etc)</td
      ></tr
    >
    <tr
      ><td>Equipment</td>
      <td
        >Band Member with responsibility for equipment. This can either be typed into the box, or selected from the drop
        down. After typing the names or selecting from the list, click 'Set' to use that name. If typing the name, you
        must type their first name exactly in order for the search function to work - otherwise it won't appear when
        that person select's 'By Equipment' from the drop-down list on the diary page. The search only goes by first
        name, and this may affect you if your name is Dave or Ellie. Can be left blank.</td
      ></tr
    >
    <tr
      ><td>Arrive and finish times</td>
      <td
        >Times ate which the band should arrive to set up, and an estimated finish time - eiher or both can be left
        blank.</td
      ></tr
    >
    <tr
      ><td>Contact</td>
      <td
        >Details for the contact for this ceildh - May Ball reps or whoever booked it. Can be a name, email address, or
        just blank.</td
      ></tr
    >
    <tr
      ><td>Other Notes</td>
      <td
        >Any other notes, visible only to logged in band members. Useful for things such as catching taxis/buses etc.
        Can be blank.</td
      ></tr
    >
    <tr
      ><td>Lineup</td>
      <td
        >Using the controls in this blue box you can assemble a lineup for the Ceilidh. Select each band member from the
        dropdown list; once you have done that, a number of checkboxes will appear which allow you to select which
        instrument(s) you would like this band member to play. If a blank checkbox appears, or the instrument is not
        shown but you know they play it, you can add it to their profile in the <a href="/members/user/" target="_blank"
          >Admin Control Panel</a
        >. You may select more than one instrument. Once you have selected instruments, click 'Add Band Member' to add
        them to the lineup. They should appear in the list, with a 'Remove' button next to them that does exactly what
        it says. Lineups can be edited at any time.</td
      ></tr
    >
  </table>
  <p>
    Once you have finished inputting your details, click on the 'Add gig' button at the bottom. You should see a
    confirmation message and then be taken back to the diary.
  </p>
  <hr />
{/if}

<!-- TODO test the link works from the gig calendar -->

<!-- https://stackoverflow.com/a/7335259 suggests using <a name="..."></a>Content instead of <h2 id="...">Content</h2>
This doesn't seem to be supported by SvelteKit (when clicking the link from the gig diary to the calendar feeds help)
we end up at the top of the page, so I'm using an id instead -->

<h2 id="calendar-feeds">Using Calendar Feeds</h2>

<p>
  In the instructions below, and in each individual event in the <a href="/members/gigs">gig diary</a>, you will find
  links to calendar feeds. What are these for, and how can you use them? Firstly, each different address links to a
  dynamically generated ".ics" file which contains information about the relevant events, from date, time and location
  to detailed information on the lineup and their instruments when available. Every time the file is opened/downloaded
  it has the most up-to-date information in it.
</p>

<div class="error_box theme-{$themeName}">
  <b>IMPORTANT NOTE:</b> If you download and open the calendar rather than copying and pasting the link, then you will only
  obtain a fixed snapshot of the calendar at that moment in time, and you will not get automatic updates when gigs are added
  or changed.
</div>

<p>
  How can you use it? One common thing you might want to do is <b>synchronize it with Google Calendar</b>. If you do
  this, all the relevant events will magically appear in your calendar, being refreshed about once a day (when Google
  deigns to do so). You can always toggle the visibility of the calendar within Google Calendar if you decide you only
  want this information some of the time. To do this, follow these steps:
</p>

<ol>
  <li>
    Open <a href="https://calendar.google.com" target="_blank">Google Calendar</a>. (This has to be done via a web
    interface and not an app).
  </li>
  <li>Find <em>Other calendars</em> at the left of the screen, and click the "+" icon next to it.</li>
  <li>Click <em>From URL</em></li>
  <li>
    Copy the relevant calendar link by clicking one of the buttons below.

    <p>
      <button on:click="{copyAllGigLink}" id="allCalendarButton">All gig calendar feed</button>
      <button on:click="{copyMyGigLink}" id="myCalendarButton">My gig calendar feed</button>
    </p>
  </li>
  <li>Paste the link into the <em>URL</em> box in Google Calendar, then click <em>Add Calendar</em>.</li>
  <li>
    Wait for a while. You should see a calendar appear beneath the <em>Other calendars</em> heading, and any events should
    appear in your calendar.
  </li>
  <li>
    You can now toggle the visibility of the calendar by clicking its name (similarly see sync and display options in
    mobile apps). Also, the drop-down menu by the calendar allows you to set the colour of the events in the calendar,
    delete the calendar, change its name, and set default reminders for the events.
  </li>
</ol>
