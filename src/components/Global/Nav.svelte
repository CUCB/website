<script>
  import { stores } from "@sapper/app";
  let { page } = stores();
  $: segment = $page.path.split("/")[1];
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
      background-color: rgb(7, 92, 1);
      background-color: var(--accent);
      display: block;
      bottom: -1px;
    }

    .split {
      margin-left: auto;
    }
    a {
      padding: 0.5em;
    }
  }
  nav a {
    display: block;
    color: rgb(7, 92, 1);
    color: var(--accent);
    font-size: 1.2em;
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

    nav a {
      font-size: 1.5rem;
      line-height: 1.5;
      padding: 0.4em 0;
    }

    [aria-current] {
      background: rgba(7, 92, 1, 0.2);
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
  <a aria-current="{!segment ? 'page' : undefined}" href="." rel="prefetch">Home</a>
  <a aria-current="{segment === 'book' ? 'page' : undefined}" href="book" rel="prefetch">Book us!</a>
  <a aria-current="{segment === 'join' ? 'page' : undefined}" href="join" rel="prefetch">Join us!</a>
  <a aria-current="{segment === 'committee' ? 'page' : undefined}" href="committee" rel="prefetch">Committee</a>

  {#if user.userId}
    <a aria-current="{segment === 'members' ? 'page' : undefined}" href="members" rel="prefetch">Members</a>
    <a href="auth/logout" class="split">Log out</a>
  {:else}
    <a aria-current="{segment === 'auth' ? 'page' : undefined}" class="split" href="/auth/login" rel="external">
      Log in
    </a>
  {/if}
</nav>
