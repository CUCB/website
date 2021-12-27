<script>
  import { createEventDispatcher } from "svelte";
  import { makeClient } from "../../graphql/client";
  import { CreateContact, UpdateContact } from "../../graphql/gigs";
  export let id, name, organization, email, caller, notes;

  const dispatch = createEventDispatcher();

  const save = async () => {
    if (!name.trim()) {
      return;
    }
    let variables = {
      id,
      name: name.trim(),
      organization: (organization && organization.trim()) || null,
      email: (email && email.trim()) || null,
      caller,
      notes: (notes && notes.trim()) || null,
    };

    let client = makeClient(fetch);
    let mutationDetails;
    if (id !== null && id !== undefined) {
      mutationDetails = [UpdateContact, "update_cucb_contacts_by_pk"];
    } else {
      mutationDetails = [CreateContact, "insert_cucb_contacts_one"];
    }

    try {
      let res = await client.mutate({
        mutation: mutationDetails[0],
        variables,
      });

      dispatch("saved", {
        // @ts-ignore
        contact: res.data[mutationDetails[1]],
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
  <label> Name <input type="text" bind:value="{name}" required data-test="contact-editor-name" /> </label>
  <label>
    Organization
    <input type="text" bind:value="{organization}" data-test="contact-editor-organization" />
  </label>
  <label> Email <input type="email" bind:value="{email}" data-test="contact-editor-email" /> </label>
  <label> Caller <input type="checkbox" bind:checked="{caller}" data-test="contact-editor-caller" /> </label>
  <label> Notes <input type="text" bind:value="{notes}" data-test="contact-editor-notes" /> </label>
  <div class="buttons">
    <input type="submit" value="Save contact" data-test="contact-editor-save" /><button
      on:click="{() => dispatch('cancel')}"
    >Cancel</button>
  </div>
</form>
