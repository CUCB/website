<script context="module">
  export function preload(_, session) {
    if (!session.userId) {
      this.error(401, "Not logged in");
    }
  }
</script>

<h1>Members</h1>
