<script lang="ts">
  import type { Instrument } from "../../routes/members/users[id=integer]/types";

  import { createEventDispatcher } from "svelte";

  export let allInstruments: Instrument[];

  console.log(allInstruments);
  let parents = allInstruments.filter((i) => i.parent_id === null);
  let instrumentsByParent: Record<string, Instrument[]> = {};
  parents.forEach((i) => (instrumentsByParent[i.id] = []));
  console.log(parents);
  allInstruments.filter((i) => i.parent_id !== null).forEach((i) => instrumentsByParent[i.parent_id].push(i));

  const dispatch = createEventDispatcher();

  function select(id: string): (e: Event) => void {
    return (_) => dispatch("select", { id });
  }
</script>

<style lang="scss">
  // TODO extract this out into somewhere where it can be reused
  @import "../../sass/themes.scss";
  .link:focus,
  .link > span:focus {
    outline: none;
    box-shadow: none;
  }

  button.link:hover {
    filter: none;
  }
  button.link {
    border-top: none;
    border-left: none;
    border-right: none;
    border-radius: 0;
    padding-left: 0;
    padding-right: 0;
    height: auto;
    width: auto;
  }

  .link:focus > span {
    outline: 2px solid;
    @include themeify($themes) {
      outline-color: themed("textColor");
    }
    outline-offset: 0.15em;
  }
</style>

<ul>
  {#each parents as parent}
    <li>
      {#if parent.parent_only}
        {parent.name}
      {:else}
        <button data-test="add-instrument-{parent.id}" class="link" on:click="{select(parent.id)}">{parent.name}</button
        >
        [{parent.count}]
      {/if}
      {#if instrumentsByParent[parent.id]?.length > 0}
        <ul>
          {#each instrumentsByParent[parent.id] as instrument}
            <li>
              <button data-test="add-instrument-{instrument.id}" class="link" on:click="{select(instrument.id)}"
                >{instrument.name}</button
              >
              [{instrument.count}]
            </li>
          {/each}
        </ul>
      {/if}
    </li>
  {/each}
</ul>
