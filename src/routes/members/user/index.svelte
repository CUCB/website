<script lang="ts" context="module">
  import type { LoadInput, LoadOutput } from "@sveltejs/kit";

  export function load({ session }: LoadInput): LoadOutput {
    if (session.userId !== undefined) {
      return {
        status: 302,
        redirect: `/members/user/${session.userId}`,
      };
    }
  }
</script>
