<script lang="ts">
  export let person: any;
  export let showEmail = false;
  import { onMount } from "svelte";

  let email_obfus = person.email_obfus;
  let email_display = person.email_obfus
    .replace(/_/g, "")
    .split("")
    .map((c: any) => `&#${c.charCodeAt(0)};`)
    .join("");
  $: subject = email_obfus.match(/_/) ? "Remove underscores from email address" : "";
  $: mailto = `mailto:${email_obfus}?subject=${subject}`;

  onMount(() => {
    email_obfus = email_obfus.replace(/_/g, "");
  });
</script>

<a href="{mailto}" data-test="{`email_${person.committee_key.name}`}">
  {#if showEmail}
    {@html email_display}
  {:else}
    <slot />
  {/if}
</a>
