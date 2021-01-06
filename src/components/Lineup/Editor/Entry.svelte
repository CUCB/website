<script>
  import { afterUpdate } from "svelte";
  import flash from "./flash.js";
  import TooltipText from "../../TooltipText.svelte";

  export let person;
  export let updateEntry;

  $: roles = {
    leader: person.leader,
    equipment: person.equipment,
    money_collector: person.money_collector,
  };

  const attributeSummary = (attributes) =>
    (attributes.includes("leader") ? "L" : "") + (attributes.includes("soundtech") ? "T" : "");

  let content;

  afterUpdate(() => flash(content));
</script>

<style>
  [aria-selected]::before {
    content: "✓";
  }

  ul {
    list-style-type: none;
  }

  li {
    user-select: none;
    cursor: pointer;
  }

  .icons {
    display: inline-block;
    font-size: 1em;
  }
</style>

<svelte:options immutable />
<div bind:this="{content}" data-test="member-{person.user.id}">
  <h3>
    {person.user.first}&#32;{person.user.last}&#32;
    {#if person.user.attributes.length > 0}
      (
      <div data-test="attribute-icons" class="icons">
        {#if person.user.attributes.includes('leader')}
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
        {/if}
      </div>)
    {/if}
  </h3>
  <p>[{attributeSummary(person.user.attributes)}]</p>
  <ul>
    {#each Object.entries(person.user_instruments) as [id, instrument]}
      <li
        aria-selected="{instrument.approved ? 'true' : undefined}"
        on:click="{() => updateEntry.instruments.setApproved(id, !instrument.approved)}"
      >
        {instrument.user_instrument.instrument.name}
      </li>
    {/each}
  </ul>

  <ul>
    {#each Object.entries(roles) as [role, value]}
      <li aria-selected="{value ? 'true' : undefined}" on:click="{() => updateEntry.setRole(role, !value)}">{role}</li>
    {/each}
  </ul>
</div>
