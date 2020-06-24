<style>
  nav {
    display: flex;
    justify-content: center;
    background: rgba(var(--accent_triple), 0.1);
    overflow: auto;
    flex-wrap: wrap;
    border-radius: 5px;
    margin-bottom: 0.5em;
  }

  nav a:first-child {
    padding-left: 0;
  }

  nav a {
    padding: 0 10px;
    text-transform: lowercase;
  }

  @media only screen and (max-width: 600px) {
    nav a {
      font-size: 1.3em;
    }
  }
</style>

<script context="module">
  import { notLoggedIn } from "../../client-auth.js";
  export function preload(_, session) {
    if (notLoggedIn.bind(this)(session)) return;
  }
</script>

<nav>
  <a href="/members/gigs/search">gig diary</a>
  <a href="/members/music">music</a>
  <a href="/members/whoswho">who's who</a>
  <a href="/faqs/members">FAQs</a>
  <a href="/members/resources/">Resources</a>
  <a href="/session/">Sessions</a>
  <a href="/members/user/">My Profile!</a>
</nav>
<slot />
