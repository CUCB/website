<style>
  iframe {
    display: block;
    width: min(600px, 100%);
    height: 450px;
    margin: 0 auto 10px auto;
  }
</style>

<script>
  export let src;
  export let title;
</script>

<iframe
  data-test="map"
  {title}
  frameborder="0"
  scrolling="no"
  marginheight="0"
  marginwidth="0"
  {src}
></iframe>
