<script>
  export let people;
  import TooltipText from "../TooltipText.svelte";
  import InstrumentName from "./InstrumentName.svelte";
  import { themeName } from "../../view";
  import { sortLineup } from "./_sort";
  $: sortLineup(people);
</script>

<style lang="scss">
  @import "../../sass/themes.scss";

  .gig-lineup {
    @include themeifyThemeElement($themes) {
      border: 1px solid themed("accent");
      border: 1px solid var(--accent);
      & .odd {
        background: rgba(themed("accent"), 0.1);
        background: rgba(var(--accent_triple), 0.1);
      }
    }
    display: grid;
    grid-template-columns: auto auto auto;
    width: fit-content;
    max-width: 100%;
    align-items: stretch;

    & > * {
      padding: 5px;
    }
  }

  .person-name a {
    margin-bottom: 2px;
  }

  .person-icons {
    font-size: 1.5em;
  }

  .person-name,
  .person-instruments,
  .person-icons {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
  }

  @media only screen and (max-width: 400px) {
    .gig-lineup {
      font-size: 0.9rem;
    }
  }
</style>

<div class="gig-lineup theme-{$themeName}">
  {#each people as person, i (person.user.id)}
    <div class="person-name" class:odd="{i % 2 === 1}">
      <span> <a href="/members/users/{person.user.id}">{person.user.first}&#32;{person.user.last}</a> </span>
    </div>
    <div class="person-instruments" class:odd="{i % 2 === 1}">
      {#each person.user_instruments as instrument (instrument.user_instrument_id)}
        <div class="person-instrument">
          <InstrumentName userInstrument="{instrument.user_instrument}" />
        </div>
      {/each}
    </div>
    <div class="person-icons" class:odd="{i % 2 === 1}">
      {#if person.leader}
        <TooltipText data-test="is-leading" content="{person.user.first} is leading">
          <i class="las la-music" data-test="icon-is-leading"></i>
        </TooltipText>
      {/if}
      {#if person.money_collector}
        <TooltipText data-test="is-collecting-money" content="{person.user.first} is collecting money">
          <i class="las la-coins" data-test="icon-is-collecting-money"></i>
        </TooltipText>
      {/if}
      {#if person.driver}
        <TooltipText data-test="is-driving" content="{person.user.first} is driving">
          <i class="las la-car" data-test="icon-is-driving"></i>
        </TooltipText>
      {/if}
      {#if person.equipment}
        <TooltipText data-test="is-teching" content="{person.user.first} is teching">
          <i class="las la-tools" data-test="icon-is-teching"></i>
        </TooltipText>
      {/if}
    </div>
  {/each}
</div>
