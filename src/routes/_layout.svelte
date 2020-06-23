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
    padding-bottom: 2.5rem;
  }
</style>

<script context="module">
  import { makeClient } from "../graphql/client";

  export async function preload({ query }, session) {
    let client = await makeClient(this.fetch);
    let committee = {};
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
      committee,
    };
  }
</script>

<script>
  import Header from "../components/Header.svelte";
  import Footer from "../components/Footer.svelte";
  import Customiser from "../components/Customiser.svelte";
  import { goto, stores } from "@sapper/app";
  import { client, clientCurrentUser } from "../graphql/client";
  import { onMount, setContext } from "svelte";
  import { readable } from "svelte/store";
  import { disableBodyScroll, enableBodyScroll } from "body-scroll-lock";

  export let segment;
  export let color;
  export let font;
  export let accent;
  export let logo;
  export let committee;

  let query = { color, font, accent, logo };
  let windowWidth;
  let { session } = stores();
  let navVisible;
  $: navVisible && windowWidth <= 600
    ? disableBodyScroll()
    : enableBodyScroll();

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
    clientCurrentUser.set(
      makeClient(fetch, { host: browserDomain, role: "current_user" }),
    );
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

<svelte:window
  on:resize="{correctMobileHeight}"
  bind:innerWidth="{windowWidth}"
/>

<div class="layout" class:locked="{navVisible}">
  <Header {segment} user="{$session}" bind:navVisible />

  <main>
    <slot />
  </main>

  <Footer {committee} />
</div>
