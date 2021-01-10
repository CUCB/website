<script>
  import { afterUpdate } from "svelte";
  import flash from "./flash.js";
  import TooltipText from "../../../TooltipText.svelte";
  import InstrumentName from "../../InstrumentName.svelte";

  export let person;
  export let updateEntry;
  let editAdminNotes = person.admin_notes;
  let showUnselectedInstruments = false;

  $: currentlySaved = [person.admin_notes, person.admin_notes || ""].includes(editAdminNotes && editAdminNotes.trim());

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

  const save = () => {
    updateEntry.setAdminNotes(editAdminNotes && (editAdminNotes.trim() || null));
  };

  const selectInstrument = (id) => {
    updateEntry.addInstrument(id);
    showUnselectedInstruments = false;
  };

  $: selectedInstrumentIds = new Set(Object.keys(person.user_instruments).map(str => parseInt(str)));
  $: console.log(Object.keys(person.user_instruments));
  $: unselectedInstruments = person.user.user_instruments.filter((i) => !selectedInstrumentIds.has(i.id));
  $: console.log(unselectedInstruments);

//   afterUpdate(() => flash(content));
</script>

<style lang="scss">
  [aria-selected]::before {
    content: "✓";
  }
  [aria-checked] {
    opacity: 1;
    transition: opacity linear 0.1s;
  }
  [aria-checked="false"] {
    text-decoration: line-through;
    opacity: 0.5;
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

  .notes *::before {
    font-weight: bold;
  }
  .user-gig-notes::before {
    content: "User notes (this gig): ";
  }
  .user-global-notes::before {
    content: "User notes (all gigs): ";
  }
  .admin-notes::before {
    content: "Admin notes (click to edit): ";
  }
  .admin-notes:not(.saved):focus:before {
    content: "Admin notes (click elsewhere to save): ";
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
    {#if !showUnselectedInstruments}
      <button on:click="{() => (showUnselectedInstruments = true)}" data-test="add-instruments">Add instrument</button>
    {:else}
      <div data-test="instruments-to-add">
        {#each unselectedInstruments as instrument}
          <button on:click="{selectInstrument(instrument.id)}">{instrument.instrument.name}</button>
        {:else}
          No instruments available to add
        {/each}
        <button
          on:click="{() => (showUnselectedInstruments = false)}"
          data-test="cancel-add-instruments"
        >Cancel</button>
      </div>
    {/if}
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

  <div class="notes">
    {#if person.user_notes && person.user_notes.trim()}
      <div class="user-gig-notes" data-test="user-gig-notes">{person.user_notes.trim()}</div>
    {/if}
    {#if person.user.gig_notes && person.user.gig_notes.trim()}
      <div class="user-global-notes" data-test="user-global-notes">{person.user.gig_notes.trim()}</div>
    {/if}
    <div
      class="admin-notes"
      class:saved="{currentlySaved}"
      data-test="admin-notes"
      bind:innerHTML="{editAdminNotes}"
      contenteditable="true"
      on:blur="{save}"
    ></div>
  </div>
</div>
