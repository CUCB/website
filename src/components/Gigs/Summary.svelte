<script>
  import Signup from "./Signup.svelte";
  import SignupSummary from "./SignupSummary.svelte";
  import TooltipText from "../TooltipText.svelte";
  import Lineup from "./Lineup.svelte";
  import { writable } from "svelte/store";
  import { themeName, suffix } from "../../view";
  import { session } from "$app/stores";
  import { DateTime, Settings } from "luxon";
  Settings.defaultZoneName = "Europe/London";

  export let gig = {},
    signupGig = writable(undefined),
    userInstruments = undefined,
    displayLinks = true,
    signups = undefined;
  export let linkHeading = false;
  let showSignup = false;
  let showDetails = !linkHeading;
  const formatCalendarDate = (date) => date.toFormat("cccc d") + suffix(date.day) + date.toFormat(" LLLL yyyy");
  const formatTimeOnly = (date) => date.toFormat("HH:mm");
  const formatTimeWithDate = (date) => date.toFormat("HH:mm (cccc d") + suffix(date.day) + date.toFormat(" LLL)");
  const midnight = { hour: 0, minute: 0, second: 0 };
  $: arrive_time = gig.arrive_time && DateTime.fromISO(gig.arrive_time);
  $: finish_time = gig.finish_time && DateTime.fromISO(gig.finish_time);
  $: date = gig.date && DateTime.fromISO(gig.date);
  $: clients = gig.contacts.filter((c) => c.client);
  $: callers = gig.contacts.filter((c) => c.calling);
  signups = signups || gig.signupSummary;
</script>

<style lang="scss">
  @import "../../sass/themes.scss";

  @function shadow($color) {
    @return 0px 0px 5px 0px $color;
  }
  .gigtype-gig_enquiry {
    @include themeifyThemeElement($themes) {
      box-shadow: shadow(themed("neutral"));
    }
  }
  .gigtype-gig {
    @include themeifyThemeElement($themes) {
      box-shadow: shadow(themed("accent"));
      box-shadow: shadow(var(--accent));
    }
  }
  .gigtype-gig_cancelled {
    @include themeifyThemeElement($themes) {
      box-shadow: shadow(themed("formColor"));
    }
  }

  .gigtype-calendar {
    @include themeifyThemeElement($themes) {
      box-shadow: shadow(themed("negative"));
    }
  }

  .gigtype-gig.admins-only {
    @include themeifyThemeElement($themes) {
      box-shadow: shadow(themed("blueGig"));
    }
  }

  .gigtype-kit {
    @include themeifyThemeElement($themes) {
      box-shadow: shadow(themed("kitHire"));
    }
  }
  .gig-summary {
    display: block;
    padding: 1em;
    border-radius: 5px;
    max-width: calc(100%-10px);
    margin: 0 auto 2em auto;
    box-sizing: border-box;
    word-break: break-word;
    transition: box-shadow 0.25s;
  }

  ul.tasks {
    display: flex;
    flex-direction: column;
    margin: 1em 0;
    list-style-type: none;
  }

  .gig-summary > :last-child {
    margin-bottom: 0;
  }

  .gig-timings > p {
    margin: 0.25em 0;
  }

  h2 {
    display: grid;
    grid-template-columns: 1fr auto;
  }

  h2 a {
    justify-self: flex-start;
  }

  .admin-notes,
  .band-notes {
    white-space: pre-wrap;
    display: block;
    margin: 1em 0;
  }

  .summary-text {
    display: block;
    margin: 1em 0;
  }

  button.signup {
    float: right;
    margin-right: 1em;
    margin-top: 1em;
  }

  button.cancelled-detail {
    display: block;
    margin: auto;
    margin-top: 1em;
  }

  .gig-finance {
    font-style: italic;
  }

  .gig-finance b {
    font-style: normal;
  }

  .gig-icons {
    margin-right: -0.3em;
  }

  .gigtype-gig_enquiry.permit-fade,
  .gigtype-gig_cancelled.permit-fade {
    filter: opacity(0.5);
    transition: all 0.3s linear;
  }

  .gigtype-gig,
  .gigtype-kit,
  .gigtype-calendar {
    transition: all 0.3s linear;
  }
  .gigtype-gig_enquiry:hover,
  .gigtype-gig_cancelled:hover,
  .gigtype-gig_enquiry:focus-within,
  .gigtype-gig_cancelled:focus-within {
    filter: opacity(1);
    transition: all 0.1s ease-in;
  }
  .gigtype-gig_enquiry h2 {
    grid-template-columns: auto 1fr auto;
  }
  .gigtype-gig_enquiry h2::before {
    content: "Enquiry:";
    margin-right: 0.25em;
    font-style: bold;
  }

  .gigtype-gig_cancelled h2 {
    grid-template-columns: auto 1fr auto;
  }
  .gigtype-gig_cancelled h2::before {
    content: "Cancelled:";
    margin-right: 0.25em;
    font-style: bold;
    text-decoration: none;
  }

  .gigtype-gig_cancelled:not(.details-visible) > :not(.main-detail) {
    display: none;
  }

  .gigtype-calendar ul.tasks {
    display: none;
  }

  .gigtype-kit ul.tasks .caller {
    display: none;
  }

  .gig-icons :global(*) {
    margin: 0 0.3em;
  }

  .color-positive {
    @include themeify($themes) {
      color: themed("positive");
    }
  }

  .color-negative {
    @include themeify($themes) {
      color: themed("negative");
    }
  }
</style>

{#if !showSignup}
  {#if $signupGig && $signupGig.allow_signups}
    <button class="signup" on:click="{() => (showSignup = !showSignup)}" data-test="show-signup-{gig.id}">
      Show signup
    </button>
  {/if}
  <div
    class="gig-summary gigtype-{gig.type.code} theme-{$themeName}"
    class:details-visible="{showDetails}"
    class:permit-fade="{linkHeading}"
    class:admins-only="{gig.admins_only}"
    data-test="gig-summary-{gig.id}"
  >
    <h2 class="main-detail">
      {#if linkHeading}
        <span> <a href="/members/gigs/{gig.id}">{gig.title}</a> </span>
        <!-- span for correct multiline underlining -->
      {:else}{gig.title}{/if}
      <div class="gig-icons">
        {#if gig.food_provided}
          <TooltipText content="Food provided"
            ><i class="las la-utensils" data-test="icon-food-provided"></i></TooltipText
          >
        {/if}
        {#if gig.admins_only}
          <TooltipText content="Hidden from normal users"
            ><i class="las la-eye-slash" data-test="icon-admins-only"></i></TooltipText
          >
        {/if}
        {#if gig.type.code === "calendar"}
          <TooltipText content="Calendar event"
            ><i class="las la-calendar" data-test="icon-calendar-event"></i></TooltipText
          >
        {/if}
      </div>
    </h2>
    {#if gig.venue}
      <h3 class="main-detail">
        <a href="/members/gigs/venue/{gig.venue.id}">
          {gig.venue.name}
          {#if gig.venue.subvenue}&nbsp;| {gig.venue.subvenue}{/if}
        </a>
      </h3>
    {/if}
    {#if displayLinks && ["webmaster", "president", "secretary", "treasurer", "gig_editor"].indexOf($session.hasuraRole) > -1}
      <a href="/members/gigs/{gig.id}/edit" class="main-detail">Edit gig</a>
    {/if}
    {#if displayLinks && ["webmaster", "president"].indexOf($session.hasuraRole) > -1 && gig.type.code === "gig"}
      <a href="/members/gigs/{gig.id}/edit-lineup" class="main-detail">Edit lineup</a>
    {/if}
    {#if gig.type.code !== "calendar" && gig.date}
      <p class="date main-detail">{formatCalendarDate(DateTime.fromISO(gig.date))}</p>
    {/if}
    {#if gig.allow_signups && signups}
      <SignupSummary signups="{signups}" />
    {/if}
    <div class="gig-timings">
      {#if gig.date}
        {#if gig.arrive_time}
          <p>
            <b>Arrive time:&nbsp;</b>
            {#if date && arrive_time.hasSame(date, "day")}
              {@html formatTimeOnly(arrive_time)}
            {:else if !date && finish_time && arrive_time.hasSame(finish_time, "day")}
              {@html formatTimeOnly(arrive_time)}
            {:else}
              {@html formatTimeWithDate(arrive_time)}
            {/if}
          </p>
        {/if}
        {#if gig.time}
          <p><b>Start time:&nbsp;</b> {DateTime.fromISO(`2020-01-01T${gig.time}`).toFormat("HH:mm")}</p>
        {/if}
        {#if finish_time}
          <p>
            <b>Finish time:&nbsp;</b>
            {#if date && finish_time.set(midnight).equals(date)}
              {@html formatTimeOnly(finish_time)}
            {:else if !date && arrive_time && finish_time.set(midnight).equals(arrive_time.set(midnight))}
              {@html formatTimeOnly(finish_time)}
            {:else}
              {@html formatTimeWithDate(finish_time)}
            {/if}
          </p>
        {/if}
      {:else if arrive_time && finish_time && !arrive_time.set(midnight).equals(finish_time.set(midnight))}
        <p>
          {formatCalendarDate(DateTime.fromISO(gig.arrive_time))}
          &ndash;
          {formatCalendarDate(DateTime.fromISO(gig.finish_time))}
        </p>
      {:else if gig.arrive_time}
        <p>{formatCalendarDate(DateTime.fromISO(gig.arrive_time))}</p>
      {/if}
    </div>
    <ul class="tasks main-detail">
      <li>
        {#if gig.finance_deposit_received !== undefined && gig.finance_deposit_received !== null}
          {#if gig.finance_deposit_received}
            <div class="task-summary color-positive"><i class="las la-money-bill-wave"></i> Deposit received</div>
          {:else}
            <div class="task-summary color-negative"><i class="las la-exclamation"></i> Deposit not received</div>
          {/if}
        {/if}
      </li>
      <li>
        {#if gig.finance_payment_received !== undefined && DateTime.fromISO(gig.date) < DateTime.local() && gig.finance_payment_received !== null}
          {#if gig.finance_payment_received}
            <div class="task-summary color-positive"><i class="las la-money-bill-wave"></i> Payment received</div>
          {:else}
            <div class="task-summary color-negative"><i class="las la-exclamation"></i> Payment not received</div>
          {/if}
        {/if}
      </li>
      <li>
        {#if gig.finance_caller_paid !== undefined && DateTime.fromISO(gig.date) < DateTime.local() && gig.finance_caller_paid !== null}
          {#if gig.finance_caller_paid}
            <div class="task-summary color-positive caller"><i class="las la-money-bill-wave"></i> Caller paid</div>
          {:else}
            <div class="task-summary color-negative caller"><i class="las la-exclamation"></i> Caller not paid</div>
          {/if}
        {/if}
      </li>
    </ul>
    {#if gig.summary}
      <div class="summary-text">
        {#if gig.advertise}<b>Public advert:&nbsp;</b>{:else}<b>Summary:&nbsp;</b>{/if}
        <blockquote>
          {@html gig.summary
            .split("\n")
            .map((p) => p.trim())
            .filter((p) => p.length)
            .map((p) => `<p>${p}</p>`)
            .join("")}
        </blockquote>
      </div>
    {/if}
    {#if gig.notes_band}
      <div class="band-notes">
        <b>Band notes:&nbsp;</b>
        <blockquote>
          {@html gig.notes_band.trim()}
        </blockquote>
      </div>
    {/if}
    {#if gig.notes_admin}
      <div class="admin-notes main-detail">
        <b>Admin notes:&nbsp;</b>
        {@html gig.notes_admin.trim()}
      </div>
    {/if}
    {#if gig.finance}
      <div class="gig-finance main-detail"><b>Finance:&nbsp;</b> {gig.finance.trim()}</div>
    {/if}
    {#if gig.gig_type === "gig_enquiry"}Quote date: {gig.quote_date}{/if}
    {#if clients.length > 0}
      <p>
        <b>
          {#if clients.length === 1}Contact:&nbsp;{:else}Contacts:&nbsp;{/if}
        </b>
        {#each clients as client, i (client.id)}
          <a href="/members/gigs/contacts/{client.id}">
            {client.contact.name}
            {#if client.contact.organization}&nbsp;@ {client.contact.organization}{/if}
          </a>{#if i + 1 < clients.length},&nbsp;{/if}
        {/each}
      </p>
    {/if}
    {#if callers.length > 0}
      <p>
        <b>Calling:&nbsp;</b>
        {#each callers as caller, i (caller.id)}
          <a href="/members/gigs/contacts/{caller.id}">{caller.contact.name}</a>{#if i + 1 < callers.length},&nbsp;{/if}
        {/each}
      </p>
    {/if}
    {#if gig.lineup.length > 0}
      <Lineup people="{gig.lineup}" />
    {/if}
    {#if gig.type.code === "gig_cancelled" && linkHeading}
      <button class="cancelled-detail main-detail" on:click="{() => (showDetails = !showDetails)}">
        {#if !showDetails}Show full details{:else}Hide full details{/if}
      </button>
    {/if}
  </div>
{:else}
  <button class="signup" on:click="{() => (showSignup = !showSignup)}" data-test="show-summary-{gig.id}">
    Show summary
  </button>
  <Signup bind:gig="{$signupGig}" userInstruments="{userInstruments}" showLink="{false}" />
{/if}
