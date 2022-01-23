<script>
  import Cropper from "svelte-easy-crop";
  export let minWidth;
  export let minHeight;
  export let image;

  let crop = { x: 0, y: 0 };
  let zoom = 1;

  let imageElem = document.querySelector("img");
  $: maxZoom =
    (imageElem && Math.min(imageElem.naturalWidth / minWidth, imageElem.naturalHeight / minHeight)) || undefined;
  let cropper;
  $: imageElem = cropper && (imageElem || cropper.querySelector("img"));
</script>

<div bind:this="{cropper}">
  <Cropper image="{image}" bind:crop bind:zoom aspect="{minWidth / minHeight}" maxZoom="{maxZoom}" on:cropcomplete />
</div>
