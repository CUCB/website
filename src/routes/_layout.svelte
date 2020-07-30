<script context="module">
  import { makeClient } from "../graphql/client";

  export async function preload({ query }, session) {
    let committee = {};

    // This could be in /committee.json, but this allows us
    // to deal with an error there which we should ideally
    // be prepared for
    let fallbackPeople = [
      {
        name: "The President",
        casual_name: "The President",
        email_obfus: "p_r__esid_ent@cu_cb.co.uk",
        committee_key: {
          name: "president",
          __typename: "cucb_committee_keys",
        },
        __typename: "cucb_committee_members",
      },
      {
        name: "The Secretary",
        casual_name: "The Secretary",
        email_obfus: "se_cre_tar_y@cucb.co.uk",
        committee_key: {
          name: "secretary",
          __typename: "cucb_committee_keys",
        },
        __typename: "cucb_committee_members",
      },
      {
        name: "The Webmaster",
        casual_name: "The Webmaster",
        email_obfus: "we__bma_ster_@cucb._co.uk",
        committee_key: {
          name: "webmaster",
          __typename: "cucb_committee_keys",
        },
        __typename: "cucb_committee_members",
      },
    ];

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

    let color = query.color || (session && session.theme && session.theme.color) || "default";

    // Read user session or cookie or url param or ...
    return {
      color,
      font: query.font || (session && session.theme && session.theme.font) || "standard",
      accent: query.accent || (session && session.theme && session.theme[`accent_${color}`]),
      logo: query.logo || (session && session.theme && session.theme.logo) || undefined,
      committee,
    };
  }
</script>

<script>
  import Header from "../components/Header.svelte";
  import Footer from "../components/Footer.svelte";
  import Popup from "../components/Popup.svelte";
  import { goto, stores } from "@sapper/app";
  import { client, clientCurrentUser } from "../graphql/client";
  import { onMount } from "svelte";
  import { makeTitle } from "../view";
  import { disableBodyScroll, enableBodyScroll } from "body-scroll-lock";
  import { HsvPicker } from "svelte-color-picker";
  import { Map } from "immutable";

  export let segment;
  export let color;
  export let font;
  export let accent;
  export let logo;
  export let committee;

  let spinnyLogo;
  let query = { color, font, accent, logo };
  let colors = ["default", "light", "dark"];
  let windowWidth;
  let { session } = stores();
  let showSettings;
  let navVisible;
  let settings = Map({ accentOpen: false });
  $: navVisible && windowWidth <= 600 ? disableBodyScroll() : enableBodyScroll();

  $: showSettings ? disableBodyScroll() : enableBodyScroll();

  function correctMobileHeight() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  }

  let updateLocalStorage = _ => {};
  let updateSession = () => {};

  const propLocalStorage = name => {
    const value = localStorage.getItem(`${name}_${$session.userId}`);
    if (value !== "null") return value;
  };

  const fromCurrentStyle = prop =>
    getComputedStyle(document.documentElement)
      .getPropertyValue(`--${prop}`)
      .trim();

  const rgbStringToHex = triple =>
    triple
      .split(",")
      .map(i => parseInt(i))
      .map(i => i.toString(16))
      .map(i => (i.length === 1 ? "0" + i : i))
      .join("");

  const updateSettings = () => {
    if ($session.userId && updateProps) {
      for (let color of colors) {
        let prop = `accent_${color}`;
        !settings.get(prop) && (settings = settings.set(prop, localStorage.getItem(`${prop}_${$session.userId}`)));
      }
    }
  };

  onMount(() => {
    color = propLocalStorage("color") || color;
    accent = propLocalStorage(`accent_${color}`) || rgbStringToHex(fromCurrentStyle("accent_triple"));
    spinnyLogo = JSON.parse(propLocalStorage("spinnyLogo"));
    correctMobileHeight();
    const browserDomain = window.location.href
      .split("/", 3)
      .slice(0, 3)
      .join("/");
    client.set(makeClient(fetch, { host: browserDomain }));
    clientCurrentUser.set(makeClient(fetch, { host: browserDomain, role: "current_user" }));
    settings = Map({ accentOpen: false, color, spinnyLogo });
    settings = settings.set(`accent_${color}`, accent);
    updateSettings();

    updateLocalStorage = settings => {
      if ($session.userId) {
        for (let prop of updateProps) {
          settings.get(prop) !== undefined && localStorage.setItem(`${prop}_${$session.userId}`, settings.get(prop));
        }
      }
    };

    updateSession = () => {
      let theme = new URLSearchParams();
      for (let prop of updateProps) {
        theme.append(prop, localStorage.getItem(`${prop}_${$session.userId}`));
      }
      fetch("/updatetheme", {
        method: "POST",
        body: theme,
        headers: {
          "Content-type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
      });
    };
  });

  let updateProps;
  $: font = query.font;
  $: logo = query.logo;
  $: color = settings.get("color") || query.color;
  $: accent = settings.get(`accent_${color}`) || query.accent;
  $: updateProps = [`accent_${color}`, `color`, `spinnyLogo`];
  $: settings = settings.set("spinnyLogo", spinnyLogo);
  $: updateLocalStorage(settings);

  $: queryString =
    "?" +
    Object.entries(query)
      .filter(([k, v]) => v)
      .map(([k, v], _) => `${k}=${v}`)
      .join("&");
  const update = () => goto(queryString);

  function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }

  function rgbToHex({ r, g, b }) {
    return componentToHex(r) + componentToHex(g) + componentToHex(b);
  }

  let timer = {};

  function debounce(setting, value) {
    timer[setting] && clearTimeout(timer[setting]);
    timer[setting] = setTimeout(() => {
      settings = settings.set(setting, value);
    }, 200);
  }
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
  <link rel="stylesheet" type="text/css" href="themes/color/default.css" />
  <link rel="stylesheet" type="text/css" href="themes/font/standard.css" />
  <link rel="stylesheet" type="text/css" href="themes/color/{color}.css" />
  <link rel="stylesheet" type="text/css" href="themes/font/{font}.css" />
  {#if accent}
    <link rel="stylesheet" type="text/css" href="themes/accent/{accent}.css?{logo ? `logo=${logo}` : ``}" />
  {/if}
  <link rel="stylesheet" type="text/css" href="global.css" />
  <title>{makeTitle()}</title>
</svelte:head>

<svelte:window on:resize="{correctMobileHeight}" bind:innerWidth="{windowWidth}" />

<div class="layout" class:locked="{navVisible}">
  <Header {segment} user="{$session}" bind:navVisible bind:showSettings {spinnyLogo} />

  <main>
    <slot />
  </main>

  <Footer {committee} />
  {#if showSettings}
    <Popup
      on:close="{() => {
        showSettings = false;
        updateSession();
      }}"
    >
      <button on:click="{() => (settings = settings.update('accentOpen', x => !x))}">Change accent colour</button>
      <label>
        Theme
        <select
          value="{settings.get('color')}"
          on:blur="{event => (settings = settings.set('color', event.target.value))}"
        >
          <option value="default">Default (system settings)</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      <label>
        Spinny logo
        <input type="checkbox" bind:checked="{spinnyLogo}" />
      </label>
    </Popup>
  {/if}
  {#if settings.get('accentOpen')}
    <Popup on:close="{() => (settings = settings.set('accentOpen', false))}" width="auto">
      <HsvPicker
        startColor="{accent}"
        on:colorChange="{event => debounce(`accent_${color}`, rgbToHex(event.detail))}"
      />
    </Popup>
  {/if}
</div>
