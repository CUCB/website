<style>
  nav {
    display: flex;
  }

  [aria-current] {
    position: relative;
    display: inline-block;
  }

  [aria-current]:first-child::after {
    padding-left: 0.5em;
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

  @media only screnn and (min-width: 600px) {
    a:first-child {
      padding-left: 0;
    }
  }

  a {
    text-decoration: none;
    padding: 0.5em;
    display: block;
    color: var(--accent);
  }

  a.split {
    margin-left: auto;
  }

  @media only screen and (max-width: 600px) {
    nav {
      transition: visibility 0s, opacity 0.2s;
      flex-direction: column;
      justify-content: flex-end;
      font-size: 1.5rem;
      visibility: hidden;
      opacity: 0;
    }

    .visible {
      opacity: 1;
      visibility: visible;
    }

    .hiding {
      opacity: 0;
      visibility: visible;
    }

    a.split {
      margin-left: unset;
    }
  }
</style>

<script>
  export let segment;
  export let user;
  export let visible;

  $: wasVisible = visible || wasVisible;
  $: navClass = visible ? "visible" : navClass;
  $: wasVisible &&
    !visible &&
    (navClass = "hiding") &&
    window.setTimeout(() => (navClass = undefined), 200);
</script>

<nav on:click class="{navClass}" aria-hidden="{!visible}">
  <a aria-current="{segment === undefined ? 'page' : undefined}" href=".">
    home
  </a>
  <a aria-current="{segment === 'book' ? 'page' : undefined}" href="book">
    book us!
  </a>
  <a aria-current="{segment === 'join' ? 'page' : undefined}" href="join">
    join us!
  </a>
  <a
    aria-current="{segment === 'committee' ? 'page' : undefined}"
    href="committee"
  >
    committee
  </a>

  {#if user.userId}
    <a
      aria-current="{segment === 'members' ? 'page' : undefined}"
      href="members"
    >
      members
    </a>
    <a href="auth/logout" class="split">log out</a>
  {:else}
    <a href="auth/login" class="split">log in</a>
  {/if}
</nav>
