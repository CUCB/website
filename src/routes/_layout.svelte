<script context="module">
  import { makeClient } from "../graphql/client";
  import { fallbackPeople } from "./committee.json";

  function fromSessionTheme(session, name) {
    if (session && session.theme && session.theme[name]) {
      try {
        return JSON.parse(session.theme[name]);
      } catch {
        return session.theme[name];
      }
    } else {
      return undefined;
    }
  }

  export async function preload({ query }, session) {
    let committee = {};

    try {
      const res = await this.fetch("/committee.json").then(r => r.json());

      for (let person of res.committee) {
        committee[person.committee_key.name] = {
          ...person,
        };
      }
    } catch (e) {
      // Swallow error, we can generate generic committee details instead
    }

    let fallbackCommittee = {};
    for (let person of fallbackPeople) {
      fallbackCommittee[person.committee_key.name] = {
        ...person,
      };
    }

    committee = { ...fallbackCommittee, ...committee };

    let color = query.color || fromSessionTheme(session, "color") || "default";
    let settings = {
      color,
      font: query.font || fromSessionTheme(session, "font") || "standard",
      accentOpen: false,
      logoOpen: false,
      spinnyLogo: fromSessionTheme(session, "spinnyLogo") || false,
      calendarStartDay: fromSessionTheme(session, "calendarStartDay") || "mon",
    };
    settings[`accent_${color}`] = query.accent || fromSessionTheme(session, `accent_${color}`) || undefined;
    settings[`logo_${color}`] = query.logo || fromSessionTheme(session, `logo_${color}`) || undefined;
    calendarStartDay.set(settings["calendarStartDay"]);

    return { settings, committee };
  }
</script>

<script>
  import Header from "../components/Global/Header.svelte";
  import Footer from "../components/Global/Footer.svelte";
  import Customiser from "../components/Members/Customiser.svelte";
  import { stores } from "@sapper/app";
  import { client, clientCurrentUser } from "../graphql/client";
  import { onMount } from "svelte";
  import { makeTitle, calendarStartDay, themeName, committee as committeeStore } from "../view";
  import { disableBodyScroll, enableBodyScroll } from "body-scroll-lock";
  import { Map } from "immutable";

  export let committee = {};
  export let settings = {};
  settings = Map(settings);
  committeeStore.set(committee);

  let windowWidth;
  let { session } = stores();
  let showSettings;
  let navVisible;

  $: showSettings ? disableBodyScroll() : enableBodyScroll();

  function correctMobileHeight() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  }

  onMount(() => {
    correctMobileHeight();
    const browserDomain = window.location.href
      .split("/", 3)
      .slice(0, 3)
      .join("/");
    client.set(makeClient(fetch, { host: browserDomain }));
    clientCurrentUser.set(makeClient(fetch, { host: browserDomain, role: "current_user" }));
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

  :global(footer) {
    max-width: 40em;
    justify-self: center;
  }

  @media (max-width: 600px) {
    :global(footer) {
      padding-bottom: 2.5rem;
    }
  }
</style>

<svelte:head>
  <link
    href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,700;1,400;1,700&display=swap"
    rel="stylesheet"
  />
  <link rel="stylesheet" type="text/css" href="static/themes/color/default.css" />
  <link rel="stylesheet" type="text/css" href="static/themes/font/standard.css" />
  {#if $session.userId}
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
  <Header user="{$session}" bind:navVisible bind:showSettings spinnyLogo="{settings.get('spinnyLogo')}" />

  <main>
    <slot />
  </main>

  <Footer {committee} />
  <Customiser bind:settings bind:showSettings />
</div>
