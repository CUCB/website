<script lang="ts">
  export let person: Person;
  export let showEmail = false;
  import { onMount } from "svelte";

  interface Person {
    emailObfus: string;
    lookupName?: {
      name: string;
    };
  }

  let email_obfus = person.emailObfus;
  let email_display = person.emailObfus
    ?.replace(/_/g, "")
    .split("")
    .map((c: any) => `&#${c.charCodeAt(0)};`)
    .join("");
  $: subject = email_obfus?.match(/_/) ? "Remove underscores from email address" : "";
  $: mailto = `mailto:${email_obfus}?subject=${subject}`;

  onMount(() => {
    email_obfus = email_obfus?.replace(/_/g, "");
  });
</script>

<a href="{mailto}" data-test="{person?.lookupName?.name ? `email_${person?.lookupName?.name}` : `email`}">
  {#if showEmail}
    {@html email_display}
  {:else}
    <slot />
  {/if}
</a>
