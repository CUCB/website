<script>
  export let status;
  export let error;
  // import MembersNav from "../components/Members/Nav.svelte";
  import { page } from "$app/stores";
  import { dev } from "$app/environment";
</script>

<style>
  img {
    display: block;
    margin: auto;
    max-width: 100%;
    width: 600px;
  }
</style>

<svelte:head>
  <title>{status}</title>
</svelte:head>

<!-- {#if $session && $session.userId && $page.path.match(/^\/members\//)}
  <MembersNav />
{/if} -->

<h1>Oh Noes! {$page.error.status}</h1>

<p>The error was: <i>{$page.error.message}</i></p>

<img src="https://http.cat/{status}.jpg" alt="The HTTP Status Cat for status code {$page.error.status}" />

{#if dev && $page.error.stack}
  <pre>{$page.error.stack}</pre>
{/if}
