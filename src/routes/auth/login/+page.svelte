<script context="module">
  import LoginForm from "../../../components/LoginForm.svelte";
  import { makeTitle } from "../../../view";

  // TODO migrate me
  export async function load({ session }) {
    if (session.userId !== undefined) {
      return {
        redirect: "/members",
        status: 302,
      };
    }
    return {};
  }
</script>

<script>
  export let form;
</script>

<svelte:head>
  <title>{makeTitle("Sign in")}</title>
</svelte:head>

<LoginForm form="{form}" redirectTo="/members" />
