<script>
  export let icon, color, style;
</script>

<style>
  annotated-icon {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: fit-content;
    cursor: pointer;
    text-align: center;
  }
  i {
    font-size: 2em;
  }
  p {
    margin: 0;
  }

  @media only screen and (max-width: 400px) {
    annotated-icon {
      flex-direction: row;
    }
    i {
      font-size: 1.5em;
    }
  }
</style>

<annotated-icon on:click style="{`color: ${color};${style}`}" data-test="{$$props['data-test']}">
  <i class="{`las la-${icon}`}"></i>
  <p>
    <slot />
  </p>
</annotated-icon>
