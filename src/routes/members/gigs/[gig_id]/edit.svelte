<script context="module">
  import { notLoggedIn } from "../../../../client-auth";
  import { makeClient } from "../../../../graphql/client";

  export async function preload({ params }, session) {
    let { gig_id } = params;

    if (notLoggedIn.bind(this)(session)) return;

    let client = makeClient(this.fetch);
  }
</script>
