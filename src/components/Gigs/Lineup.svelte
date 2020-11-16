<script>
  export let people;
  import TooltipText from "../TooltipText.svelte";
  import InstrumentName from "./InstrumentName.svelte";
  import { themeName } from "../../view";
  import { sortLineup } from "./_sort";
  sortLineup(people);
</script>

<style lang="scss">
  @import "../../sass/themes.scss";

  gig-lineup {
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

  person-name a {
    margin-bottom: 2px;
  }

  person-icons {
    font-size: 1.5em;
  }

  person-name,
  person-instruments,
  person-icons {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
  }

  @media only screen and (max-width: 400px) {
    gig-lineup {
      font-size: 0.9rem;
    }
  }
</style>

<gig-lineup class="theme-{$themeName}">
  {#each people as person, i (person.user.id)}
    <person-name class:odd="{i % 2 === 1}">
      <span>
        <a href="/members/users/{person.user.id}">{person.user.first}&#32;{person.user.last}</a>
      </span>
    </person-name>
    <person-instruments class:odd="{i % 2 === 1}">
      {#each person.user_instruments as instrument (instrument.user_instrument_id)}
        <person-instrument>
          <InstrumentName userInstrument="{instrument.user_instrument}" />
        </person-instrument>
      {/each}
    </person-instruments>
    <person-icons class:odd="{i % 2 === 1}">
      {#if person.leader}
        <TooltipText content="{person.user.first} is leading">
          <i class="las la-music" data-test="is-leading"></i>
        </TooltipText>
      {/if}
      {#if person.money_collector}
        <TooltipText content="{person.user.first} is collecting money">
          <i class="las la-coins" data-test="is-collecting-money"></i>
        </TooltipText>
      {/if}
      {#if person.driver}
        <TooltipText content="{person.user.first} is driving">
          <i class="las la-car" data-test="is-driving"></i>
        </TooltipText>
      {/if}
      {#if person.equipment}
        <TooltipText content="{person.user.first} is teching">
          <i class="las la-tools" data-test="is-teching"></i>
        </TooltipText>
      {/if}
    </person-icons>
  {/each}
</gig-lineup>
