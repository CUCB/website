<script context="module" lang="ts">
  import { makeClient } from "../graphql/client";
  import { fallbackPeople } from "./committee.json";
  import { HexValue, ThemeColor } from "../components/Members/Customiser.svelte";
  import type { Static } from "runtypes";
  import type { Preload } from "@sapper/common";
  import { Day } from "../view";

  type ThemeColor = Static<typeof ThemeColor>;
  type HexValue = Static<typeof HexValue>;
  interface ThemedProperty {
    default?: HexValue;
    light?: HexValue;
    dark?: HexValue;
  }

  export interface CommitteeMember {
    name: string;
    casual_name: string;
    email_obfus: string;
    committee_key: { name: string; __typename: string };
    __typename: string;
  }
  export interface Committee {
    president: CommitteeMember;
    secretary: CommitteeMember;
    webmaster: CommitteeMember;
  }

  // TODO improve typing
  function fromSessionTheme(session: { theme?: any } | null, name: string): string | undefined {
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

  export const preload: Preload = async function({ query }, session) {
    let committee = {};

    try {
        // @ts-ignore
        // TODO fix the typeerror by making this more portable
      const res = await this.fetch("/committee.json").then((r) => r.json());

      for (let person of res.committee) {
        // @ts-ignore
        committee[person.committee_key.name] = {
          ...person,
        };
      }
    } catch (e) {
      // Swallow error, we can generate generic committee details instead
    }

    let fallbackCommittee = {};
    for (let person of fallbackPeople) {
      // @ts-ignore
      fallbackCommittee[person.committee_key.name] = {
        ...person,
      };
    }

    committee = { ...fallbackCommittee, ...committee };

    let color: ThemeColor;
    try {
      color = ThemeColor.check(query.color || fromSessionTheme(session, "color"));
    } catch {
      color = "default";
    }
    let dayFromSession = fromSessionTheme(session, "calendarStartDay");
    let settings = {
      accent: {} as ThemedProperty,
      logo: {} as ThemedProperty,
      color,
      font: query.font || fromSessionTheme(session, "font") || "standard",
      spinnyLogo: fromSessionTheme(session, "spinnyLogo") || false,
      calendarStartDay: Day.guard(dayFromSession) ? dayFromSession : "mon",
    };
    let accent = query.accent || fromSessionTheme(session, `accent_${color}`);
    if (HexValue.guard(accent)) {
      settings.accent[color] = accent;
    }
    let logo = query.logo || fromSessionTheme(session, `logo_${color}`);
    if (HexValue.guard(logo)) {
      settings.logo[color] = logo;
    }

    return { settingsWithoutMaps: settings, committee };
  }
</script>

<script lang="ts">
  import Header from "../components/Global/Header.svelte";
  import Footer from "../components/Global/Footer.svelte";
  import Customiser from "../components/Members/Customiser.svelte";
  import { Settings } from "../components/Members/Customiser.svelte";
  import { stores } from "@sapper/app";
  import { client, clientCurrentUser } from "../graphql/client";
  import { onMount } from "svelte";
  import { makeTitle, themeName, committee as committeeStore } from "../view";
  import { disableBodyScroll, enableBodyScroll } from "body-scroll-lock";
  import { Map } from "immutable";
  import type Popup from "../components/Popup.svelte";

  export let committee: Committee;
  export let settingsWithoutMaps: { accent: ThemedProperty; logo: ThemedProperty };
  let settings = new Settings({
    ...settingsWithoutMaps,
    accent: Map(Object.entries(settingsWithoutMaps.accent)) as Map<ThemeColor, HexValue>,
    logo: Map(Object.entries(settingsWithoutMaps.logo)) as Map<ThemeColor, HexValue>,
  });

  committeeStore.set(committee);

  let windowWidth: number | undefined;
  let { session } = stores();
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
    client.set(makeClient(fetch));
    clientCurrentUser.set(makeClient(fetch, { role: "current_user" }));
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
  <Header user="{$session}" bind:navVisible bind:showSettings spinnyLogo="{settings.spinnyLogo}" />

  <main>
    <slot />
  </main>

  <Footer committee="{committee}" />
  <Customiser bind:settings bind:showSettings bind:settingsPopup />
</div>
