<script lang="ts">
  import LoginForm from "../../../components/LoginForm.svelte";
  import { makeTitle } from "../../../view";
  import type { ActionData } from "./$types";
  export let form: ActionData;
</script>

<svelte:head>
  <title>{makeTitle("Sign in")}</title>
</svelte:head>

<LoginForm form="{form}" redirectTo="/members" />
