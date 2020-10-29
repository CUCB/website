<script>
  import { createEventDispatcher, onMount } from "svelte";
  let dispatch = createEventDispatcher();
  let callback = key => dispatch("verified", { key });
  let theme = "light";
  let captchaElement;
  let sitekey = process.env.HCAPTCHA_SITE_KEY;

  function loadHCaptcha(cb) {
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
    loadHCaptcha(() => window.hcaptcha.render(captchaElement, { theme, sitekey, callback }));
  });
</script>

<style>
  div {
    margin: 1em auto;
  }
</style>

<div bind:this="{captchaElement}"></div>
