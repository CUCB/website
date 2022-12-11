<script>
  import { themeName } from "../../view";
</script>

<style lang="scss">
  @import "../../sass/themes.scss";
  nav {
    display: flex;
    justify-content: center;
    @include themeifyThemeElement($themes) {
      background: rgba(themed("accent"), 0.05);
      background: rgba(var(--accent_triple), 0.05);
    }
    overflow: auto;
    flex-wrap: wrap;
    border-radius: 5px;
    margin-bottom: 0.5em;
  }

  nav a {
    font-size: 1.1rem;
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

<nav class="subnav theme-{$themeName}" aria-label="Members' submenu">
  <a href="/members" class="only-mobile">Gig signup</a>
  <a href="/members/gigs">Gig diary</a>
  <a href="/members/music">Music</a>
  <a href="/members/whoswho">Who's who</a>
  <a href="/faqs/members">FAQs</a>
  <a href="/members/resources/">Resources</a>
  <a href="/session/">Sessions</a>
  <a href="/members/users">My profile!</a>
</nav>
