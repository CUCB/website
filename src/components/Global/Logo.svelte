<svelte:options immutable />

<script lang="ts">
  import { draw } from "svelte/transition";
  import { onMount } from "svelte";
  import { tweened } from "svelte/motion";
  import { sineInOut } from "svelte/easing";
  import { themeName } from "../../view";
  let rotation = tweened(0, { easing: sineInOut, duration: 250 });
  let self: SVGSVGElement;
  export let id: string;
  export let enableSpin: boolean;
  let animate = false;
  const inner: string =
    "m 104.87637,27.75023 c 5.35532,0.07852 43.62236,41.042472 41.88375,83.37729 -2.32954,56.72413 -29.53695,76.93287 -51.575425,93.43104 -41.303721,28.39534 -94.119236,13.85805 -97.2495059,8.31864 -3.1725847,-5.61429 11.302793,-56.9976 56.1008499,-81.45529 28.419646,-15.51583 73.815001,-15.9849 100.244431,-1.07982 49.97941,28.18628 60.58174,78.37273 57.82678,82.5357 -2.74786,4.15224 -58.52042,18.78877 -96.7608,-8.12418 C 91.550466,188.00639 65.525341,168.0406 63.882025,110.65537 61.853208,66.386215 99.480207,27.883723 104.87637,27.75023 Z";
  onMount(() => (animate = true));
  let timer: any;

  const debounce = (v: any) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      rotation.set(v);
    }, 200);
  };

  let _triggerRotation = (event: any) => {
    let rect = event.target.getBoundingClientRect();
    let [x, y] = [event.offsetX / rect.width, event.offsetY / rect.height];
    if (Math.abs(x - 0.5) > Math.abs(y - 0.5)) {
      y = 1 - y;
    }
    // Default direction to 1 on the off chance x or y is 0.5 exactly
    let direction = Math.sign(x - 0.5) * Math.sign(y - 0.5) || 1;
    if ($rotation === 0) {
      // @ts-ignore
      if (window.Cypress) {
        self.dispatchEvent(new CustomEvent("beginRotate"));
      }
      rotation.set(direction * -120);
    } else {
      clearTimeout(timer);
    }
  };
  let triggerDerotation = () => window.setTimeout(() => debounce(0), 100);

  $: triggerRotation = enableSpin
    ? _triggerRotation
    : () => {
        // @ts-ignore
        if (window.Cypress) {
          self.dispatchEvent(new CustomEvent("noRotate"));
        }
      };
</script>

<style lang="scss">
  @import "../../sass/themes.scss";

  #logo2 {
    padding-top: 100%;
    position: relative;
  }
  #svg-logo {
    transform-origin: 50% 60%;
  }
  svg {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
  }

  path {
    fill: none;
    stroke-width: 15;
    @include themeify($themes) {
      stroke: themed("textColor");
      stroke: var(--logo_color);
    }
  }
</style>

<div id="{id}" role="presentation">
  <div id="logo2" class="theme-{$themeName}">
    {#if animate}
      <!-- TODO this used to use sessino for something -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        id="svg-logo"
        viewBox="-10 15 230 225"
        on:mouseover="{triggerRotation}"
        on:mouseout="{triggerDerotation}"
        data-test="logo"
        bind:this="{self}"
        style="transform:rotate({$rotation}deg)"
      >
        <title>CUCB Logo</title>
        <g>
          <path in:draw="{{ duration: 800 }}" d="{inner}"></path>
        </g>
      </svg>
    {:else}
      <noscript>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 15 230 225" data-test="logo">
          <title>CUCB Logo</title>
          <g>
            <path d="{inner}"></path>
          </g>
        </svg>
      </noscript>
    {/if}
  </div>
</div>
