<script>
  import { makeTitle } from "../../view";
  import Person from "../../components/Committee/Person.svelte";
  export let data;
  const { committee, aprilFools } = data;
</script>

<style>
  div {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
  }
</style>

<svelte:head>
  <title>{makeTitle("Committee")}</title>
</svelte:head>
<h1>Committee</h1>

<p>
  Click on a name to email that person. (Previous committees can be found by
  <a href="/committee/previous">clicking here</a>.)
</p>

<div>
  {#each committee as person}
    <Person person="{person}" aprilFools="{aprilFools}" showEmail="{true}" />
  {/each}
</div>
