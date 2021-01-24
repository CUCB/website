<script context="module">
  import { handleErrors, makeClient } from "../../../graphql/client";
  import { notLoggedIn } from "../../../client-auth.js";
  import { QueryAllGigSignupSummary } from "../../../graphql/gigs";
  import { DateTime, Settings } from "luxon";

  export async function preload(_, session) {
    Settings.defaultZoneName = "Europe/London";

    if (notLoggedIn.bind(this)(session)) return;

    let client = makeClient(this.fetch);

    let res;
    try {
      res = await client.query({
        query: QueryAllGigSignupSummary,
        variables: { since: DateTime.local().minus({ months: 1 }) },
      });
    } catch (e) {
      await handleErrors.bind(this)(e, session);
      return;
    }

    return { sinceOneMonth: res.data.sinceOneMonth.gigs, signupsOpen: res.data.signupsOpen };
  }
</script>

<script>
    Settings.defaultZoneName = "Europe/London";
  import SignupSummary from "../../../components/Gigs/Lineup/SignupSummary.svelte";

  export let sinceOneMonth, signupsOpen;
  const VIEWS = { signupsOpen: {}, sinceOneMonth: {} };
  let view = VIEWS.signupsOpen;
  let gigs = view === VIEWS.signupsOpen ? signupsOpen : sinceOneMonth;
</script>

<SignupSummary gigs="{gigs}" />
