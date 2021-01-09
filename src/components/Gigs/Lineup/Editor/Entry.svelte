<script>
  import { afterUpdate } from "svelte";
  import flash from "./flash.js";
  import TooltipText from "../../../TooltipText.svelte";
  import InstrumentName from "../../InstrumentName.svelte";

  export let person;
  export let updateEntry;

  $: roles = {
    leader: { name: "leader", value: person.leader },
    equipment: { name: "equip", value: person.equipment },
    driver: { name: "driver", value: person.driver },
    money_collector: { name: "money", value: person.money_collector, disabled: person.money_collector_notified },
  };
  $: if (person.money_collector) {
    roles.money_collector_notified = { name: "money notified", value: person.money_collector_notified };
  } else {
    delete roles["money_collector_notified"];
  }

  let content;

  afterUpdate(() => flash(content));
</script>

<style lang="scss">
  [aria-selected]::before {
    content: "✓";
  }

  [aria-checked="false"] {
    text-decoration: line-through;
    opacity: 0.5;
    transition: opacity linear 0.1s;
    &:hover {
      opacity: 1;
    }
  }

  .name {
    display: flex;
  }
  .icons {
    display: inline-block;
    font-size: 1em;
  }
</style>

<svelte:options immutable />
<div bind:this="{content}" data-test="member-{person.user.id}">
  <div class="name">
    {person.user.first}&#32;{person.user.last}&#32;
    {#if person.user.attributes.length > 0}
      <div data-test="attribute-icons" class="icons">
        ({#if person.user.attributes.includes('leader')}
          <TooltipText data-test="icon-leader" content="{person.user.first} can lead">
            <i class="las la-music"></i>
          </TooltipText>
        {/if}
        {#if person.user.attributes.includes('soundtech')}
          <TooltipText data-test="icon-soundtech" content="{person.user.first} can tech">
            <i class="las la-tools"></i>
          </TooltipText>
        {/if}
        {#if person.user.attributes.includes('driver')}
          <TooltipText data-test="icon-driver" content="{person.user.first} can drive">
            <i class="las la-tachometer-alt"></i>
          </TooltipText>
        {/if}
        {#if person.user.attributes.includes('car')}
          <TooltipText data-test="icon-car" content="{person.user.first} has a car">
            <i class="las la-car-side"></i>
          </TooltipText>
        {/if})
      </div>
    {/if}
  </div>
  <div class="instruments">
    {#each Object.entries(person.user_instruments) as [id, instrument]}
      <div data-test="instrument-{id}">
        <button
          data-test="instrument-yes"
          aria-selected="{instrument.approved ? 'true' : undefined}"
          on:click="{() => updateEntry.instruments.setApproved(id, true)}"
        >Yes</button>
        <button
          data-test="instrument-maybe"
          aria-selected="{instrument.approved === null ? 'true' : undefined}"
          on:click="{() => updateEntry.instruments.setApproved(id, null)}"
        >?</button>
        <button
          data-test="instrument-no"
          aria-selected="{instrument.approved === false ? 'true' : undefined}"
          on:click="{() => updateEntry.instruments.setApproved(id, false)}"
        >No</button>
        <InstrumentName userInstrument="{instrument.user_instrument}" />
      </div>
    {/each}
  </div>
  <div class="actions">
    {#if person.approved}
      <button on:click="{() => updateEntry.setApproved(null)}" data-test="person-unapprove">Un-approve</button>
    {:else if person.approved === null}
      <button on:click="{() => updateEntry.setApproved(true)}" data-test="person-approve">Approve</button>
      <button on:click="{() => updateEntry.setApproved(false)}" data-test="person-discard">Discard</button>
    {:else}
      <button on:click="{() => updateEntry.setApproved(null)}" data-test="person-undiscard">Un-discard</button>
    {/if}
  </div>

  <ul>
    {#each Object.entries(roles) as [role, { name, value, disabled }]}
      <button
        role="checkbox"
        disabled="{disabled}"
        aria-checked="{value ? 'true' : 'false'}"
        on:click="{() => updateEntry.setRole(role, !value)}"
        data-test="toggle-{role}"
      >[{name}]</button>
    {/each}
  </ul>
</div>
