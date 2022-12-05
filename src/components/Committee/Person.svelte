<script lang="ts" context="module">
  interface Person {
    committee: {
      picFolder?: string;
    };
    pic?: string;
    aprilFoolsDir?: string;
    emailObfus?: string;
    name: string;
    position: {
      name: string;
    };
    subPosition?: string;
    comments?: string;
  }
</script>

<script lang="ts">
  import Mailto from "../Mailto.svelte";
  import { themeName } from "../../view";
  export let person: Person;
  export let aprilFools = false;
  export let showEmail = false;
  const basePath = person.committee.picFolder ?? `/images/committee/${person.committee.picFolder}/`;
  const src =
    basePath ??
    (aprilFools && person.aprilFoolsDir
      ? `${basePath}${person.aprilFoolsDir}/${person.pic}`
      : `${basePath}${person.pic}`);
</script>

<style lang="scss">
  @import "../../sass/themes.scss";

  committee-person {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 280px;
    max-width: 100%;
    flex-wrap: wrap;
    justify-items: space-around;
    text-align: center;
    margin: 2em 0;
    font-size: 0.8rem;
  }
  .comments {
    font-style: italic;
  }
  .image {
    width: 160px;
    height: 200px;
    margin-bottom: 0.5em;
  }
  div.image {
    display: flex;
    align-items: center;
    justify-content: center;
    font-style: italic;
    @include themeify($themes) {
      border: 1px solid themed("textColor");
    }
  }
  person-details {
    display: flex;
    flex-direction: column;
  }
  .name {
    margin-bottom: 0.4em;
  }
</style>

<committee-person class="theme-{$themeName}">
  {#if person.pic}
    <img class="image" src="{src}" alt="" width="" />
  {:else}
    <div class="image">No picture</div>
  {/if}
  <person-details>
    <span class="name">
      {#if person.emailObfus && showEmail}
        <Mailto person="{person}">
          {@html person.name}
        </Mailto>
      {:else}
        {@html person.name}
      {/if}
    </span>
    <span class="position">
      {person.position.name}
      {#if person.sub_position}&nbsp;({person.sub_position}){/if}
    </span>
  </person-details>
  {#if person.comments}
    <p class="comments">
      {@html person.comments}
    </p>
  {/if}
</committee-person>
