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

<script>
  import MembersNav from "../../components/Members/Nav.svelte";
</script>

<MembersNav />
<slot />
