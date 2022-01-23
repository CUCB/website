<script lang="ts">
  import { onMount, tick } from "svelte";

  import type { User } from "../../../routes/members/user/[id].svelte";
  import { themeName } from "../../../view";
  import MinSizeCropper from "../../MinSizeCropper.svelte";
  import { getCroppedImg } from "./canvasUtils";
  import type photonTy from "photon-web";
  import type { PhotonImage as PhotonImageTy } from "photon-web";
  import { browser } from "$app/env";

  export let user: User;
  export let canEdit: boolean;
  export let lastUpdated: string;

  enum Status {
    NotUploading,
    FormVisible,
    Resizing,
  }

  let status = Status.NotUploading;
  let sizeGuard;
  let image;
  let pixelCrop: { x: number; y: number; width: number; height: number };
  let message = "";
  let button: HTMLButtonElement;
  let cropper: HTMLDivElement;

  // photon-web only runs in the browser, so dynamically import it when the page loads
  let init: typeof photonTy;
  let PhotonImage: typeof PhotonImageTy;
  let resize;

  $: browser &&
    import("photon-web").then((photon) => {
      init = photon.default;
      PhotonImage = photon.PhotonImage;
      resize = photon.resize;
    });

  function cancelUpload() {
    status = Status.NotUploading;
    message = "";
    image = null;
  }

  async function onFileSelected(e) {
    message = "Loading, please wait...";
    await tick();
    let imageFile = e.target.files[0];
    let reader = new FileReader();
    reader.onload = async (e) => {
      image = e.target.result;
    };
    reader.readAsDataURL(imageFile);
  }

  async function continueFileSelected(e) {
    // TODO just accept the image if it's already 200x250, don't ask them to crop it
    if (sizeGuard.naturalWidth < 200 || sizeGuard.naturalHeight < 250) {
      console.error("Image is too small, retry!");
    } else if (sizeGuard.naturalWidth == 200 && sizeGuard.naturalHeight == 250) {
      message = "Uploading image, please wait...";
      await tick();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = sizeGuard.naturalWidth;
      canvas.height = sizeGuard.naturalHeight;
      ctx.drawImage(sizeGuard, 0, 0);
      const data = canvas.toDataURL("image/jpeg");
      await fetch(`/members/images/users/${user.id}.jpg`, { method: "POST", body: data });
      lastUpdated = await (await fetch(`/members/images/users/${user.id}.jpg/modified`)).text();
      await fetch(`/members/images/users/${user.id}.jpg?srcmod=${lastUpdated}`).then(cancelUpload);
      return;
    } else {
      status = Status.Resizing;
      while (!button) {
        await tick();
      }
      if (button.getBoundingClientRect().bottom > window.innerHeight || cropper.getBoundingClientRect().top < 0) {
        button.scrollIntoView(false);
      }
    }
    message = "";
  }

  function updateCrop(e) {
    pixelCrop = e.detail.pixels;
  }

  function uploadPng(pngData: string) {
    const img = new Image();
    img.src = pngData;
    img.onload = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      let croppedImageBase64 = canvas.toDataURL("image/jpeg");

      await fetch(`/members/images/users/${user.id}.jpg`, { method: "POST", body: croppedImageBase64 });
      lastUpdated = await (await fetch(`/members/images/users/${user.id}.jpg/modified`)).text();
      await fetch(`/members/images/users/${user.id}.jpg?srcmod=${lastUpdated}`).then(cancelUpload);
    };
  }

  async function completeCrop(e) {
    message = "Uploading file, please wait...";
    await tick();
    const croppedImageBase64 = await getCroppedImg(image, pixelCrop);
    await init("/photon_web_bg.wasm");
    let photonImg = PhotonImage.new_from_base64(croppedImageBase64.split(",")[1]);
    photonImg = resize(photonImg, 200, 250, 4);
    let pngData = photonImg.get_base64();
    uploadPng(pngData);
  }
</script>

<style>
  div {
    position: relative;
    width: 100%;
    max-width: 600px;
    height: 400px;
  }
</style>

<h3>Profile Picture</h3>
{#if status === Status.NotUploading}
  <img
    class="theme-{$themeName}"
    src="/members/images/users/{user.id}.jpg?srcmod={lastUpdated}"
    width="200"
    height="250"
    alt="{user.first} {user.last}"
  />
  {#if canEdit}
    <button on:click="{() => (status = Status.FormVisible)}">Upload new picture</button>
  {/if}
{:else if status === Status.FormVisible}
  <!-- There is no need to check canEdit as we can only access this section if canEdit is true -->
  <input type="file" accept=".jpg, .jpeg, .png" on:change="{onFileSelected}" />
  <button on:click="{cancelUpload}">Cancel</button>
  {#if message}
    <p>{message}</p>
  {/if}
{:else}
  <p>The image is too large, please crop it to the correct size (200×250)</p>
  <div bind:this="{cropper}">
    <MinSizeCropper image="{image}" minWidth="{200}" minHeight="{250}" on:cropcomplete="{updateCrop}" />
  </div>
  <button on:click="{completeCrop}" disabled="{!pixelCrop}">Upload</button>
  <button on:click="{cancelUpload}" bind:this="{button}">Cancel</button>
  {#if message}
    <p>{message}</p>
  {/if}
{/if}

{#if image}
  <img alt="" style="display:none" bind:this="{sizeGuard}" src="{image}" on:load="{continueFileSelected}" />
{/if}
