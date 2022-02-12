<script context="module" lang="ts">
  import { handleErrors, GraphQLClient } from "../../graphql/client";
  import { pastCommitteePictures } from "../../graphql/committee";
  import type { LoadInput, LoadOutput } from "@sveltejs/kit";
  export async function load({ page: { query }, fetch }: LoadInput): Promise<LoadOutput> {
    let aprilFools = query.get("aprilfool") !== null;
    let client = new GraphQLClient(fetch);
    let res;
    try {
      res = await client.query({ query: pastCommitteePictures });
      return { props: { aprilFools, committees: res.data.cucb_committees } };
    } catch (e) {
      return handleErrors(e);
    }
  }
</script>

<script>
  import { makeTitle } from "../../view";
  import Person from "../../components/Committee/Person.svelte";
  import { DateTime } from "luxon";
  export let committees, aprilFools;
</script>

<style>
  .members {
    margin-top: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
  }
  hr:first-of-type {
    margin-top: 1.5em;
  }
  hr {
    width: 70%;
  }
  h3 {
    text-align: center;
    font-size: 1.3em;
    padding-top: 0.5em;
  }
</style>

<svelte:head>
  <title>{makeTitle("History")}</title>
</svelte:head>
<h1>A (very) brief history of the band</h1>

<p>
  The Cambridge University Ceilidh Band is a relative newcomer to the folk societies in Cambridge, having only being
  founded in 1994. Since then the band has grown rapidly both in numbers and reputation.
</p>
<h2>Committees Past and Present</h2>
For contact details for the current committee
<a href="/committee">click here</a>
.
{#each committees as committee}
  <hr />
  <h3>
    {DateTime.fromISO(committee.started).year}/{(DateTime.fromISO(committee.started).year + 1).toString().slice(-2)}
  </h3>
  <div class="members">
    {#if aprilFools}
      {#each committee.committee_members as person}
        <Person person="{person}" aprilFools="{aprilFools}" />
      {/each}
    {:else}
      {#each committee.committee_members.filter((person) => !person.april_fools_only) as person}
        <Person person="{person}" />
      {/each}
    {/if}
  </div>
{/each}
