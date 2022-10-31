<script>
  import { page } from "$app/stores";
  import { dev } from "$app/environment";
  import MembersNav from "../components/Members/Nav.svelte";
  export let data;
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
  <title>{$page.status}</title>
</svelte:head>

{#if data.session?.userId && $page.url.pathname.match(/^\/members\//)}
  <MembersNav />
{/if}

<h1>Oh Noes! {$page.status}</h1>

<p>The error was: <i>{$page.error.message}</i></p>

<img src="https://http.cat/{$page.status}.jpg" alt="The HTTP Status Cat for status code {$page.status}" />
