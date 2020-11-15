<script>
  import Popup from "../Popup.svelte";
  import { HsvPicker } from "svelte-color-picker";
  import { onMount } from "svelte";
  import { accentCss, calendarStartDay, logoCss, themeName } from "../../view";
  import { stores } from "@sapper/app";
  export let settings, showSettings;
  let colors = ["default", "light", "dark"];
  let { session } = stores();
  $: themeName.set(settings.get("color"));
  $: color = settings.get("color");
  $: font = settings.get("font");
  $: accent = settings.get(`accent_${color}`);
  $: updateProps = [`accent_${color}`, `color`, `spinnyLogo`, `logo_${color}`, `calendarStartDay`];
  $: logo = settings.get(`logo_${color}`);
  $: updateLocalStorage(settings);
  let selectedTheme = settings.get("color");
  let selectedCalendarStartDay = settings.get("calendarStartDay");

  const setDefaultColors = settings => {
    if (typeof getComputedStyle !== "undefined") {
      let color = settings.get("color");
      if (!settings.get(`accent_${color}`) || settings.get(`accent_${color}`) === "null") {
        settings = settings.set(`accent_${color}`, rgbStringToHex(fromCurrentStyle("accent_triple")));
      }
    }
  };

  const currentLogoColor = () => {
    if (typeof getComputedStyle !== "undefined" && fromCurrentStyle("logo_color").trim()[0] === "#") {
      // If var(--logo_color) is a hex value, return that
      return fromCurrentStyle("logo_color")
        .trim()
        .slice(1);
    } else {
      // As a default, assume it's black
      return "000000";
    }
  };

  $: setDefaultColors(settings);
  $: accentColor =
    settings.get(`accent_${color}`) && settings.get(`accent_${color}`).length === 6
      ? settings.get(`accent_${color}`)
      : rgbStringToHex(fromCurrentStyle(`accent_triple`));
  $: logoColor =
    settings.get(`logo_${color}`) && settings.get(`logo_${color}`).length === 6
      ? settings.get(`logo_${color}`)
      : currentLogoColor();
  $: $calendarStartDay = settings.get("calendarStartDay");
  let updateLocalStorage = _ => {};

  let updateSession = () => {};
  const propLocalStorage = name => {
    const value = localStorage.getItem(`${name}_${$session.userId}`);
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  };

  const updateSettings = () => {
    if ($session.userId && updateProps) {
      for (let color of colors) {
        let prop = `accent_${color}`;
        if (!settings.get(prop) && propLocalStorage(prop)) {
          settings = settings.set(prop, propLocalStorage(prop));
        }
      }
    }
  };

  const fromCurrentStyle = prop => {
    try {
      return (
        typeof getComputedStyle !== "undefined" &&
        getComputedStyle(document.documentElement)
          .getPropertyValue(`--${prop}`)
          .trim()
      );
    } catch (e) {
      // Swallow error, probably due to custom properties not being a thing on old devices
      return "";
    }
  };

  const rgbStringToHex = triple =>
    triple &&
    triple
      .split(",")
      .map(i => parseInt(i))
      .map(i => i.toString(16))
      .map(i => (i.length === 1 ? "0" + i : i))
      .join("");

  function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }

  function rgbToHex({ r, g, b }) {
    return componentToHex(r) + componentToHex(g) + componentToHex(b);
  }

  let timer = {};
  function debounce(setting, value) {
    timer[setting] && clearTimeout(timer[setting]);
    timer[setting] = setTimeout(() => {
      value && (settings = settings.set(setting, value));
    }, 200);
  }

  onMount(() => {
    if (!settings.get(`accent_${color}`)) {
      settings = settings.set(`accent_${color}`, rgbStringToHex(fromCurrentStyle("accent_triple")));
    }
    color = propLocalStorage("color") || settings.get("color");
    accent = propLocalStorage(`accent_${color}`) || rgbStringToHex(fromCurrentStyle("accent_triple"));
    for (let color_ of colors) {
      if (propLocalStorage(`accent_${color_}`)) {
        settings = settings.set(`accent_${color_}`, propLocalStorage(`accent_${color_}`));
      }
      if (propLocalStorage(`logo_${color_}`)) {
        settings = settings.set(`logo_${color_}`, propLocalStorage(`logo_${color_}`));
      }
    }

    updateLocalStorage = settings => {
      if ($session.userId) {
        for (let prop of updateProps) {
          settings.get(prop) !== undefined &&
            localStorage.setItem(`${prop}_${$session.userId}`, JSON.stringify(settings.get(prop)));
        }
      }
    };

    updateSession = () => {
      let theme = new URLSearchParams();
      for (let prop of updateProps) {
        theme.append(prop, JSON.stringify(propLocalStorage(prop)));
      }
      fetch("/updatetheme", {
        method: "POST",
        body: theme,
        headers: {
          "Content-type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
      });
    };
  });
</script>

<svelte:head>
  <link rel="stylesheet" type="text/css" href="static/themes/color/{color}.css" />
  <link rel="stylesheet" type="text/css" href="static/themes/font/{font}.css" />
  {#if accent && accent !== 'null'}
    {@html accentCss(accent)}
  {/if}
  {#if logo && logo !== 'null'}
    {@html logoCss(logo)}
  {/if}
</svelte:head>
{#if showSettings}
  <Popup
    on:close="{() => {
      showSettings = false;
      updateSession(settings);
    }}"
  >
    <button on:click="{() => (settings = settings.update('accentOpen', x => !x).set('logoOpen', false))}">
      Change accent colour
    </button>
    <button on:click="{() => (settings = settings.set(`accent_${color}`, null))}">Reset accent colour</button>
    <button on:click="{() => (settings = settings.update('logoOpen', x => !x).set('accentOpen', false))}">
      Change logo colour
    </button>
    <button on:click="{() => (settings = settings.set(`logo_${color}`, null))}">Reset logo colour</button>
    <label>
      Theme
      <select bind:value="{selectedTheme}">
        <option value="default">Default (system settings)</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
    <button on:click="{event => (settings = settings.set('color', selectedTheme))}">Set theme</button>
    <label>
      Spinny logo
      <input
        type="checkbox"
        checked="{settings.get('spinnyLogo')}"
        on:change="{() => (settings = settings.update('spinnyLogo', x => !x))}"
      />
    </label>
    <label>
      Start calendar week on...
      <select bind:value="{selectedCalendarStartDay}">
        <option value="mon">Monday</option>
        <option value="tue">Tuesday</option>
        <option value="wed">Wednesday</option>
        <option value="thu">Thursday</option>
        <option value="fri">Friday</option>
        <option value="sat">Saturday</option>
        <option value="sun">Sunday</option>
      </select>
    </label>
    <button on:click="{event => (settings = settings.set('calendarStartDay', selectedCalendarStartDay))}">
      Set day
    </button>
  </Popup>
  {#if settings.get('accentOpen')}
    <Popup on:close="{() => (settings = settings.set('accentOpen', false))}" width="auto">
      <HsvPicker
        startColor="{accentColor}"
        on:colorChange="{event => debounce(`accent_${color}`, rgbToHex(event.detail))}"
      />
    </Popup>
  {/if}
  {#if settings.get('logoOpen')}
    <Popup on:close="{() => (settings = settings.set('logoOpen', false))}" width="auto">
      <HsvPicker
        startColor="{logoColor}"
        on:colorChange="{event => debounce(`logo_${color}`, rgbToHex(event.detail))}"
      />
    </Popup>
  {/if}
{/if}
