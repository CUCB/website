<script lang="ts">
  import { HCAPTCHA_SITE_KEY } from "../../view";
  import { createEventDispatcher, onMount } from "svelte";

  let dispatch = createEventDispatcher<{ verified: { key: string } }>();
  let callback = (key: string) => dispatch("verified", { key });
  let theme = "light";
  let captchaElement: HTMLElement;

  type HCaptchaRenderArgs = { theme?: string; sitekey?: string; callback: (key: string) => void };
  interface WithScript {
    hcaptcha: {
      render: (element: HTMLElement, args: HCaptchaRenderArgs) => void;
    };
  }

  function loadHCaptcha(cb: () => void) {
    const script = document.createElement("script");
    script.src = "https://hcaptcha.com/1/api.js?render=explicit";
    script.async = true;
    script.addEventListener("load", cb, true);
    document.head.appendChild(script);
  }

  onMount(() => {
    try {
      const styles = getComputedStyle(document.documentElement);
      if (styles.getPropertyValue("--theme_name").trim() === "dark") theme = "dark";
    } catch (e) {
      // Swallow error for old safari compatibility
    }
    loadHCaptcha(() =>
      ((window as unknown) as WithScript).hcaptcha.render(captchaElement, {
        theme,
        sitekey: HCAPTCHA_SITE_KEY,
        callback,
      }),
    );
  });
</script>

<style>
  div {
    margin: 1em auto;
  }
</style>

<div data-test="hcaptcha" bind:this="{captchaElement}"></div>
