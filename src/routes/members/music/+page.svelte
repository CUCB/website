<script lang="ts">
  import Select from "../../../components/Forms/Select.svelte";
  import type { PageData } from "./$types";

  export let data: PageData;
  $: ({ archivedSets, currentSets, types } = data);

  $: archivedSetsByType = archivedSets.reduce(
    (map: Map<string, unknown[]>, set) => map.set(set.type.id, [...(map.get(set.type.id) ?? []), set]),
    new Map(),
  );

  $: currentSetsByType = currentSets.reduce(
    (map: Map<string, unknown[]>, set) => map.set(set.type.id, [...(map.get(set.type.id) ?? []), set]),
    new Map(),
  );

  $: allSetsByType = [...archivedSets, ...currentSets]
    .sort((a, b) => a.type.name.localeCompare(b.type.name) || a.title.localeCompare(b.title))
    .reduce(
      (map: Map<string, unknown[]>, set) => map.set(set.type.id, [...(map.get(set.type.id) ?? []), set]),
      new Map(),
    );

  let selectedView: "current" | "archived" | "all" = "current";
  $: setsByType = {
    current: currentSetsByType,
    archived: archivedSetsByType,
    all: allSetsByType,
  };

  let clef: "treble" | "bass" | "alto" = "treble";
  let transpose = 0;

  $: queryString = [clef !== "treble" && `clef=${clef}`, transpose && `transpose=${transpose}`]
    .filter((param) => param)
    .join("&");

  const transposedKey = (n: number) => ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"][(12 - n) % 12];
</script>

<h1>Music</h1>

<Select bind:value="{selectedView}">
  <option selected value="current">Current sets</option>
  <option value="archived">Archived sets</option>
  <option value="all">All sets</option>
</Select>

<Select bind:value="{clef}">
  <option selected value="treble">Treble</option>
  <option value="alto">Alto</option>
  <option value="bass">Bass</option>
</Select>

<Select bind:value="{transpose}">
  {#each [...Array(25).keys()].map((i) => i - 12) as transpose}
    <option selected="{transpose === 0}" value="{-transpose}"
      >{-transpose} ({#if transpose === 0}concert {/if}{transposedKey(-transpose)})</option
    >
  {/each}
</Select>

<p>
  <a target="_blank" rel="noreferrer" href="/members/music/{selectedView}.pdf?{queryString}"
    >Download PDF of {selectedView} sets</a
  >
</p>

{#each types as type}
  {@const sets = setsByType[selectedView]?.get(type.id)}
  {#if sets}
    <h2>{type.name}</h2>
    <p style="font-style:italic;">{type.description}</p>
    <ul>
      {#each sets as set}
        <li>
          {set.title}
          <a
            title="ABC file"
            target="_blank"
            rel="noreferrer"
            href="/members/music/current/{set.filename}.abc?{queryString}"><i class="las la-lg la-file-alt"></i></a
          >
          <a
            title="PDF file"
            target="_blank"
            rel="noreferrer"
            href="/members/music/current/{set.filename}.pdf?{queryString}"><i class="las la-lg la-file-pdf"></i></a
          >
          <a
            title="MP3 file"
            target="_blank"
            rel="noreferrer"
            href="/members/music/current/{set.filename}.mp3?{queryString}"><i class="las la-lg la-file-audio"></i></a
          >
          <!-- TODO add midi player -->
        </li>
      {/each}
    </ul>
  {/if}
{/each}
