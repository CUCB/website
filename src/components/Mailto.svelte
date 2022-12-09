<script lang="ts">
  export let person: Person;
  export let showEmail = false;
  import { onMount } from "svelte";

  interface Person {
    email_obfus: string;
    lookup_name?: {
      name: string;
    };
  }

  let email_obfus = person.email_obfus;
  let email_display = person.email_obfus
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

<a href="{mailto}" data-test="{person?.lookup_name?.name ? `email_${person?.lookup_name.name}` : `email`}">
  {#if showEmail}
    {@html email_display}
  {:else}
    <slot />
  {/if}
</a>
