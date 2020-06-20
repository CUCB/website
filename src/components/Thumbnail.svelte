<style>
  figcaption {
    font-size: 10px;
    text-align: center;
  }

  #thumbnail {
    width: 180px;
    margin: 10px 10px;
  }

  img {
    width: 100%;
  }
</style>

<script>
  export let src;
  export let description;
</script>

<figure id="thumbnail">
  <a href="{src}" title="{description}">
    <img {src} alt="{description}" />
  </a>
  <figcaption>{description}</figcaption>
</figure>
