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

  .button-background {
    display: none;
  }

  button {
    background: none;
    border-radius: 5px;
    grid-area: navButton;
    cursor: pointer;
  }

  @media only screen and (max-width: 600px) {
    .button-background {
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
      font-family: var(--title);
    }

    :global(nav) {
      position: fixed;
      top: 0;
      left: 0;
      padding-bottom: 4rem;
      height: 100%;
      width: 100%;
      grid-area: unset;
      z-index: 5;
      background-color: #ffffffe7;
      margin: 0;
      box-sizing: border-box;
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
  export let navVisible = false;
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
  <div class="button-background">
    <button bind:this="{button}" on:click="{toggleNav}">
      {navVisible ? 'hide' : 'menu'}
    </button>
  </div>
  <Nav
    {segment}
    {user}
    visible="{navVisible}"
    on:click="{() => (navVisible ? toggleNav() : undefined)}"
  />
</header>
