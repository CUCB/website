<script lang="ts">
  import { goto } from "$app/navigation";
  import Fuse from "fuse.js";
  import ProfilePicture from "../../../components/Members/Users/ProfilePicture.svelte";
  import SearchBox from "../../../components/SearchBox.svelte";
  import { makeTitle } from "../../../view";
  import type { PageData } from "./$types";
  export let data: PageData;
  $: ({ currentPage, totalPages, users, profilePicturesUpdated, sort, allNames } = data);

  $: sortByQuery = (sort && `sort=${sort}`) ?? "";
  $: nextPage = `?${sortByQuery}&page=${currentPage + 1}`;
  $: previousPage = `?${sortByQuery}&page=${currentPage - 1}`;

  $: fuse = new Fuse(allNames, {
    ignoreLocation: true,
    threshold: 0.35,
    keys: ["first", "last", "username"],
  });

  $: keyNavigation = (e: KeyboardEvent) =>
    e.key === "ArrowLeft" && currentPage > 1
      ? goto(previousPage, { noScroll: true })
      : e.key === "ArrowRight" && currentPage < totalPages
      ? goto(nextPage, { noScroll: true })
      : null;
</script>

<style>
  .person {
    display: flex;
    flex-direction: column;
    margin: 1em 0em;
    flex-shrink: 1;
    flex-basis: 250px;
    text-align: center;
    align-items: center;
  }

  .people {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-evenly;
  }

  .name {
    margin: 0.5em 0;
  }

  .bio {
    font-size: 0.8em;
    font-style: italic;
  }
  .picture-link:hover {
    filter: none;
  }
  .people :global(img) {
    max-width: 160px;
    height: auto;
  }
</style>

<svelte:window on:keyup="{keyNavigation}" />

<svelte:head>
  <title>{makeTitle("Who's who")}</title>
</svelte:head>

<h1>Who's who in CUCB</h1>

<p>
  We know it can be a bit tricky to keep track of who on earth everybody is sometimes, so we've put together a handy
  little list of all the site members and asked them to write little bios and upload a picture! We'd love you to do the
  same on <a href="/members/users">your settings page</a>.
</p>

<p>
  If you need to get in touch with someone about something to do with the band, check out the
  <a href="/committee">committee page</a>.
</p>

<h2>Everybody ever!</h2>

{#if (sort ?? "login") === "login"}
  <p>Sorted by most recent login. <a href="?sort=name">Sort by name instead.</a></p>
{:else}
  <p><a href="?sort=login">Sort by most recent login instead.</a> Sorted by name.</p>
{/if}

<SearchBox
  on:select="{(e) => goto(`/members/users/${e.detail.id}`)}"
  placeholder=""
  fuse="{fuse}"
  toDisplayName="{(i) => `${i.first} ${i.last}`}"
  toId="{(i) => i.id}"
/>

<div class="people">
  {#each users as user, n (user.id)}
    <div class="person" data-test="person-{user.id}">
      <a href="/members/users/{user.id}" class="picture-link">
        <ProfilePicture user="{user}" canEdit="{false}" lastUpdated="{profilePicturesUpdated[n]}" />
      </a>
      <a class="name" data-test="name-{user.id}" href="/members/users/{user.id}">{user.first} {user.last}</a>
      {#if user.bio}
        <div class="bio" data-test="bio-{user.id}">{user.bio}</div>
      {/if}
    </div>
  {/each}
</div>

<p style="text-align: center">
  {#if currentPage > 1}<a href="{previousPage}" data-sveltekit-preload-data>&larr; Back</a> |
  {/if}
  Page {currentPage} of {totalPages}
  {#if currentPage < totalPages}
    | <a href="{nextPage}" data-sveltekit-preload-data>Next &rarr;</a>{/if}<br />(you can also change pages by pressing
  left and right arrows on your keyboard)
</p>
