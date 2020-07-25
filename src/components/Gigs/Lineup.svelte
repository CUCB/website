<style>
  gig-lineup {
    border: 1px solid var(--accent);
    display: grid;
    grid-template-columns: auto auto auto;
    width: fit-content;
    max-width: 100%;
    align-items: stretch;
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

  gig-lineup .odd {
    background: rgba(var(--accent_triple), 0.1);
  }

  gig-lineup > * {
    padding: 5px;
  }
</style>

<script>
  export let people;
  import TooltipText from "../TooltipText.svelte";
  import InstrumentName from "../InstrumentName.svelte";
</script>

<gig-lineup>
  {#each people as person, i (person.user.id)}
    <person-name class:odd="{i % 2 === 1}">
      <a href="/members/users/{person.user.id}">{person.user.first}&nbsp;{person.user.last}</a>
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
