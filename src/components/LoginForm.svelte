<script lang="ts">
  export let redirectTo: string, form: ActionData;
  import { browser } from "$app/environment";
  import { applyAction, enhance } from "$app/forms";
  import type { ActionData } from "../routes/auth/login/$types";

  let username = form?.username || "";
  let password = "";

  let updateProps = [
    "accent_light",
    "accent_dark",
    "accent_default",
    "color",
    "logo_light",
    "logo_dark",
    "logo_default",
    "spinnyLogo",
    "calendarStartDay",
  ];

  $: theme = browser ? themeFromLocalStorage() : null;
  $: themeString = JSON.stringify(theme);

  const themeFromLocalStorage = (): Record<number, Record<string, string>> | null => {
    let res: Record<number, Record<string, string>> = {};
    let regexp = new RegExp(`^(?<prop>${updateProps.map((name) => `${name}`).join("|")})_(?<userId>[0-9]+)$`);
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) as string;
      const match = key.match(regexp);
      if (match) {
        const groups = match.groups as { prop: string; userId: string };
        const { prop } = groups;
        const userId = parseInt(groups.userId);
        const newEntry = { [prop]: localStorage.getItem(key) as string };
        res[userId] = userId in res ? { ...res[userId], ...newEntry } : newEntry;
      }
    }
    return Object.keys(res).length > 0 ? res : null;
  };
</script>

<h1>Sign in</h1>
<!-- TODO how should this action work -->
<form
  method="POST"
  action="/auth/login"
  use:enhance="{() => {
    return async ({ result }) => {
      if (result.type === 'redirect') {
        window.location.href = result.location;
      } else {
        // Apply the action so that the form updates regardless of what page we originate from
        await applyAction(result);
      }
    };
  }}"
>
  {#if form?.message}<p class="error" data-test="errors">{form?.message}</p>{/if}
  <input type="hidden" value="{themeString}" name="theme" />
  <input type="hidden" value="{redirectTo}" name="redirectTo" />
  <label>
    Username
    <input type="text" bind:value="{username}" data-test="username" name="username" />
  </label>
  <label>
    Password
    <input type="password" bind:value="{password}" data-test="password" name="password" />
  </label>
  <input type="submit" value="Login" data-test="submit" />
</form>
Don't have an account already?
<a href="/auth/register" data-test="register">Click here</a>
to sign up to the website.
