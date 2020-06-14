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

  a:first-child {
    padding-left: 0;
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
      overflow: hidden;
      transition: max-height 0.7s;
      flex-direction: column;
      position: relative;
      top: 0;
    }
    nav.hidden {
      max-height: 0;
    }
    nav.visible {
      max-height: 400px;
      animation: fadeIn ease-in-out 0.3s;
    }
    @keyframes fadeIn {
      0% {
        opacity: 0;
      }
      100% {
        opacity: 1;
      }
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

  $: navClass = visible ? "visible" : "hidden";

  let transitions = 0;
  const transitionDelay = () => 100 * transitions++;
</script>

<nav class="{navClass}" on:click>
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

  <!-- for the blog link, we're using rel=prefetch so that Sapper prefetches
	     the blog data when we hover over the link or tap it on a touchscreen
	<a rel=prefetch aria-current='{segment === "blog" ? "page" : undefined}' href='blog'>blog</a>  -->
</nav>
<!-- </div> -->
