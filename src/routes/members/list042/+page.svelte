<script lang="ts">
  // TODO add tests for this page
  import { enhance } from "$app/forms";
  import Fuse from "fuse.js";
  import SearchBox from "../../../components/SearchBox.svelte";
  import { makeTitle } from "../../../view";
  import { CRSID_PATTERN, EMAIL_PATTERN } from "../../auth/_register";
  import type { ActionData, PageServerData } from "./$types";
  const regexString = (regexp: RegExp) => regexp.toString().slice(1, regexp.toString().length - 1);

  export let data: PageServerData;
  export let form: ActionData;
  let { emails } = data;
  $: if (form?.success && form.added) {
    const tmpEmails = new Set(emails);
    for (const { email } of form.added) {
      tmpEmails.add(email);
    }
    const sortableEmails = [...tmpEmails.values()];
    sortableEmails.sort();
    emails = sortableEmails;
  }

  $: searchEmails = new Fuse(emails, { threshold: 0.35 });
</script>

<style>
  .forms {
    display: flex;
    justify-content: space-evenly;
    margin: 1em 0;
    align-items: center;
  }
  form {
    display: flex;
    align-items: center;
    border: 1px dashed black;
    padding: 1em;
  }

  .success,
  .error {
    font-style: italic;
  }
</style>

<svelte:head>
  <title>{makeTitle("Update Authorized Emails")}</title>
</svelte:head>

<h1>Update authorized emails</h1>

Since we allow users to have accounts only if they're signed up to the website, but we can't actually check that
automatically, the website has to store a list of who's on the mailing list. This is stored in the database for this
website, in a table called<code>list042</code> (because that's what the file that pre-dates the database table was
called, I don't know why) .

<div class="forms">
  <div>
    <form method="POST" use:enhance action="?/addSingle" data-test="add-single">
      <p>Add a single user</p>

      {#if form?.success && form?.type === "single"}
        <p class="success">Successfully added {form.added[0].email} to the list.</p>
      {/if}
      {#if form?.type === "single" && form.error === "missing"}
        <p class="error">The email field is required.</p>
      {/if}
      {#if form?.type === "single" && form.error === "alreadyAdded"}
        <p class="error">That email is already on the list.</p>
      {/if}
      {#if form?.type === "single" && form.error === "invalidEmailOrCrsid"}
        <p class="error">The provided value is not a valid email or crsid.</p>
      {/if}
      <input
        name="email"
        type="text"
        placeholder=" "
        pattern="{regexString(CRSID_PATTERN)}|{regexString(EMAIL_PATTERN)}"
        value="{(form?.type === 'single' && form.email) || ''}"
        required
      />
      <input type="submit" value="Add user" />
    </form>
  </div>

  <div>
    <form method="POST" use:enhance action="?/merge" data-test="merge-with-file">
      <p>or merge with a file (one email per line)</p>

      {#if form?.success && form.type === "file"}
        <p class="success">Found {form.numberFound} new emails.</p>
      {/if}
      <input type="file" name="file" />
      <input type="submit" value="Merge with file" />
    </form>
  </div>
</div>

<p>Search for an email:</p>

<SearchBox placeholder="" fuse="{searchEmails}" toId="{(email) => email}" toDisplayName="{(email) => email}" />

<p>Below are the emails in list042 (there are {emails.length} in total):</p>

<small>
  <ul>
    {#each emails as email}
      <li>{email}</li>
    {/each}
  </ul>
</small>
