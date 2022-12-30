<script lang="ts">
  import { createEventDispatcher } from "svelte";
  export let id: string | undefined = undefined,
    name: string = "",
    organization: string | null = null,
    email: string | null = null,
    caller: boolean = false,
    notes: string | null = null;

  const dispatch = createEventDispatcher();

  const save = async () => {
    if (!name.trim()) {
      return;
    }
    const body = {
      id,
      name: name.trim(),
      organization: (organization && organization.trim()) || null,
      email: (email && email.trim()) || null,
      caller,
      notes: (notes && notes.trim()) || null,
    };

    try {
      const res = await fetch("/members/gigs/contacts", { method: "POST", body: JSON.stringify(body) }).then((res) =>
        res.json(),
      );

      dispatch("saved", {
        contact: res,
      });
    } catch (e) {
      // Oh shit, probably should do something here
      console.error(e);
    }
  };
</script>

<style lang="scss">
  form,
  form * {
    width: 100%;
    box-sizing: border-box;
  }
  input[type="submit"],
  button {
    width: unset;
    margin: 0.25em;
  }
  .buttons {
    display: flex;
    justify-content: center;
  }
  input:disabled {
    filter: opacity(0.5);
  }
</style>

<form on:submit|preventDefault="{save}">
  <label>
    Name <input type="text" bind:value="{name}" required data-test="contact-editor-name" placeholder=" " />
  </label>
  <label>
    Organization
    <input type="text" bind:value="{organization}" data-test="contact-editor-organization" />
  </label>
  <label> Email <input type="email" bind:value="{email}" data-test="contact-editor-email" /> </label>
  <label> Caller <input type="checkbox" bind:checked="{caller}" data-test="contact-editor-caller" /> </label>
  <label> Notes <input type="text" bind:value="{notes}" data-test="contact-editor-notes" /> </label>
  <div class="buttons">
    <input type="submit" value="Save contact" data-test="contact-editor-save" /><button
      on:click="{() => dispatch('cancel')}">Cancel</button
    >
  </div>
</form>
