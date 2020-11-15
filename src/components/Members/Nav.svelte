<style>
  nav {
    display: flex;
    justify-content: center;
    background: rgba(var(--accent_triple), 0.05);
    overflow: auto;
    flex-wrap: wrap;
    border-radius: 5px;
    margin-bottom: 0.5em;
  }

  nav a {
    font-size: 1.3em;
    padding: 0.1em 0.6em;
  }

  @media only screen and (min-width: 601px) {
    nav a {
      padding: 0.15em 0.7em;
    }

    .only-mobile {
      display: none;
    }
  }
</style>

<nav class="subnav">
  <a href="/members" class="only-mobile">Gig signup</a>
  <a href="/members/gigs">Gig diary</a>
  <a href="/members/music">Music</a>
  <a href="/members/whoswho">Who's who</a>
  <a href="/faqs/members">FAQs</a>
  <a href="/members/resources/">Resources</a>
  <a href="/session/">Sessions</a>
  <a href="/members/user/">My profile!</a>
</nav>
