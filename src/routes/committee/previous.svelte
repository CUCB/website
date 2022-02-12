<script context="module" lang="ts">
  import { handleErrors, GraphQLClient } from "../../graphql/client";
  import { pastCommitteePictures } from "../../graphql/committee";
  import type { LoadInput, LoadOutput } from "@sveltejs/kit";
  import { DateTime } from "luxon";

  interface Committee<DateOrString> {
    started: DateOrString;
    committee_members: CommitteeMember[];
  }

  interface CommitteeMember {
    name: string;
    pic: string | null;
    sub_position: string | null;
    comments: string | null;
    email_obfus: string;
    april_fools_dir: string | null;
    april_fools_only: boolean;
    committee_key: {
      name: string;
    };
    committee: {
      pic_folder: string;
    };
    position: {
      name: string;
    };
  }

  function parseStartedDate(committee: Committee<string>): Committee<DateTime> {
    return { ...committee, started: DateTime.fromISO(committee.started) };
  }

  export async function load({
    page: { query },
    fetch,
  }: LoadInput): Promise<LoadOutput<{ committees: Committee<DateTime>[]; aprilFools: boolean }>> {
    let aprilFools = query.get("aprilfool") !== null;
    let client = new GraphQLClient(fetch);
    try {
      let res = await client.query<{ cucb_committees: Committee<string>[] }>({ query: pastCommitteePictures });
      return { props: { aprilFools, committees: res.data.cucb_committees.map(parseStartedDate) } };
    } catch (e) {
      return handleErrors(e);
    }
  }
</script>

<script lang="ts">
  import { committee, makeTitle } from "../../view";
  import Person from "../../components/Committee/Person.svelte";
  export let committees: Committee<DateTime>[], aprilFools: boolean;
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
    {committee.started.year}/{(committee.started.year + 1).toString().slice(-2)}
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
