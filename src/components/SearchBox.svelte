<script>
  import { createEventDispatcher } from "svelte";

  export let placeholder, fuse, toDisplayName, toId;
  let searchField, searchText, resultsList;
  const dispatch = createEventDispatcher();

  $: searchResults = searchText.length >= 3 && fuse.search(searchText);

  function first(e) {
    if (e.which === 40) {
      searchedVenuesList.childNodes[0].focus();
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
      if (e.target === searchedVenuesList.childNodes[0]) {
        searchVenuesField.focus();
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

<input
  type="text"
  placeholder="{placeholder}"
  data-test="{$$props['data-test'] && `${$$props['data-test']}-search`}"
  bind:value="{searchText}"
  on:keydown="{first}"
  bind:this="{searchField}"
/>
<div bind:this="{resultsList}">
  {#each searchResults as result}
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
