<style>
  header {
    display: grid;
    grid-template-areas:
      "logo title"
      "nav nav";
    align-items: center;
  }

  #logo {
    max-width: 160px;
    grid-area: logo;
  }

  #title {
    grid-area: title;
  }

  :global(nav) {
    grid-area: nav;
  }
</style>

<script>
  import Nav from "./Nav.svelte";
  export let segment;
</script>

<header>
  <img id="logo" src="/logo.svg" alt="Band logo" />
  <h1 id="title">Cambridge University Ceilidh Band</h1>
  <Nav {segment} />
</header>
