<script lang="ts">
  import { stores } from "@sapper/app";
  import { themeName } from "../../view";
  let { page } = stores();
  $: segment = $page.path.split("/")[1];
  export let user: any;
  export let visible: boolean;

  let wasVisible: boolean;
  let navClass: string | undefined;
  $: wasVisible = visible || wasVisible;
  $: navClass = visible ? "visible" : navClass;
  $: wasVisible && !visible && (navClass = "hiding") && window.setTimeout(() => (navClass = undefined), 200);
</script>

<style lang="scss">
  @import "../../sass/themes.scss";
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
      @include themeify($themes) {
        background-color: themed("accent");
        background-color: var(--accent);
      }
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
  a {
    display: block;
    @include themeify($themes) {
      color: themed("accent");
      color: var(--accent);
    }
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
      position: fixed;
      top: 0;
      left: 0;
      padding-bottom: 4rem;
      height: 100%;
      width: 100%;
      grid-area: unset;
      z-index: 5;
      @include themeifyThemeElement($themes) {
        background-color: rgba(themed("background"), 0.9);
      }
      margin: 0;
      box-sizing: border-box;
    }

    nav a {
      font-size: 1.5rem;
      line-height: 1.5;
      padding: 0.4em 0;
    }

    [aria-current] {
      @include themeify($themes) {
        background: rgba(themed("accent"), 0.2);
        background: rgba(var(--accent_triple), 0.2);
      }
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

<nav on:click class="{navClass} theme-{$themeName}" aria-label="Main menu">
  <a href="." aria-current="{!segment ? 'page' : undefined}">Home</a>
  <a aria-current="{segment === 'book' ? 'page' : undefined}" href="book">Book us!</a>
  <a aria-current="{segment === 'join' ? 'page' : undefined}" href="join">Join us!</a>
  <a aria-current="{segment === 'committee' ? 'page' : undefined}" href="committee">Committee</a>

  {#if user.userId}
    <!-- Don't prefetch members since it causes cache invalidation issues (see issue #50) -->
    <a aria-current="{segment === 'members' ? 'page' : undefined}" href="members">Members</a>
    <a href="auth/logout" class="split">Log out</a>
  {:else}
    <a aria-current="{segment === 'auth' ? 'page' : undefined}" class="split" href="/auth/login" rel="external">
      Log in
    </a>
  {/if}
</nav>
