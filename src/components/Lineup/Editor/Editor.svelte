<script>
  import Entry from "./Entry.svelte";
  import { Map, List } from "immutable";
  import { cache } from "../../../state";

  export let people;
  export let gigId;
  export let client;
  export let updaters;

  let peopleStore = Map(people);
  let errors = List();

  const wrap = (userId, fn) => async (...args) => {
    let res = await fn(
      { client, people: peopleStore, errors, gigId, userId },
      ...args,
    );

    peopleStore = res.people;
    errors = res.errors;
  };

  const updateEntry = cache(userId => ({
    instruments: {
      setApproved: wrap(userId, updaters.setInstrumentApproved),
    },
    setRole: wrap(userId, updaters.setRole),
  }));
</script>

<svelte:options immutable="{false}" />
{#each Object.entries(peopleStore.toObject()) as [id, person] (id)}
  <Entry {person} updateEntry="{updateEntry(id)}" />
{/each}
<ul>
  {#each errors.toArray() as error}
    <li>{error}</li>
  {/each}
</ul>
