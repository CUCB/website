<script context="module">
  import LoginForm from "../../components/LoginForm.svelte";
  import { makeTitle } from "../../view";

  export async function preload(_page, session) {
    if (session.userId !== undefined) {
      this.redirect(302, "/members");
    }
  }
</script>

<svelte:head>
  <title>{makeTitle('Sign in')}</title>
</svelte:head>

<LoginForm redirectTo="/members" />
