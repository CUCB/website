<script lang="ts">
  // TODO how does control flow work here? What happens if I change a nickname, don't hit save, but then hit "add instrument"?
  // Does it remember the new nicename, or does it forget it? Does anyone care?
  import { createEventDispatcher } from "svelte";

  export let instrument: UserInstrument;
  export let user: { id: string };

  interface UserInstrument {
    id?: string;
    nickname?: string | null;
    instrument: {
      id: string;
      name: string;
    };
  }

  let nickname = instrument.nickname || "";

  const dispatch = createEventDispatcher();

  function changeInstrumentType() {
    dispatch("changeInstrumentType");
  }

  async function updateExistingInstrument() {
    const variables = {
      userInstrumentId: instrument.id,
      nickname: nickname.trim() || null,
      instrument: instrument.instrument.id,
    };
    const body = JSON.stringify(variables);

    return await fetch(`/members/users/${user.id}/instruments`, { method: "POST", body }).then((res) => res.json());
  }

  async function createNewInstrument() {
    const variables = {
      instrument_id: instrument.instrument.id,
      nickname: nickname.trim() || null,
    };
    const body = JSON.stringify(variables);

    return await fetch(`/members/users/${user.id}/instruments`, { method: "POST", body }).then((res) => res.json());
  }

  async function saveChanges() {
    let result;
    if (instrument.id) {
      result = await updateExistingInstrument();
    } else {
      result = await createNewInstrument();
    }
    console.log(result);
    dispatch("save", { instrument: result });
  }

  async function cancel() {
    dispatch("cancel");
  }
</script>

<p>
  Instrument type: <em>{instrument.instrument.name}</em>.
  <button class="link" on:click="{changeInstrumentType}" data-test="change-instrument-type"
    >Click here to change the instrument type</button
  >.
</p>

<p>You're editing the information for this <em>{instrument.instrument.name}</em>.</p>

<form on:submit|preventDefault="{saveChanges}">
  <label for="nickname"> Nickname (optional) </label>
  <input type="text" bind:value="{nickname}" id="nickname" />
  {#if instrument.id}
    <button data-test="save-instrument-details" class="link" type="submit">Save</button>
  {:else}
    <button data-test="save-instrument-details" class="link" type="submit">Add instrument</button>
  {/if}
  <button data-test="cancel-instrument-details" class="link" type="button" on:click="{cancel}">Cancel</button>
</form>
