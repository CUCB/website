<script>
  import moment from "moment-timezone";
  import Signup from "./Signup.svelte";
  import TooltipText from "../TooltipText.svelte";
  import Lineup from "./Lineup.svelte";
  import { linear } from "svelte/easing";
  export let gig, signupGig, userInstruments;
  export let linkHeading = false;
  let arriveFinishFormat = "HH:mm";
  let showSignup = false;

  $: clients = gig.contacts.filter(c => c.client);
  $: callers = gig.contacts.filter(c => c.calling);

  if (gig.arrive_time && gig.finish_time) {
    if (
      moment(gig.arrive_time)
        .tz("Europe/London")
        .day() !==
      moment(gig.finish_time)
        .tz("Europe/London")
        .day()
    ) {
      arriveFinishFormat = "HH:mm (ddd Do MMM)";
    }
  }
</script>

<style>
  .gigtype-gig_enquiry {
    --shadow: var(--neutral);
  }
  .gigtype-gig {
    --shadow: var(--positive);
  }
  gig-summary {
    --shadow: var(--form_color);
    display: block;
    padding: 1em;
    border-radius: 5px;
    box-shadow: 0px 0px 5px 0px var(--shadow);
    max-width: calc(100%-10px);
    margin: 0 auto 2em auto;
    box-sizing: border-box;
    word-break: break-word;
  }

  task-list {
    display: flex;
    flex-direction: column;
  }

  gig-summary > :last-child {
    margin-bottom: 0;
  }

  h2 {
    display: grid;
    grid-template-columns: 1fr auto;
  }

  h2 a {
    justify-self: flex-start;
  }

  admin-notes,
  band-notes {
    white-space: pre-wrap;
    display: block;
    margin: 1em 0;
  }

  summary-text {
    display: block;
    margin: 1em 0;
  }

  button {
    float: right;
    margin-right: 1em;
    margin-top: 1em;
  }

  gig-finance {
    font-style: italic;
  }

  gig-finance b {
    font-style: normal;
  }

  gig-icons {
    margin-right: 0.5em;
  }

  .gigtype-gig_enquiry,
  .gigtype-gig_cancelled {
    filter: opacity(0.5);
    transition: all 0.3s linear;
  }

  .gigtype-gig_enquiry:hover,
  .gigtype-gig_cancelled:hover {
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
  }

  .gigtype-gig_cancelled > :not(h2):not(h3):not(.date):not(task-list):not(admin-notes):not(gig-finance) {
    display: none;
  }
</style>

{#if !showSignup}
  {#if gig.allow_signups}
    <button on:click="{() => (showSignup = !showSignup)}" data-test="show-signup">Show signup</button>
  {/if}
  <gig-summary class="gigtype-{gig.type.code}">
    <h2>
      {#if linkHeading}
        <a href="/members/gigs/{gig.id}">{gig.title}</a>
      {:else}{gig.title}{/if}
      <gig-icons>
        {#if gig.food_provided}
          <TooltipText content="Food provided">
            <i class="las la-utensils"></i>
          </TooltipText>
        {/if}
      </gig-icons>
    </h2>
    {#if gig.venue}
      <h3>
        <a href="/members/gigs/venue/{gig.venue.id}">
          {gig.venue.name}
          {#if gig.venue.subvenue}&nbsp;| {gig.venue.subvenue}{/if}
        </a>
      </h3>
    {/if}
    {#if gig.date}
      <p class="date">
        {moment(gig.date)
          .tz('Europe/London')
          .format('dddd Do MMMM YYYY')}
      </p>
    {/if}
    {#if gig.arrive_time}
      <p>
        <b>Arrive time:&nbsp;</b>
        {@html moment(gig.arrive_time)
          .tz('Europe/London')
          .format(arriveFinishFormat)}
      </p>
    {/if}
    {#if gig.time}
      <p>
        <b>Start time:&nbsp;</b>
        {moment(`2020-01-01 ${gig.time}`)
          .tz('Europe/London')
          .format('HH:mm')}
      </p>
    {/if}
    {#if gig.finish_time}
      <p>
        <b>Finish time:&nbsp;</b>
        {moment(gig.finish_time)
          .tz('Europe/London')
          .format(arriveFinishFormat)}
      </p>
    {/if}
    <task-list>
      {#if gig.finance_deposit_received !== undefined}
        {#if gig.finance_deposit_received}
          <task-summary style="color:var(--positive)">
            <i class="las la-money-bill-wave"></i>
            Deposit received
          </task-summary>
        {:else}
          <task-summary style="color:var(--negative)">
            <i class="las la-exclamation"></i>
            Deposit not received
          </task-summary>
        {/if}
      {/if}
      {#if gig.finance_payment_received !== undefined && moment(gig.date).isBefore(moment())}
        {#if gig.finance_payment_received}
          <task-summary style="color:var(--positive)">
            <i class="las la-money-bill-wave"></i>
            Payment received
          </task-summary>
        {:else}
          <task-summary style="color:var(--negative)">
            <i class="las la-exclamation"></i>
            Payment not received
          </task-summary>
        {/if}
      {/if}
      {#if gig.finance_caller_paid !== undefined && moment(gig.date).isBefore(moment())}
        {#if gig.finance_caller_paid}
          <task-summary style="color:var(--positive)">
            <i class="las la-money-bill-wave"></i>
            Caller paid
          </task-summary>
        {:else}
          <task-summary style="color:var(--negative)">
            <i class="las la-exclamation"></i>
            Caller not paid
          </task-summary>
        {/if}
      {/if}
    </task-list>
    {#if gig.summary}
      <summary-text>
        {#if gig.advertise}
          <b>Public advert:&nbsp;</b>
        {/if}
        <blockquote>
          {@html gig.summary
            .split('\n')
            .map(p => p.trim())
            .filter(p => p.length)
            .map(p => `<p>${p}</p>`)
            .join('')}
        </blockquote>
      </summary-text>
    {/if}
    {#if gig.notes_band}
      <band-notes>
        <b>Band notes:&nbsp;</b>
        <blockquote>
          {@html gig.notes_band.trim()}
        </blockquote>
      </band-notes>
    {/if}
    {#if gig.notes_admin}
      <admin-notes>
        <b>Admin notes:&nbsp;</b>
        {@html gig.notes_admin.trim()}
      </admin-notes>
    {/if}
    {#if gig.finance}
      <gig-finance>
        <b>Finance:&nbsp;</b>
        {gig.finance.trim()}
      </gig-finance>
    {/if}
    {#if gig.gig_type === 'gig_enquiry'}Quote date: {gig.quote_date}{/if}
    {#if clients.length > 0}
      <p>
        <b>
          {#if clients.length === 1}Contact:&nbsp;{:else}Contacts:&nbsp;{/if}
        </b>
        {#each clients as client, i (client.id)}
          <a href="/members/gigs/contacts/{client.id}">{client.contact.name}</a>
          {#if i + 1 < clients.length},&nbsp;{/if}
        {/each}
      </p>
    {/if}
    {#if callers.length > 0}
      <p>
        <b>Calling:&nbsp;</b>
        {#each callers as caller, i (caller.id)}
          <a href="/members/gigs/contacts/{caller.id}">{caller.contact.name}</a>
          {#if i + 1 < callers.length},&nbsp;{/if}
        {/each}
      </p>
    {/if}
    {#if gig.lineup.length > 0}
      <Lineup people="{gig.lineup}" />
    {/if}
  </gig-summary>
{:else}
  <button on:click="{() => (showSignup = !showSignup)}">Show summary</button>
  <Signup gig="{signupGig}" {userInstruments} showLink="{false}" />
{/if}
