<script>
  import LoginForm from "../../components/LoginForm.svelte";
  import { title } from "../../view.js";
  $title = "Sign in";
</script>

<LoginForm redirectTo="/members" />
