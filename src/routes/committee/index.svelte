<script context="module">
  import { makeClient, handleErrors } from "../../graphql/client";
  import { currentCommitteePictures } from "../../graphql/committee";
  export async function load({ page: { query }, fetch, session }) {
    let { aprilfool } = query;
    let client = makeClient(fetch);
    let res;
    try {
      res = await client.query({ query: currentCommitteePictures });
      return { props: { aprilFools: aprilfool !== undefined, committee: res.data.cucb_committees[0].committee_members } };
    } catch (e) {
      return handleErrors(e, session);
    }
  }
</script>

<script>
  import { makeTitle } from "../../view";
  import Person from "../../components/Committee/Person.svelte";
  export let committee, aprilFools;
</script>

<style>
  cucb-committee {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
  }
</style>

<svelte:head>
  <title>{makeTitle('Committee')}</title>
</svelte:head>
<h1>Committee</h1>

<p>
  Click on a name to email that person. (Previous committees can be found by
  <a href="/committee/previous">clicking here</a>
  .)
</p>

<cucb-committee>
  {#each committee as person}
    <Person {person} {aprilFools} showEmail="true" />
  {/each}
</cucb-committee>
