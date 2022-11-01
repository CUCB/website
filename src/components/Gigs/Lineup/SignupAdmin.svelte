<svelte:options immutable="{true}" />

<script lang="ts" context="module">
  declare global {
    interface String {
      hashCode(): number;
    }
  }

  String.prototype.hashCode = function () {
    var hash = 0;
    if (this.length == 0) {
      return hash;
    }
    for (var i = 0; i < this.length; i++) {
      var char = this.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  };

  interface GigSignup extends Gig {
    lineup: undefined;
    signup: LineupEntry;
  }
</script>

<script lang="ts">
  import { makeTitle, themeName } from "../../../view";
  import TooltipText from "../../TooltipText.svelte";
  import { DateTime } from "luxon";
  import { List, Map } from "immutable";
  import type { Gig, LineupEntry, User } from "../../../routes/members/gigs/signups/+page.svelte";
  export let gigs: Gig[] = [];
  gigs = gigs.sort((gigA, gigB) => new Date(gigA.sort_date).getTime() - new Date(gigB.sort_date).getTime());
  let sortedBy = null;
  // TODO use groupby to clean this up
  $: people = List(
    Map(
      gigs.flatMap((gig: Gig) =>
        gig.lineup.map<[number, User]>((person: LineupEntry) => [person.user.id, person.user]),
      ),
    ).values(),
  );
  $: people && (sortedBy = null);
  $: sortedPeople = people.sortBy((v) => `${v.first} ${v.last}`);
  $: gigsForPerson = Map<number, GigSignup[]>(
    people.map((user: User) => [
      user.id,
      gigs.map((gig: Gig) => ({
        ...gig,
        lineup: undefined,
        signup: gig.lineup && gig.lineup.find((signup) => user.id === signup.user.id),
      })),
    ]),
  );
  function signupStatus(gig: GigSignup): string {
    let person = gig.signup;
    return typeof person === "undefined"
      ? ""
      : person.user_available === true
      ? person.user_only_if_necessary === true
        ? "status-only_if_necessary"
        : "status-available"
      : person.user_available !== null
      ? "status-unavailable"
      : "";
  }
  function lineupStatus(gig: GigSignup): string {
    let person = gig.signup;
    return typeof person === "undefined"
      ? ""
      : person.approved === true
      ? "status-approved"
      : person.approved === null
      ? ""
      : "status-nope";
  }
  function lineupText(gig: GigSignup): string {
    let person = gig.signup;
    return typeof person === "undefined"
      ? ""
      : person.approved === true
      ? "Approved"
      : person.approved === null
      ? ""
      : "Declined";
  }
  function statusText(gig: GigSignup): string {
    let person = gig.signup;
    return typeof person === "undefined"
      ? ""
      : person.user_available === true
      ? person.user_only_if_necessary === true
        ? "Available if necessary"
        : "Available"
      : person.user_available !== null
      ? "Unavailable"
      : "";
  }
  function availabilitySort(gig: Gig) {
    let availabilities = Map(
      gig.lineup.map((person) => [
        person.user.id,
        person.user_available ? (person.user_only_if_necessary ? 2 : 1) : person.user_available !== null ? 3 : 4,
      ]),
    );
    let approvedLineup = Map(
      gig.lineup.map((person) => [person.user.id, person.approved ? 1 : person.approved !== null ? 3 : 2]),
    );
    sortedPeople = sortedPeople
      .sortBy((person) => `${person.first} ${person.last}`)
      .sortBy((person) => availabilities.get(person.id) || 4)
      .sortBy((person) => approvedLineup.get(person.id) || 2);
    sortedBy = gig.id;
  }

  function hash(id) {
    return id * ("" + gigs.map((gig) => gig.id).reduce((a, b) => a + b, 0)).hashCode();
  }
</script>

<style lang="scss">
  @import "../../../sass/themes.scss";
  .person {
    &.status-available {
      @include themeify($themes) {
        background: rgba(themed("positive"), 0.2);
      }
    }
    &.status-unavailable {
      @include themeify($themes) {
        background: rgba(themed("negative"), 0.2);
      }
    }
    &.status-only_if_necessary {
      @include themeify($themes) {
        background: rgba(themed("neutral"), 0.2);
      }
    }
    &.status-approved {
      @include themeify($themes) {
        border: 2px solid themed("positive");
      }
    }
  }
  button {
    font-family: unset;
    border: unset;
    font-weight: bold;
    height: auto;
  }
  button:focus,
  div:focus {
    outline: none;
    box-shadow: none;
  }

  button:focus > div {
    outline: 2px solid;
    @include themeify($themes) {
      outline-color: themed("textColor");
    }
    outline-offset: 0.5em;
  }
  th button {
    white-space: initial;
  }
  .person div {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  th[scope="row"],
  .gap {
    position: sticky;
    left: 0;
    @include themeify($themes) {
      background: themed("background");
    }
    text-align: right;
    box-sizing: border-box;
    height: 100%;
    align-self: center;
    padding-right: 10px;
  }
  .table {
    display: grid;
    grid-auto-columns: min-content;
    grid-auto-flow: dense;
    max-width: 95vw;
    overflow: auto;
    grid-row-gap: 5px;
    thead {
      display: contents;
    }

    tbody {
      display: contents;
    }

    & tr {
      display: contents;
    }
  }
  th {
    align-self: center;
  }
  tr:nth-child(2n) th[scope="row"],
  tr:nth-child(2n) td {
    background: lightgray;
    // outline: solid 1px red;
  }
  .name,
  .gap {
    grid-column: 1;
  }
  .gap {
    grid-row: 1;
  }
  th:not([scope="row"]) {
    grid-row: 1;
  }
</style>

<svelte:head>
  <title>{makeTitle("Gig signups")}</title>
</svelte:head>

<table class="table theme-{$themeName}">
  <thead>
    <tr>
      <td class="gap"></td>
      {#each gigs as gig (hash(gig.id))}
        <th scope="col">
          <button
            on:click="{() => availabilitySort(gig)}"
            data-test="gig-title-{gig.id}"
            aria-selected="{sortedBy === gig.id ? true : false}"
            ><div tabindex="-1">{DateTime.fromISO(gig.date).toFormat("dd LLL")}&#32;{gig.title}</div></button
          >
        </th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each sortedPeople.toJS() as person (hash(person.id))}
      <tr>
        <th class="name" data-test="person-name" scope="row">{person.first}&nbsp;{person.last}</th>
        {#each gigsForPerson.get(person.id) as gig}
          <td class="person {signupStatus(gig)} {lineupStatus(gig)}">
            {#if signupStatus(gig) || lineupStatus(gig)}
              <TooltipText
                content="{`${person.first} ${person.last}${lineupText(gig) ? ` (${lineupText(gig)})` : ''}\n${
                  gig.title
                }${statusText(gig) ? `\n${statusText(gig)}` : ''}${
                  gig?.signup?.user_notes?.trim() ? `\nNotes: ${gig.signup.user_notes.trim()}` : ``
                }${gig?.signup?.user?.gig_notes ? `\nGeneral notes: ${gig.signup.user.gig_notes}` : ``}`}"
                data-test="signup-details-{person.id}-{gig.id}"
              >
                <div style="width:100%; height: 100%">
                  {#if gig.signup.user_available}
                    {#if gig.signup.user_only_if_necessary}
                      <i class="las la-question"></i>
                    {:else}<i class="las la-check"></i>{/if}
                  {:else if gig.signup.user_available === false}
                    <i class="las la-times"></i>
                  {:else}
                    &nbsp;
                    <!-- Add some content to hover over for tooltip-->
                  {/if}
                  {#if gig.signup.user_notes || gig.signup.user.gig_notes}<i class="las la-comment"></i>{/if}
                </div>
              </TooltipText>
            {/if}
          </td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>
