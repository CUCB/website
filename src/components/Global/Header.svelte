<script>
  import Nav from "./Nav.svelte";
  import Logo from "./Logo.svelte";
  import { fade } from "svelte/transition";
  import { tweened } from "svelte/motion";
  import { sineInOut } from "svelte/easing";
  import { onMount } from "svelte";
  export let segment;
  export let user;
  export let showSettings = false;
  export let spinnyLogo;
  let animate = false;
  let button;
  let cog;
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

<style>
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

  header.hidden h1,
  header.hidden #logo-link {
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
    color: #222;
    color: var(--text_color);
    border-bottom: none;
  }

  a:hover {
    color: #222;
    color: var(--text_color);
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
      background-color: white;
      background-color: var(--background);
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

    :global(header nav) {
      position: fixed;
      top: 0;
      left: 0;
      padding-bottom: 4rem;
      height: 100%;
      width: 100%;
      grid-area: unset;
      z-index: 5;
      background-color: rgba(255, 255, 255, 0.9);
      background-color: rgba(var(--background_triple), 0.9);
      margin: 0;
      box-sizing: border-box;
    }
  }
</style>

<svelte:head>
  <noscript>{`<` + `style>.hidden > *{display: none};</` + `style>`}</noscript>
</svelte:head>
<header class:hidden="{!animate}">
  <a href="/" id="logo-link">
    <Logo id="logo" enableSpin="{spinnyLogo}" />
  </a>
  {#if animate}
    <h1 id="title" in:fade>
      <a href="/">Cambridge University Ceilidh Band</a>
    </h1>
    {#if user.userId && window && window.CSS && window.CSS.supports('color', 'var(--primary)')}
      <button
        id="settingsToggle"
        in:fade
        bind:this="{cog}"
        on:click="{() => {
          showSettings = !showSettings;
          cog.blur();
        }}"
        aria-label="Settings"
      >
        <i
          class="las la-cog"
          style="transform:rotate({$cogRotation}deg)"
          on:mouseover="{() => cogRotation.update(x => x + 60)}"
          on:touchstart="{() => cogRotation.update(x => x + 60)}"
        ></i>
      </button>
    {/if}
  {:else}
    <a href="/" id="logo-link" style="visibility:hidden">
      <Logo id="logo" enableSpin="{spinnyLogo}" />
    </a>
    <h1 id="title" style="visibility:hidden">Cambridge University Ceilidh Band</h1>
    <noscript>
      <h1 id="title" in:fade>
        <a href="/">Cambridge University Ceilidh Band</a>
      </h1>
    </noscript>
  {/if}
  <div class="button-background">
    <button bind:this="{button}" on:click="{toggleNav}" id="navToggle">{navVisible ? 'hide' : 'menu'}</button>
  </div>
  <Nav {segment} {user} visible="{navVisible}" on:click="{() => (navVisible ? toggleNav() : undefined)}" />
</header>
