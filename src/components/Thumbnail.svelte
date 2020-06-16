<script>
export let src;
export let description;
</script>

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

<figure id="thumbnail">
    <a href={src}  title={description}>
        <img src={src} alt={description}>
    </a>
    <figcaption>{description}</figcaption>
</figure>