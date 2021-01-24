<script>
  import { Set, Map, fromJS, getIn } from "immutable";
  import { makeTitle, themeName } from "../../../view";
  import TooltipText from "../../TooltipText.svelte";
  export let gigs;
  $: people = Set(gigs.flatMap((gig) => gig.lineup.map((person) => person.user)));
  $: sortedPeople = fromJS(people.toArray()).sortBy((v) => `${v.get("first")} ${v.get("last")}`);
  $: gigsForPerson = Map(
    people.map((user) => [
      user.id,
      gigs.map((gig) =>
        fromJS({
          ...gig,
          lineup: undefined,
          signup: gig.lineup && gig.lineup.find((signup) => user.id === signup.user.id),
        }),
      ),
    ]),
  );
  function signupStatus(gig) {
    let person = gig.toJS().signup;
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
  function lineupStatus(gig) {
    let person = gig.toJS().signup;
    return typeof person === "undefined"
      ? ""
      : person.approved === true
      ? "status-approved"
      : person.approved === null
      ? ""
      : "status-nope";
  }
  function lineupText(gig) {
    let person = gig.toJS().signup;
    return typeof person === "undefined"
      ? ""
      : person.approved === true
      ? "Approved"
      : person.approved === null
      ? ""
      : "Declined";
  }
  function statusText(gig) {
    let person = gig.toJS().signup;
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
  function availabilitySort(gig) {
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
      .sortBy((person) => availabilities.get(person.get("id")) || 4)
      .sortBy((person) => approvedLineup.get(person.get("id")) || 2);
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
    left: 0px;
    @include themeify($themes) {
      background: themed("background");
    }
    text-align: right;
  }
  .table {
    display: grid;
    grid-template-columns: auto;
    grid-auto-columns: min-content;
    grid-auto-flow: dense;
    max-width: 95vw;
    overflow: auto;
    grid-gap: 2px;
  }
  tr {
    display: contents;
  }
  .name, .gap {
    grid-column: 1;
  }
  .gap {
      grid-row: 1;
  }
  th:not([scope='row']) {
      grid-row: 1;
  }
</style>

<svelte:head>
  <title>{makeTitle('Gig signups')}</title>
</svelte:head>

<div class="table theme-{$themeName}">
  <tr>
    <td class="gap"></td>
    {#each gigs as gig (gig.id)}
      <th scope="col" class="rotate">
        <button on:click="{availabilitySort(gig)}"><div tabindex="-1">{gig.date}&#32;{gig.title}</div></button>
      </th>
    {/each}
  </tr>
  {#each sortedPeople.toJS() as person (person.id)}
    <tr>
      <th class="name" scope="row">{person.first}&nbsp;{person.last}</th>
      {#each gigsForPerson.get(person.id) as gig}
        <td class="person {signupStatus(gig)} {lineupStatus(gig)}">
          {#if signupStatus(gig) || lineupStatus(gig)}
            <TooltipText
              content="{`${person.first} ${person.last}${lineupText(gig) ? ` (${lineupText(gig)})` : ''}\n${gig.get('title')}${statusText(gig) ? `\n${statusText(gig)}` : ''}${gig.getIn(
                  ['signup', 'user_notes'],
                ) ? `\nNotes: ${gig.getIn([
                      'signup',
                      'user_notes',
                    ])}` : ``}${gig.getIn([
                  'signup',
                  'user',
                  'gig_notes',
                ]) ? `\nGeneral notes: ${gig.getIn(['signup', 'user', 'gig_notes'])}` : ``}`}"
            >
              <div style="width:100%; height: 100%">
                {#if gig.getIn(['signup', 'user_available'])}
                  {#if gig.getIn(['signup', 'user_only_if_necessary'])}
                    <i class="las la-question"></i>
                  {:else}<i class="las la-check"></i>{/if}
                {:else if gig.getIn(['signup', 'user_available']) === false}
                  <i class="las la-times"></i>
                {:else}
                  &nbsp;
                  <!-- Add some content to hover over for tooltip-->
                {/if}
                {#if gig.getIn(['signup', 'user_notes']) || gig.getIn(['signup', 'user', 'gig_notes'])}
                  <i class="las la-comment"></i>
                {/if}
              </div>
            </TooltipText>
          {/if}
        </td>
      {/each}
    </tr>
  {/each}
</div>
