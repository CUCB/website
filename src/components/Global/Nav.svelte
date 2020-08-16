<script>
  export let segment;
  export let user;
  export let visible;

  $: wasVisible = visible || wasVisible;
  $: navClass = visible ? "visible" : navClass;
  $: wasVisible && !visible && (navClass = "hiding") && window.setTimeout(() => (navClass = undefined), 200);
</script>

<style>
  nav {
    display: flex;
  }

  nav * {
    user-select: none;
  }

  @media only screen and (min-width: 601px) {
    a:first-child {
      margin-left: -0.5em;
    }

    [aria-current] {
      position: relative;
      display: inline-block;
    }

    [aria-current]::after {
      position: absolute;
      content: "";
      width: calc(100% - 1em);
      height: 2px;
      background-color: var(--accent);
      display: block;
      bottom: -1px;
    }

    .split {
      margin-left: auto;
    }
    a,
    button {
      padding: 0.5em;
    }
  }
  a,
  button {
    display: block;
    color: var(--accent);
  }

  nav a,
  nav button {
    font-size: 1.2em;
  }

  button {
    border: none;
    font-family: var(--title);
    background: none;
  }

  button:hover {
    filter: brightness(110%);
  }

  button:focus {
    box-shadow: none;
    outline: 1px dotted black;
  }

  @media only screen and (max-width: 600px) {
    nav {
      transition: visibility 0s, opacity 0.2s;
      flex-direction: column;
      justify-content: flex-end;
      justify-items: stretch;
      visibility: hidden;
      opacity: 0;
    }

    nav a,
    nav button {
      font-size: 1.5rem;
      line-height: 1.5;
      padding: 0.4em 0;
    }

    button {
      height: unset;
      width: unset;
      line-height: 1.5;
    }

    button:active {
      background: rgba(var(--form_triple), 0.3);
      outline: none;
    }

    [aria-current] {
      background: rgba(var(--accent_triple), 0.2);
    }

    .visible {
      opacity: 1;
      visibility: visible;
    }

    .hiding {
      opacity: 0;
      visibility: visible;
    }
  }
</style>

<nav on:click class="{navClass}" aria-hidden="{!visible}">
  <a aria-current="{segment === undefined ? 'page' : undefined}" href="." rel="prefetch">Home</a>
  <a aria-current="{segment === 'book' ? 'page' : undefined}" href="book" rel="prefetch">Book us!</a>
  <a aria-current="{segment === 'join' ? 'page' : undefined}" href="join" rel="prefetch">Join us!</a>
  <a aria-current="{segment === 'committee' ? 'page' : undefined}" href="committee" rel="prefetch">Committee</a>

  {#if user.userId}
    <a aria-current="{segment === 'members' ? 'page' : undefined}" href="members" rel="prefetch">Members</a>
    <a href="auth/logout" class="split">Log out</a>
  {:else}
    <button class="split" on:click="{() => (window.location.href = '/auth/login')}">Log in</button>
  {/if}
</nav>
