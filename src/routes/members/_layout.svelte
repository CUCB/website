<script context="module">
  import { notLoggedIn } from "../../client-auth";
  import { makeClient } from "../../graphql/client";
  import { QueryPrefsLike } from "../../graphql/prefs";
  import { prefs } from "../../state";

  export async function preload(_, session) {
    if (notLoggedIn.bind(this)(session)) return;

    let clientCurrentUser = makeClient(this.fetch, {
      role: "current_user",
    });
    let res = await clientCurrentUser.query({
      query: QueryPrefsLike,
      variables: { name: "%" },
    });

    if (!res.data) {
      // Don't properly fail, we can live without the information, but show an error
      console.error(res);
    } else {
      let prefs_ = {};
      for (let pref of res.data.cucb_users[0].prefs) {
        prefs_[pref.pref_type.name] = pref.value;
      }

      prefs.set(prefs_);
    }
  }
</script>

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

<nav>
  <a href="/members/gigs">gig diary</a>
  <a href="/members/music">music</a>
  <a href="/members/whoswho">who's who</a>
  <a href="/faqs/members">FAQs</a>
  <a href="/members/resources/">resources</a>
  <a href="/session/">sessions</a>
  <a href="/members/user/">my profile!</a>
</nav>
<slot />
