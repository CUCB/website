<script context="module">
  import { notLoggedIn } from "../../client-auth.js";
  export function preload(_, session) {
    if (notLoggedIn.bind(this)(session)) return;
  }
</script>

<slot />
