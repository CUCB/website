<script>
  export let src;
  export let title;
</script>

<style>
  iframe {
    display: block;
    width: 100%;
    max-width: 600px;
    height: 450px;
    margin: 0 auto 10px auto;
    box-shadow: 0px 0px 5px 0px var(--form_color);
  }
</style>

<iframe data-test="map" {title} frameborder="0" scrolling="no" {src}></iframe>
