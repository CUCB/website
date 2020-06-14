<style>
  img {
    display: block;
    margin: auto;
    max-width: 100%;
    width: 600px;
  }
</style>

<script>
  export let status;
  export let error;

  const dev = process.env.NODE_ENV === "development";
</script>

<svelte:head>
  <title>{status}</title>
</svelte:head>

<h1>Oh Noes! {status}</h1>

<p>It borked: {error.message}</p>

<img
  src="https://http.cat/{status}.jpg"
  alt="The HTTP Status Cat for status code {status}"
/>

{#if dev && error.stack}
  <pre>{error.stack}</pre>
{/if}
