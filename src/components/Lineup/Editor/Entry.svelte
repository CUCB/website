<style lang="scss">
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
</style>

<script>
  import { afterUpdate } from "svelte";
  import flash from "./flash.js";

  export let person;
  export let updateEntry;

  $: roles = {
    leader: person.leader,
    equipment: person.equipment,
    money_collector: person.money_collector,
  };

  const attributeSummary = attributes =>
    (attributes.includes("leader") ? "L" : "") +
    (attributes.includes("equipment") ? "T" : "");

  let content;

  afterUpdate(() => flash(content));
</script>

<svelte:options immutable />
<div bind:this="{content}">
  <h3>{person.user.first} {person.user.last}</h3>
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
      <li
        aria-selected="{value ? 'true' : undefined}"
        on:click="{() => updateEntry.setRole(role, !value)}"
      >
        {role}
      </li>
    {/each}
  </ul>
</div>
