<script lang="ts">
  import Nav from "./Nav.svelte";
  import Logo from "./Logo.svelte";
  import { fade } from "svelte/transition";
  import { tweened } from "svelte/motion";
  import { sineInOut } from "svelte/easing";
  import { onMount } from "svelte";
  import { themeName } from "../../view";
  // TODO improve typing
  export let user: any;
  export let showSettings = false;
  export let spinnyLogo: boolean;
  let animate = false;
  let button: any;
  let cog: any;
  let cogRotation = tweened(0, { duration: 200, easing: sineInOut });
  export let navVisible = false;
  let toggleNav = () => {
    navVisible = !navVisible;
    button.blur();
  };

  onMount(() => {
    animate = true;
  });
</script>

<style lang="scss">
  @import "../../sass/themes.scss";

  header {
    display: flex;
    flex-wrap: wrap;
    text-align: center;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
  }
  @supports (display: grid) {
    header {
      display: grid;
      grid-template-areas:
        "logo title settingsButton"
        "nav nav nav";
      grid-template-columns: 1fr 4fr minmax(0, 1fr);
    }
    :global(#logo) {
      max-width: 150px;
      grid-area: logo;
    }
  }

  header.hidden > h1 {
    visibility: hidden;
  }

  @media (max-width: 800px) {
    header {
      grid-template-columns: 1fr 5fr auto;
    }
  }

  #logo-link {
    flex: 150px 0 3;
  }

  :global(#logo) {
    width: 100%;
  }

  h1 {
    margin: 0 0.5em;
    flex: 70% 1 1;
  }

  #title {
    justify-self: center;
    grid-area: title;
    user-select: none;
  }

  :global(nav) {
    grid-area: nav;
  }

  .button-background {
    display: none;
  }

  #navToggle {
    background: none;
    border-radius: 5px;
    grid-area: navButton;
    cursor: pointer;
  }

  #settingsToggle {
    grid-area: settingsButton;
    border: none;
    cursor: pointer;
    width: auto;
    height: auto;
    padding: 0;
    margin: 0;
    justify-self: flex-end;
    font-size: 2rem;
  }

  #settingsToggle:focus,
  #settingsToggle:active {
    border: unset;
    box-shadow: unset;
    outline: none;
  }

  a {
    @include themeify($themes) {
      &,
      &:hover {
        color: themed("textColor");
      }
    }
    border-bottom: none;
    text-decoration: none;
  }

  a#logo-link:hover {
    filter: none;
  }

  @media only screen and (max-width: 1200px) {
    #logo-link {
      flex-basis: 100px;
    }
    :global(#logo) {
      max-width: 100px;
    }
  }

  @media only screen and (max-width: 600px) {
    header {
      flex-wrap: nowrap;
    }
    h1 {
      margin: 0;
      flex-basis: 90%;
    }

    .button-background {
      @include themeify($themes) {
        background-color: themed("background");
      }
      height: 3rem;
      width: 100%;
      position: fixed;
      bottom: 0;
      left: 0;
      padding: 5px;
      box-sizing: border-box;
      z-index: 10;
      display: flex;
      align-items: center;
    }

    button {
      width: 4em;
      font-size: 1.5rem;
      padding: 2px 0;
      margin: auto;
      font-family: "Linux Biolinum Regular";
      font-family: var(--title);
    }
  }
</style>

<svelte:head>
  <noscript>
    {@html `<` + `style>header > h1{display: none}</` + `style>`}
  </noscript>
</svelte:head>
<header class:hidden="{!animate}" class="theme-{$themeName}">
  <a href="/" id="logo-link" aria-label="CUCB logo">
    <Logo id="logo" enableSpin="{spinnyLogo}" />
  </a>
  {#if animate}
    <h1 id="title" in:fade><a href="/">Cambridge University Ceilidh Band</a></h1>
    {#if user.userId && window && window.CSS && window.CSS.supports("color", "var(--primary)")}
      <button
        id="settingsToggle"
        in:fade
        bind:this="{cog}"
        on:click="{() => {
          showSettings = !showSettings;
          cog.blur();
        }}"
        aria-label="Settings"
        tabindex="0"
        data-test="settings-cog"
      >
        <i
          class="las la-cog"
          style="transform:rotate({$cogRotation}deg)"
          on:mouseover="{() => cogRotation.update((x) => x + 60)}"
          on:touchstart="{() => cogRotation.update((x) => x + 60)}"></i>
      </button>
    {/if}
  {:else}
    <h1 id="title">Cambridge University Ceilidh Band</h1>
    <noscript>
      <h1 id="title"><a href="/">Cambridge University Ceilidh Band</a></h1>
    </noscript>
  {/if}
  <div class="button-background">
    <button bind:this="{button}" on:click="{toggleNav}" id="navToggle">{navVisible ? "hide" : "menu"}</button>
  </div>
  <Nav user="{user}" visible="{navVisible}" on:click="{() => (navVisible ? toggleNav() : undefined)}" />
</header>
