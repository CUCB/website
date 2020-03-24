<svelte:options immutable={false}/>

<script>
    import Entry from "./Entry.svelte";
    import { Map, List } from "immutable";

    export let people;
    export let gigId;
    export let client;
    export let updaters;

    let peopleStore = Map(people);
    $: updateEntries = peopleStore
        .mapEntries(([id, _]) => [id, updateEntryImmutable(id)])
        .toObject();
    let errors = List();

    const wrap = (userId, fn) => async (...args) => {
        let res = await fn(
            { client, people: peopleStore, errors, gigId, userId },
            ...args
        );

        peopleStore = res.people;
        errors = res.errors;
    };

    const updateEntryImmutable = userId => {
        return {
            instruments: {
                setApproved: wrap(userId, updaters.setInstrumentApproved)
            },
            setRole: wrap(userId, updaters.setRole)
        };
    };
</script>

{#each Object.entries(peopleStore.toObject()) as [id, person]}
    <Entry {person} updateEntry="{updateEntries[id]}" />
{/each}
<ul>
    {#each errors.toArray() as error}
        <li>{error}</li>
    {/each}
</ul>
