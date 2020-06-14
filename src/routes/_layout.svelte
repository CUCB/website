<style>
  .layout {
    display: grid;
    min-height: 100vh;
    grid-template-rows: auto 1fr auto;
    max-width: 60em;
    width: 100%;
    margin: auto;
    align-items: stretch;
    padding: 0.5em 2em;
    box-sizing: border-box;
  }

  main {
    position: relative;
    padding-top: 1em;
    width: 100%;
    max-width: 56em;
    box-sizing: border-box;
    justify-self: center;
  }

  @media (max-width: 800px) {
    .layout {
      padding: 0.5em 1em;
    }
  }

  :global(footer) {
    max-width: 40em;
    justify-self: center;
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
  import { goto, stores } from "@sapper/app";
  import { makeClient, client } from "../graphql/client";
  import { onMount, setContext } from "svelte";
  import { readable } from "svelte/store";

  export let segment;
  export let color;
  export let font;
  export let accent;
  export let logo;

  let query = { color, font, accent, logo };
  let { page, session } = stores();

  onMount(() => {
    const browserDomain = window.location.href
      .split("/", 3)
      .slice(0, 3)
      .join("/");
    client.set(makeClient(fetch, browserDomain));
  });

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
    href="themes/accent/{accent}.css?{logo ? `logo=${logo}` : ``}"
  />
  <link rel="stylesheet" type="text/css" href="global.css" />
</svelte:head>

<div class="layout">
  <Header {segment} user="{$session}" />

  <main>
    <slot />
  </main>

  <Footer />
</div>
