<script lang="ts">
  // TODO how does control flow work here? What happens if I change a nickname, don't hit save, but then hit "add instrument"?
  // Does it remember the new nicename, or does it forget it? Does anyone care?

  // TODO parameterise client so we use current user/admin client correctly
  import type { GraphQLClient } from "../../graphql/client";
  import { createEventDispatcher } from "svelte";
  import { CreateUserInstrument, UpdateUserInstrument } from "../../graphql/instruments";

  export let client: GraphQLClient;
  export let instrument: UserInstrument;
  console.log(instrument);

  interface UserInstrument {
    id?: number;
    nickname: string | null;
    instr_id: number;
    instrument: {
      name: string;
    };
    user_id: number;
  }

  let nickname = instrument.nickname || "";

  const dispatch = createEventDispatcher();

  function changeInstrumentType() {
    dispatch("changeInstrumentType");
  }

  async function updateExistingInstrument() {
    const data = { id: instrument.id, nickname: nickname.trim() || null };
    return (await client.mutate({ mutation: UpdateUserInstrument, variables: data })).data
      .update_cucb_users_instruments_by_pk;
  }

  async function createNewInstrument() {
    const data = { instr_id: instrument.instr_id, nickname: nickname.trim() || null, user_id: instrument.user_id };
    return await (
      await client.mutate({ mutation: CreateUserInstrument, variables: data })
    ).data.insert_cucb_users_instruments_one;
  }

  async function saveChanges() {
    let result;
    if (instrument.id) {
      result = await updateExistingInstrument();
    } else {
      result = await createNewInstrument();
    }
    dispatch("save", { instrument: result });
  }

  async function cancel() {
    dispatch("cancel");
  }
</script>

<p>
  Instrument type: <em>{instrument.instrument.name}</em>.
  <button class="link" on:click="{changeInstrumentType}">Click here</button> to change it.
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
  <button data-test="cancel-instrument-details" class="link" on:click="{cancel}">Cancel</button>
</form>
