<script>
  import Entry from "./Entry.svelte";
  import { cache } from "../../../../state";

  export let people;
  export let updaters;

  const updateEntry = cache(userId => ({
    instruments: {
      setApproved: updaters.setInstrumentApproved(userId),
    },
    setRole: updaters.setRole(userId),
    setApproved: updaters.setApproved(userId),
    setAdminNotes: updaters.setAdminNotes(userId),
    addInstrument: updaters.addInstrument(userId),
  }));
</script>

<svelte:options immutable />
{#each Object.entries(people) as [id, person] (id)}
  <Entry {person} updateEntry="{updateEntry(id)}" />
{/each}
