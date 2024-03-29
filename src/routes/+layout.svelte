<script lang="ts">
  import Header from "../components/Global/Header.svelte";
  import Footer from "../components/Global/Footer.svelte";
  import Customiser from "../components/Members/Customiser.svelte";
  import { Settings } from "../components/Members/runtypes";
  import { onMount } from "svelte";
  import { makeTitle, themeName, committee as committeeStore } from "../view";
  import { disableBodyScroll, enableBodyScroll } from "body-scroll-lock";
  import { Map } from "immutable";
  import type Popup from "../components/Popup.svelte";
  import type { LayoutData } from "./$types";
  import type { Committee, ThemedProperty } from "./layout.types";
  import type { HexValue, ThemeColor } from "../components/Members/runtypes";

  export let data: LayoutData;
  let committee: Committee = data.committee;
  let settingsWithoutMaps: { accent: ThemedProperty; logo: ThemedProperty } = data.settingsWithoutMaps;
  let session: { userId?: string } = data.optionalSession;
  let alternativeRole = data.alternativeRole;
  let alternativeRoles = data.alternativeRoles;

  let settings = new Settings({
    ...settingsWithoutMaps,
    accent: Map(Object.entries(settingsWithoutMaps.accent)) as Map<ThemeColor, HexValue>,
    logo: Map(Object.entries(settingsWithoutMaps.logo)) as Map<ThemeColor, HexValue>,
  });

  committeeStore.set(committee);

  let windowWidth: number | undefined;
  let showSettings: boolean;
  let settingsPopup: Popup | null;
  let navVisible: boolean;

  // @ts-ignore
  $: showSettings ? disableBodyScroll(settingsPopup) : typeof window !== "undefined" && enableBodyScroll(settingsPopup);

  function correctMobileHeight() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  }

  onMount(() => {
    correctMobileHeight();
    // @ts-ignore
    if (window.Cypress) {
      let node = document.createElement("span");
      node.setAttribute("data-test", "page-hydrated");
      document.body.appendChild(node);
    }
  });
</script>

<style>
  .layout {
    display: grid;
    min-height: 100vh;
    min-height: calc(var(--vh, 1vh) * 100);
    grid-template-rows: auto 1fr auto;
    max-width: 60em;
    width: 100%;
    margin: auto;
    align-items: stretch;
    padding: 0.5em 2em;
    box-sizing: border-box;
    position: relative;
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

  div :global(footer) {
    max-width: 40em;
    justify-self: center;
  }

  @media (max-width: 600px) {
    div :global(footer) {
      padding-bottom: 2.5rem;
    }
  }
</style>

<svelte:head>
  <link
    href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,700;1,400;1,700&display=swap"
    rel="stylesheet"
  />
  <link rel="stylesheet" type="text/css" href="/static/themes/color/default.css" />
  <link rel="stylesheet" type="text/css" href="/static/themes/font/standard.css" />
  {#if session?.userId}
    <link
      rel="stylesheet"
      href="https://maxst.icons8.com/vue-static/landings/line-awesome/font-awesome-line-awesome/css/all.min.css"
    />
    <link
      rel="stylesheet"
      href="https://maxst.icons8.com/vue-static/landings/line-awesome/line-awesome/1.3.0/css/line-awesome.min.css"
    />
  {/if}
  <title>{makeTitle()}</title>
</svelte:head>

<svelte:window on:resize="{correctMobileHeight}" bind:innerWidth="{windowWidth}" />

<div class="layout theme-{$themeName}">
  <Header
    user="{session}"
    bind:navVisible="{navVisible}"
    bind:showSettings="{showSettings}"
    spinnyLogo="{settings.spinnyLogo}"
  />

  <main>
    <slot />
  </main>

  <Footer committee="{committee}" />
  <Customiser
    bind:settings="{settings}"
    bind:showSettings="{showSettings}"
    bind:settingsPopup="{settingsPopup}"
    session="{session}"
    alternativeRole="{alternativeRole}"
    alternativeRoles="{alternativeRoles}"
  />
</div>
