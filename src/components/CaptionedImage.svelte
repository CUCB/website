<script>
  export let src, alt;
</script>

<style>
  img {
    display: block;
    width: 100%;
    box-shadow: 0 0 5px var(--form_color);
  }

  .captioned-image {
    display: block;
    margin: auto;
    width: 100%;
    max-width: 600px;
    box-sizing: border-box;
  }

  .captioned-image p {
    font-style: italic;
    text-align: center;
    margin-top: 0.5em;
  }
</style>

<div class="captioned-image">
  <img {src} {alt} />
  <p>
    <slot />
  </p>
</div>
