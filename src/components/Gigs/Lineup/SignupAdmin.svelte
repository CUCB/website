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
    for (let i = 0; i < this.length; i++) {
      const char = this.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  };

  type GigSignup = Omit<Gig, "lineup"> & { lineup: undefined; signup?: LineupEntry };
</script>

<script lang="ts">
  import { makeTitle, themeName } from "../../../view";
  import TooltipText from "../../TooltipText.svelte";
  import { DateTime } from "luxon";
  import { List, Map } from "immutable";
  import type { Gig, LineupEntry, User } from "../../../routes/members/gigs/signups/types";
  import { createEventDispatcher } from "svelte";
  export let gigs: Gig[] = [];
  export let sortedBy: string | null = null;
  gigs = gigs.sort((gigA, gigB) => new Date(gigA.sort_date).getTime() - new Date(gigB.sort_date).getTime());

  const dispatch = createEventDispatcher();

  $: sortedByGig = gigs.find((gig) => sortedBy === gig.id);
  $: sortedBy && sortedByGig && sortedPeople && availabilitySort(sortedByGig);

  // TODO use groupby to clean this up
  $: people = List(
    Map(
      gigs.flatMap((gig: Gig) =>
        gig.lineup.map<[string, User]>((person: LineupEntry) => [person.user.id, person.user]),
      ),
    ).values(),
  );
  // $: people && (sortedBy = null);
  $: sortedPeople = people.sortBy((v) => `${v.first} ${v.last}`);
  $: sortedPeopleJS = sortedPeople.toJS() as User[];
  $: gigsForPerson = Map<string, GigSignup[]>(
    people.map((user: User) => [
      user.id,
      gigs.map((gig: Gig) => ({
        ...gig,
        lineup: undefined,
        signup: gig.lineup.find((signup) => user.id === signup.user.id),
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
    dispatch("select", { gig: sortedBy });
  }

  function hash(id: string) {
    return parseInt(id) * ("" + gigs.map((gig) => parseInt(gig.id)).reduce((a, b) => a + b, 0)).hashCode();
  }
</script>

<style lang="scss">
  @import "../../../sass/themes.scss";

  table {
    border-collapse: collapse;
    margin-top: -2em;
  }

  thead th {
    transform: translate(100%, 0) rotate(-135deg) translate(0, 100%);
    transform-origin: bottom left;
    writing-mode: vertical-lr;
    vertical-align: top;
    height: 1em !important;
  }
  thead td {
    border: unset;
    background: none !important;
  }

  th div {
    white-space: nowrap;
    text-align: start;
    text-overflow: ellipsis;
    overflow: hidden;
    // margin-left: -0.5em;
    width: 2em;
    min-width: 2em;
  }

  tbody td {
    border: 0.1em solid #666;
  }
  tbody th {
    border: 0.1em solid #666;
  }
  th button {
    height: max-content;
    border-left: 0.1em solid #666;
    max-height: 35ch;
    text-overflow: ellipsis;
    background: unset;
    border-radius: unset;
    margin-top: -0.05em;
    margin-left: -0.08em;
    margin-right: 1em;
  }

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
        outline: 3px solid themed("positive");
        outline-offset: -2.5px;
        border: unset;
        border-radius: unset;
      }
    }
  }
  td {
    min-width: 4.5em;
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
  tr:nth-child(2n) th[scope="row"],
  tr:nth-child(2n) td {
    @include themeify($themes) {
      background: themed("formColor");
    }
  }
</style>

<svelte:head>
  <title>{makeTitle("Gig signups")}</title>
</svelte:head>

{#if sortedByGig}
  <p>
    Showing people signed up for <a href="/members/gigs/{sortedBy}">{gigs.find((gig) => gig.id === sortedBy)?.title}</a>
    [<a href="/members/gigs/{sortedBy}/edit-lineup">Edit lineup</a>].
  </p>
{:else}
  <p>Click a gig title to sort the people by who's available for that gig.</p>
{/if}

<table class="table theme-{$themeName}">
  <thead>
    <tr>
      <td class="gap"></td>
      {#each gigs as gig (hash(gig.id))}
        <th scope="col">
          <button
            on:click="{() => (sortedBy = gig.id)}"
            data-test="gig-title-{gig.id}"
            aria-selected="{sortedBy === gig.id ? true : false}"
            ><div tabindex="-1">
              {gig.date && DateTime.fromISO(gig.date).toFormat("ccc dd LLL")}:&#32;{gig.title}
            </div></button
          >
        </th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each sortedPeopleJS as person (hash(person.id))}
      <tr>
        <th class="name" data-test="person-name" scope="row">{person.first}&nbsp;{person.last}</th>
        {#each gigsForPerson.get(person.id) || [] as gig}
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
                <div>
                  {#if gig.signup?.user_available}
                    {#if gig.signup?.user_only_if_necessary}
                      <i class="las la-question"></i>
                    {:else}<i class="las la-check"></i>{/if}
                  {:else if gig.signup?.user_available === false}
                    <i class="las la-times"></i>
                  {:else}
                    &nbsp;
                    <!-- Add some content to hover over for tooltip-->
                  {/if}
                  {#if gig.signup?.user_notes || gig.signup?.user.gig_notes}<i class="las la-comment"></i>{/if}
                </div>
              </TooltipText>
            {/if}
          </td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>
