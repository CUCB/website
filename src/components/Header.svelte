<style>
  header {
    display: grid;
    grid-template-areas:
      "logo title navButton"
      "nav nav nav";
    align-items: center;
    text-align: center;
    grid-template-columns: 1fr 4fr minmax(0, 1fr);
    width: 100%;
    box-sizing: border-box;
  }

  @media (max-width: 800px) {
    header {
      grid-template-columns: 1fr 5fr auto;
    }
  }

  :global(#logo) {
    max-width: 150px;
    width: 100%;
    grid-area: logo;
  }

  #title {
    justify-self: center;
    grid-area: title;
    user-select: none;
  }

  :global(nav) {
    grid-area: nav;
  }
  button {
    background: none;
    border-radius: 5px;
    display: none;
    grid-area: navButton;
    cursor: pointer;
  }

  @media only screen and (max-width: 600px) {
    button {
      display: unset;
      align-self: center;
      width: 4em;
      padding: 2px 0;
    }
  }
</style>

<script>
  import Nav from "./Nav.svelte";
  import Logo from "./Logo.svelte";
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  export let segment;
  export let user;
  let animate = false;
  let button;
  let navVisible = false;
  let toggleNav = () => {
    navVisible = !navVisible;
    button.blur();
  };

  onMount(() => {
    animate = true;
  });
</script>

<header>
  <Logo id="logo" />
  {#if animate}
    <h1 id="title" in:fade>Cambridge University Ceilidh Band</h1>
  {:else}
    <noscript>
      <h1 id="title">Cambridge University Ceilidh Band</h1>
    </noscript>
  {/if}
  <button bind:this="{button}" on:click="{toggleNav}">
    {navVisible ? 'hide' : 'menu'}
  </button>
  <Nav
    {segment}
    {user}
    visible="{navVisible}"
    on:click="{() => (navVisible ? toggleNav() : undefined)}"
  />
</header>
