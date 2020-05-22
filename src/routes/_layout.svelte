<style>
  .layout {
    display: grid;
    min-height: 100vh;
    grid-template-rows: auto 1fr auto;
    align-items: stretch;
  }

  main {
    position: relative;
    max-width: 56em;
    padding: 2em 2em 0 2em;
    width: 100%;
    box-sizing: border-box;
    justify-self: center;
  }

  :global(footer) {
    max-width: 40em;
    padding: 0 2em 1em 2em;
    justify-self: center;
  }

  .customiser {
    position: fixed;
    bottom: 10px;
    right: 10px;
  }
</style>

<script context="module">
  export function preload({ query }, session) {
    // Read user session or cookie or url param or ...
    return {
      color:
        query.color ||
        (session && session.theme && session.theme.color) ||
        "light",
      font:
        query.font ||
        (session && session.theme && session.theme.font) ||
        "standard",
      accent:
        query.accent ||
        (session && session.theme && session.theme.accent) ||
        "075c01",
      logo:
        query.logo ||
        (session && session.theme && session.theme.logo) ||
        undefined,
    };
  }
</script>

<script>
  import Header from "../components/Header.svelte";
  import Footer from "../components/Footer.svelte";
  import Customiser from "../components/Customiser.svelte";
  import { goto } from "@sapper/app";
  import { makeClient, client } from "../graphql/client";
  import { onMount, setContext } from "svelte";
  import { readable } from "svelte/store";

  export let segment;
  export let color;
  export let font;
  export let accent;
  export let logo;

  onMount(() => {
    client.set(makeClient(fetch, window.location.href.split("/", 1)[0]));
  });

  let query = { color, font, accent, logo };

  $: color = query.color;
  $: font = query.font;
  $: accent = query.accent;
  $: logo = query.logo;

  $: queryString =
    "?" +
    Object.entries(query)
      .filter(([k, v]) => v)
      .map(([k, v], _) => `${k}=${v}`)
      .join("&");
  const update = () => goto(queryString);
</script>

<svelte:head>
  <link rel="stylesheet" type="text/css" href="themes/color/{color}.css" />
  <link rel="stylesheet" type="text/css" href="themes/font/{font}.css" />
  <link
    rel="stylesheet"
    type="text/css"
    href="themes/accent/{accent}.css?logo={logo}"
  />
  <link rel="stylesheet" type="text/css" href="global.css" />
</svelte:head>

<div class="layout">
  <Header {segment} />

  <main>
    <slot />
  </main>

  <Footer />
  <div class="customiser">
    <Customiser bind:value="{query}" on:submit="{update}" />
  </div>
</div>
