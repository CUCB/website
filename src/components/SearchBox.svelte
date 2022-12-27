<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type Fuse from "fuse.js";

  type T = $$Generic<unknown>;
  type Id = $$Generic<unknown>;

  export let placeholder: string,
    fuse: Fuse<T>,
    toDisplayName: (_: T) => string,
    toId: (_: T) => Id,
    disabled = false;
  let searchField: HTMLInputElement,
    searchText = "",
    resultsList: HTMLElement;
  export const clearSearch = (): void => {
    searchText = "";
  };
  const dispatch = createEventDispatcher();

  $: searchResults = (searchText.length >= 3 && fuse.search(searchText)) || [];

  function first(e: KeyboardEvent) {
    if (e.key === "ArrowDown") {
      let firstChild = resultsList.childNodes[0] as HTMLButtonElement | null;
      if (firstChild) {
        firstChild.focus();
      }
    }
  }

  function next(e: KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      (document.activeElement?.nextSibling as HTMLElement)?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (e.target === resultsList.childNodes[0]) {
        searchField.focus();
      } else {
        (document.activeElement?.previousSibling as HTMLElement)?.focus();
      }
    } else if (e.key === "Space") {
      e.preventDefault();
      (document.activeElement as HTMLElement).click();
    }
  }

  function selectItem(id: Id) {
    return () => {
      dispatch("select", { id });
      searchText = "";
    };
  }
</script>

<style>
  * {
    width: 100%;
    box-sizing: border-box;
  }

  button {
    border: none;
    text-align: left;
    margin: 0.2em;
    height: auto;
    background: none;
  }
</style>

<input
  type="text"
  placeholder="{placeholder}"
  data-test="{$$props['data-test'] && `${$$props['data-test']}-search`}"
  aria-label="{$$props['aria-label']}"
  bind:value="{searchText}"
  on:keydown="{first}"
  bind:this="{searchField}"
  disabled="{disabled}"
/>
<div bind:this="{resultsList}" data-test="{$$props['data-test'] && `${$$props['data-test']}-search-results`}">
  {#each searchResults.map((result) => result.item) as result}
    <button
      class="link"
      data-test="{$$props['data-test'] && `${$$props['data-test']}-search-result`}"
      on:click="{selectItem(toId(result))}"
      on:keydown="{next}"
    >
      {toDisplayName(result)}
    </button>
  {/each}
</div>
