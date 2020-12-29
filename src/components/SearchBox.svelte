<script>
  import { createEventDispatcher } from "svelte";

  export let placeholder, fuse, toDisplayName, toId, disabled;
  let searchField,
    searchText = "",
    resultsList;
  export const clearSearch = () => (searchText = "");
  const dispatch = createEventDispatcher();

  $: searchResults = (searchText.length >= 3 && fuse.search(searchText)) || [];

  function first(e) {
    if (e.which === 40) {
      resultsList.childNodes[0] && resultsList.childNodes[0].focus();
    }
  }

  function next(e) {
    if (e.which === 40) {
      // arrow down
      e.preventDefault();
      document.activeElement.nextSibling.focus();
    } else if (e.which === 38) {
      // arrow up
      e.preventDefault();
      if (e.target === resultsList.childNodes[0]) {
        searchField.focus();
      } else {
        document.activeElement.previousSibling.focus();
      }
    } else if (e.which === 32) {
      // spacebar
      e.preventDefault();
      document.activeElement.click();
    }
  }

  function selectItem(id) {
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
</style>

<input
  type="text"
  placeholder="{placeholder}"
  data-test="{$$props['data-test'] && `${$$props['data-test']}-search`}"
  bind:value="{searchText}"
  on:keydown="{first}"
  bind:this="{searchField}"
  disabled="{disabled}"
/>
<div bind:this="{resultsList}" data-test="{$$props['data-test'] && `${$$props['data-test']}-search-results`}">
  {#each searchResults.map((result) => result.item) as result}
    <div
      class="link"
      data-test="{$$props['data-test'] && `${$$props['data-test']}-search-result`}"
      tabindex="0"
      on:click="{selectItem(toId(result))}"
      on:keydown="{next}"
    >
      {toDisplayName(result)}
    </div>
  {/each}
</div>
