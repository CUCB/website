<script>
  export let status;
  export let error;
  import MembersNav from "../components/Members/Nav.svelte";
  import { stores } from "@sapper/app";

  const { session, page } = stores();
  const dev = process.env.NODE_ENV === "development";
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

{#if $session.userId && $page.path.match(/^\/members\//)}
  <MembersNav />
{/if}

<h1>Oh Noes! {status}</h1>

<p>
  The error was:
  <i>{error.message}</i>
</p>

<img src="https://http.cat/{status}.jpg" alt="The HTTP Status Cat for status code {status}" />

{#if dev && error.stack}
  <pre>{error.stack}</pre>
{/if}
