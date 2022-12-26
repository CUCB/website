<svelte:options immutable />

<script>
  import TooltipText from "../../../TooltipText.svelte";
  import InstrumentName from "../../InstrumentName.svelte";

  export let person;
  export let updateEntry;
  // @ts-ignore
  let editAdminNotes = person.admin_notes || "";
  let showUnselectedInstruments = false;

  $: currentlySaved = [person.admin_notes, person.admin_notes || ""].includes(editAdminNotes && editAdminNotes.trim());

  $: roles = {
    leader: { name: "leader", value: person.leader },
    equipment: { name: "equip", value: person.equipment },
    driver: { name: "driver", value: person.driver },
    money_collector: { name: "money", value: person.money_collector, disabled: person.money_collector_notified },
    money_collector_notified: undefined,
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

  $: selectedInstrumentIds = new Set(Object.keys(person.user_instruments));
  $: unselectedInstruments = person.user.instruments.filter((i) => !selectedInstrumentIds.has(i.id));
  $: availability = person.user_available
    ? person.user_only_if_necessary
      ? "available if necessary"
      : "available"
    : person.user_available === false
    ? "unavailable"
    : null;
  $: availableColor = person.user_available
    ? person.user_only_if_necessary
      ? "color-neutral"
      : "color-positive"
    : person.user_available === false
    ? "color-negative"
    : "";
</script>

<style lang="scss">
  [aria-checked],
  [aria-pressed] {
    opacity: 1;
  }
  [aria-checked="false"],
  [aria-pressed="false"],
  .deleted-instrument {
    text-decoration: line-through;
    opacity: 0.63;
    &:hover {
      opacity: 1;
    }
  }

  .icons {
    display: block;
    font-size: 1.5em;
  }

  .icons > :global(*) {
    margin: 0 0.5em;
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
    content: "Admin notes (click here to edit): ";
  }
  .admin-notes:not(.saved):focus:before {
    content: "Admin notes (click elsewhere to save): ";
  }
  .instruments {
    display: grid;
    grid-template-columns: auto auto auto 1fr;
    justify-items: end;
    align-items: center;
    grid-column-gap: 5px;
    & > div {
      display: contents;
      margin: 0.1em 0;
    }
    button {
      height: 1.6em;
      margin: 0.4em 0;
    }
    .instrument-name {
      justify-self: start;
    }
  }
  .actions {
    justify-self: end;
    text-align: right;
  }
  .notes {
    grid-column: 2 / -1;
    text-align: right;
  }
  .container {
    display: grid;
    align-items: center;
    padding: 0.15em 0.35em;
    @media only screen and (min-width: 601px) {
      grid-template-columns: 1fr 1fr 1fr;
    }
    @media only screen and (min-width: 301px) {
      grid-template-columns: auto minmax(30%, 1fr);
      .name {
        grid-column: 1 / -1;
      }
      .notes {
        grid-column: 1 / -1;
      }
    }
    @media only screen and (max-width: 300px) {
      .actions {
        justify-self: center;
      }
    }
    &:nth-child(even) {
      background: rgba(var(--accent_triple), 0.1);
    }
  }

  .actions button {
    margin: 0.2em;
  }
  button {
    padding: 0.1em 0.45em;
  }
</style>

<div class="container" bind:this="{content}" data-test="member-{person.user.id}">
  <div class="name">
    {person.user.first}&#32;{person.user.last}&#32;
    {#if person.user.attributes.length > 0}
      <div data-test="attribute-icons" class="icons">
        {#if person.user.attributes.includes("leader")}
          <TooltipText data-test="icon-leader" content="{person.user.first} can lead">
            <i class="las la-music"></i>
          </TooltipText>
        {/if}
        {#if person.user.attributes.includes("soundtech")}
          <TooltipText data-test="icon-soundtech" content="{person.user.first} can tech">
            <i class="las la-tools"></i>
          </TooltipText>
        {/if}
        {#if person.user.attributes.includes("driver")}
          <TooltipText data-test="icon-driver" content="{person.user.first} can drive">
            <i class="las la-tachometer-alt"></i>
          </TooltipText>
        {/if}
        {#if person.user.attributes.includes("car")}
          <TooltipText data-test="icon-car" content="{person.user.first} has a car">
            <i class="las la-car-side"></i>
          </TooltipText>
        {/if}
      </div>
    {/if}
  </div>
  <div class="instruments">
    {#each Object.entries(person.user_instruments) as [id, instrument]}
      <div data-test="instrument-{id}" role="radiogroup">
        <button
          data-test="instrument-yes"
          aria-checked="{instrument.approved ? 'true' : 'false'}"
          role="radio"
          on:click="{() => updateEntry.instruments.setApproved(id, true)}">Yes</button
        >
        <button
          data-test="instrument-maybe"
          aria-checked="{instrument.approved === null ? 'true' : 'false'}"
          role="radio"
          on:click="{() => updateEntry.instruments.setApproved(id, null)}">?</button
        >
        <button
          data-test="instrument-no"
          aria-checked="{instrument.approved === false ? 'true' : 'false'}"
          role="radio"
          on:click="{() => updateEntry.instruments.setApproved(id, false)}">No</button
        >
        <div class="instrument-name" data-test="instrument-name">
          <InstrumentName userInstrument="{instrument.user_instrument}" />
        </div>
      </div>
    {/each}
  </div>
  <div class="actions">
    {#if !showUnselectedInstruments}
      <button on:click="{() => (showUnselectedInstruments = true)}" data-test="add-instruments">Add instrument</button>
      {#if person.approved}
        <button on:click="{() => updateEntry.setApproved(null)}" data-test="person-unapprove">Un-approve</button>
      {:else if person.approved === null}
        <button on:click="{() => updateEntry.setApproved(true)}" data-test="person-approve">Approve</button>
        <button on:click="{() => updateEntry.setApproved(false)}" data-test="person-discard">Discard</button>
      {:else}
        <button on:click="{() => updateEntry.setApproved(null)}" data-test="person-undiscard">Un-discard</button>
      {/if}
      <div class="roles">
        {#each Object.entries(roles) as [role, { name, value, disabled }]}
          <button
            role="button"
            disabled="{disabled}"
            aria-pressed="{value ? 'true' : 'false'}"
            on:click="{() => updateEntry.setRole(role, !value)}"
            data-test="toggle-{role}">{name}</button
          >
        {/each}
      </div>
    {:else}
      <div data-test="instruments-to-add">
        {#each unselectedInstruments as instrument}
          <button class:deleted-instrument="{instrument.deleted}" on:click="{() => selectInstrument(instrument.id)}"
            >{instrument.instrument.name}</button
          >
        {:else}No instruments available to add{/each}
        <button on:click="{() => (showUnselectedInstruments = false)}" data-test="cancel-add-instruments">Cancel</button
        >
      </div>
    {/if}
  </div>

  <div class="notes">
    {#if availability}
      <div data-test="user-availability">
        {person.user.first}
        is
        <span class="{availableColor}">{availability}</span>
      </div>
    {/if}
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
