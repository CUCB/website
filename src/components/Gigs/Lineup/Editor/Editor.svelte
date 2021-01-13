<script>
  import Entry from "./Entry.svelte";
  import { cache } from "../../../../state";

  export let people;
  export let updaters;

  const updateEntry = cache((userId) => ({
    instruments: {
      setApproved: updaters.setInstrumentApproved(userId),
    },
    setRole: updaters.setRole(userId),
    setApproved: updaters.setApproved(userId),
    setAdminNotes: updaters.setAdminNotes(userId),
    addInstrument: updaters.addInstrument(userId),
  }));
</script>

<style>
    .lineup-editor {
        border: 1px solid;
    }
</style>

<svelte:options immutable />
<div class="lineup-editor">
  {#each Object.entries(people) as [id, person] (id)}
    <Entry person="{person}" updateEntry="{updateEntry(id)}" />
  {/each}
</div>
