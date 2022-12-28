<script lang="ts">
  import { enhance } from "$app/forms";
  import { CRSID_PATTERN, EMAIL_PATTERN } from "../../auth/_register";
  import type { ActionData, PageServerData } from "./$types";
  const regexString = (regexp: RegExp) => regexp.toString().slice(1, regexp.toString().length - 1);

  export let data: PageServerData;
  export let form: ActionData;
  let { emails } = data;
  $: if (form?.success) {
    if (!emails.includes(form.email)) {
      emails = [...emails, form.email];
      emails.sort();
    }
  }
</script>

{#if form?.success}
  <p>Successfully added {form.email} to the list.</p>
{/if}

<form method="POST" use:enhance>
  {#if form?.missing}<p class="error">The email field is required.</p>{/if}
  {#if form?.alreadyAdded}<p class="error">That email is already on the list.</p>{/if}
  <input name="email" type="text" pattern="{regexString(CRSID_PATTERN)}|{regexString(EMAIL_PATTERN)}" />
  <input type="submit" />
</form>
<br />

Below are the emails in list042:

<small>
  <ul>
    {#each emails as email}
      <li>{email}</li>
    {/each}
  </ul>
</small>
