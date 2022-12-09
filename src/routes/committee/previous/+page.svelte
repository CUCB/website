<script lang="ts">
  import { committee, makeTitle } from "../../../view";
  import Person from "../../../components/Committee/Person.svelte";
  import type { PageData } from "./$types";
  import { DateTime } from "luxon";
  export let data: PageData;
  let { aprilFools } = data;
  let committees = data.committees.map((committee) => ({
    ...committee,
    started: DateTime.fromJSDate(committee.started),
  }));
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
      {#each committee.members as person}
        <Person person="{person}" aprilFools="{aprilFools}" />
      {/each}
    {:else}
      {#each committee.members.filter((person) => !person.april_fools_only) as person}
        <Person person="{person}" />
      {/each}
    {/if}
  </div>
{/each}
