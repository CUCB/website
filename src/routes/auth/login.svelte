<script context="module">
  import LoginForm from "../../components/LoginForm.svelte";
  import { makeTitle } from "../../view";

  export async function load({ session }) {
    if (session.userId !== undefined) {
      return {
          redirect: "/members",
          status: 302
      }
    }
    return {};
  }
</script>

<svelte:head>
  <title>{makeTitle('Sign in')}</title>
</svelte:head>

<LoginForm redirectTo="/members" />
