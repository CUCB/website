<script>
  import TooltipText from "../TooltipText.svelte";

  export let signups;
  $: yes = signups.filter((person) => person.user_available && !person.user_only_if_necessary);
  $: maybe = signups.filter((person) => person.user_only_if_necessary);
  $: no = signups.filter((person) => person.user_available === false);
  const name = (person) => `${person.user.first} ${person.user.last}`;
</script>

<i>
  <TooltipText content="{yes.map(name).join(', ')}">Yes</TooltipText>
  &#32;/
  <!-- Leave this space here -->
  <TooltipText content="{maybe.map(name).join(', ')}">Maybe</TooltipText>
  &#32;/
  <!-- Leave this space here -->
  <TooltipText content="{no.map(name).join(', ')}">No</TooltipText>:
  {yes.length}/{maybe.length}/{no.length}
</i>
