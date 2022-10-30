<script>
  import { onMount } from "svelte";

  onMount(() => {
    fetch("/auth/logout", {
      method: "POST",
    }).then(() => (window.location.href = "/"));
  });
</script>
