<script context="module">
  import { makeClient, handleErrors } from "../../../../graphql/client";
  import { QueryGigDetails } from "../../../../graphql/gigs";

  export async function preload({ params }) {
    let { gig_id } = params;
    let client = await makeClient(this.fetch);

    let res;
    let title;
    try {
      res = await client.query({
        query: QueryGigDetails,
        variables: { gig_id },
      });
    } catch (e) {
      await handleErrors.bind(this)(e);
      return;
    }

    if (res && res.data && res.data.cucb_gigs_by_pk) {
      title = res.data.cucb_gigs_by_pk.title;
    } else {
      this.error(404, "Gig not found");
      return;
    }

    return { title };
  }
</script>

<script>
  export let title;
</script>

<h2>{title}</h2>
<slot />
