<script context="module">
  import LoginForm from "../../components/LoginForm.svelte";
  import { makeTitle } from "../../view";
</script>

<svelte:head>
  <title>{makeTitle('Sign in')}</title>
</svelte:head>

<LoginForm redirectTo="/members" />
