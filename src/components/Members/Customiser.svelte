<script context="module" lang="ts">
  import type { Day } from "../../view";
  export const ThemeColor = Union(Literal("default"), Literal("light"), Literal("dark"));
  export const HexValue = String.withConstraint((s) => s.match(/^[A-F0-9]{6}$/i) !== null);
  const BLACK = HexValue.check("000000");
  type HexValue = Static<typeof HexValue>;
  type ThemeColor = Static<typeof ThemeColor>;
  type Font = "default" | "hacker";
  export class Settings extends Record({
    color: "default" as ThemeColor,
    accent: Map() as Map<ThemeColor, HexValue>,
    logo: Map() as Map<ThemeColor, HexValue>,
    font: "default" as Font,
    calendarStartDay: "mon" as Day,
    spinnyLogo: false,
  }) {}
</script>

<script lang="ts">
  import Popup from "../Popup.svelte";
  import Select from "../Forms/Select.svelte";
  import { HsvPicker } from "svelte-color-picker";
  import { onMount } from "svelte";
  import { accentCss, calendarStartDay, logoCss, themeName } from "../../view";
  import { session } from "$app/stores";
  import { Record, Map } from "immutable";
  import { String, Null, Literal, Union, Boolean } from "runtypes";
  import type { Static } from "runtypes";

  export let settings: Settings, showSettings: boolean, settingsPopup: Popup | null;

  class ViewSettings extends Record({
    accentOpen: false,
    logoOpen: false,
  }) {}

  let colors: ThemeColor[] = ["default", "light", "dark"];
  let fonts: Font[] = ["default", "hacker"];
  type CssVariable = "accent_triple" | "logo_color";
  const ColorableProperty = Union(Literal("accent"), Literal("logo"));
  type ColorableProperty = Static<typeof ColorableProperty>;
  type ColoredLocalStorageProperty = `${ColorableProperty}_${ThemeColor}`;
  type LocalStorageProperty = ColoredLocalStorageProperty | "color" | "font" | "calendarStartDay" | "spinnyLogo";

  let viewSettings = new ViewSettings();
  $: color = settings.color;
  $: themeName.set(settings.color);
  $: font = settings.font;
  $: accent = settings.accent.get(color);
  $: updateProps = [
    coloredProperty("accent", color),
    `color`,
    `spinnyLogo`,
    coloredProperty("logo", color),
    `calendarStartDay`,
    `font`,
  ] as LocalStorageProperty[];
  $: logo = settings.logo.get(color);
  $: updateLocalStorage(settings);

  // Initialise the select fields to the current values from the user's preferences
  let selectedTheme: ThemeColor | undefined = settings.color;
  let selectedCalendarStartDay: Day | undefined = settings.calendarStartDay;

  function isColoredProperty(property: LocalStorageProperty): property is ColoredLocalStorageProperty {
    return colors.some((color) => property.endsWith(`_${color}`));
  }

  const setDefaultColors = (settings: Settings) => {
    if (typeof getComputedStyle !== "undefined") {
      let color = settings.color;
      if (!settings.accent.get(color)) {
        settings = settings.update("accent", (map) => {
          let value = hexValueFromCurrentStyle("accent_triple");
          return value !== null ? map.set(color, value) : map;
        });
      }
    }
  };

  function hexValueFromCurrentStyle(property: CssVariable): HexValue | null {
    let rgbString = fromCurrentStyle(property);
    if (rgbString) {
      let hexValue = rgbStringToHex(rgbString);
      if (HexValue.guard(hexValue)) {
        return hexValue;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  function currentLogoColor(): HexValue {
    let cssLogoColor = fromCurrentStyle("logo_color");
    let hexValue = cssLogoColor && cssLogoColor.trim().slice(1);
    if (cssLogoColor && cssLogoColor.trim()[0] === "#" && HexValue.guard(hexValue)) {
      return hexValue;
    } else {
      return BLACK;
    }
  }

  $: setDefaultColors(settings);
  $: accentColor = settings.accent.get(color) || hexValueFromCurrentStyle(`accent_triple`);
  $: logoColor = settings.logo.get(color) || currentLogoColor();
  $: $calendarStartDay = settings.calendarStartDay;
  let updateLocalStorage = (_: Settings): void => {};

  let updateSession = (_: Settings): void => {};
  const propLocalStorage = (name: LocalStorageProperty): string | null | boolean => {
    const value = localStorage.getItem(`${name}_${$session.userId}`);
    try {
      return String.Or(Null)
        .Or(Boolean)
        .check(JSON.parse(String.check(value)));
    } catch {
      return value;
    }
  };

  const fromCurrentStyle = (prop: CssVariable): string | false => {
    try {
      return (
        typeof getComputedStyle !== "undefined" &&
        getComputedStyle(document.documentElement).getPropertyValue(`--${prop}`).trim()
      );
    } catch (e) {
      // Swallow error, probably due to custom properties not being a thing on old devices
      return "";
    }
  };

  const rgbStringToHex = (triple: string): string =>
    triple
      .split(",")
      .map((i) => parseInt(i))
      .map((i) => i.toString(16))
      .map((i) => (i.length === 1 ? "0" + i : i))
      .join("");

  function componentToHex(c: number): string {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }

  type RGBObject = { r: number; g: number; b: number };

  function rgbToHex({ r, g, b }: RGBObject): HexValue | null {
    let hexString = componentToHex(r) + componentToHex(g) + componentToHex(b);
    return HexValue.guard(hexString) ? hexString : null;
  }

  let timer = {
    accent: undefined as number | undefined,
    logo: undefined as number | undefined,
  };
  // TODO better name to describe what this actually debounces
  function debounceColor(setting: unknown, value: RGBObject) {
    if (ColorableProperty.guard(setting)) {
      timer[setting] && window.clearTimeout(timer[setting]);
      timer[setting] = window.setTimeout(() => {
        settings = settings.update(setting, (map) => {
          let hexValue = rgbToHex(value);
          return hexValue !== null ? map.set(color, hexValue) : map;
        });
      }, 200);
    } else if (setting) {
      console.error(`Expected ColorableProperty, got ${setting}`);
    }
  }

  function coloredProperty(property: "accent" | "logo", color: ThemeColor): ColoredLocalStorageProperty {
    return (property + "_" + color) as ColoredLocalStorageProperty;
  }

  onMount(() => {
    if (!settings.accent.has(color)) {
      if (accentColor !== null) {
        settings = settings.update("accent", (map) => map.set(color, HexValue.check(accentColor)));
      }
      settings = settings.update("accent", (map) => {
        let value = hexValueFromCurrentStyle("accent_triple");
        return value !== null ? map.set(color, value) : map;
      });
    }
    settings.set("calendarStartDay", $calendarStartDay); // Removes a svelte-check warning
    let colorLocalStorage = propLocalStorage("color");
    color = ThemeColor.guard(colorLocalStorage) ? colorLocalStorage : color;
    for (let color_ of colors) {
      try {
        let accentFromLocalStorage = propLocalStorage(coloredProperty("accent", color_));
        settings = settings.update("accent", (map) => map.set(color_, HexValue.check(accentFromLocalStorage)));
      } catch {}
      try {
        let logoColorFromLocalStorage = propLocalStorage(coloredProperty("logo", color_));
        settings = settings.update("logo", (map) => map.set(color_, HexValue.check(logoColorFromLocalStorage)));
      } catch {}
    }

    updateLocalStorage = (settings) => {
      if ($session.userId) {
        for (let prop of updateProps) {
          if (isColoredProperty(prop)) {
            let [setting, color] = prop.split("_") as [ColorableProperty, ThemeColor];
            let value = settings[setting].get(color);
            if (value !== undefined) {
              localStorage.setItem(`${prop}_${$session.userId}`, JSON.stringify(value));
            }
          } else {
            settings[prop] !== undefined &&
              localStorage.setItem(`${prop}_${$session.userId}`, JSON.stringify(settings[prop]));
          }
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
  <link rel="stylesheet" type="text/css" href="/static/themes/color/{color}.css" />
  <link rel="stylesheet" type="text/css" href="/static/themes/font/{font}.css" />
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
    bind:this="{settingsPopup}"
  >
    <!-- TODO check that the disabled thing actually works -->
    <button
      on:click="{() => (viewSettings = viewSettings.update('accentOpen', (x) => !x).set('logoOpen', false))}"
      disabled="{accentColor === null}"
      data-test="change-accent-color"
    >
      Change accent colour
    </button>
    <button
      on:click="{() => (settings = settings.update('accent', (accents) => accents.remove(color)))}"
      data-test="reset-accent-color"
    >Reset accent colour</button>
    <button
      on:click="{() => (viewSettings = viewSettings.update('logoOpen', (x) => !x).set('accentOpen', false))}"
      disabled="{accentColor === null}"
      data-test="change-logo-color"
    >
      Change logo colour
    </button>
    <button
      on:click="{() => (settings = settings.update('logo', (logoColors) => logoColors.remove(color)))}"
      data-test="reset-logo-color"
    >Reset logo colour</button>
    <!-- svelte-ignore a11y-label-has-associated-control-->
    <label data-test="select-theme">
      Theme
      <Select bind:value="{selectedTheme}">
        <option value="default">Default (system settings)</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </Select>
    </label>
    <button
      on:click="{() => (selectedTheme ? (settings = settings.set('color', selectedTheme)) : {})}"
      data-test="confirm-theme"
    >Set theme</button>
    <label>
      Spinny logo
      <input
        type="checkbox"
        checked="{settings.spinnyLogo}"
        on:change="{() => (settings = settings.update('spinnyLogo', (x) => !x))}"
        data-test="check-spinny-logo"
      />
    </label>
    <!-- svelte-ignore a11y-label-has-associated-control-->
    <label data-test="select-calendar-day">
      Start calendar week on...
      <Select bind:value="{selectedCalendarStartDay}">
        <option value="mon">Monday</option>
        <option value="tue">Tuesday</option>
        <option value="wed">Wednesday</option>
        <option value="thu">Thursday</option>
        <option value="fri">Friday</option>
        <option value="sat">Saturday</option>
        <option value="sun">Sunday</option>
      </Select>
    </label>
    <button
      on:click="{() => (selectedCalendarStartDay ? (settings = settings.set('calendarStartDay', selectedCalendarStartDay)) : {})}"
      data-test="confirm-calendar-day"
    >
      Set day
    </button>
  </Popup>
  {#if viewSettings.accentOpen}
    <Popup
      on:close="{() => (viewSettings = viewSettings.set('accentOpen', false))}"
      width="auto"
      data-test="accent-popup"
    >
      <HsvPicker startColor="{accentColor}" on:colorChange="{(event) => debounceColor('accent', event.detail)}" />
    </Popup>
  {/if}
  {#if viewSettings.logoOpen}
    <Popup on:close="{() => (viewSettings = viewSettings.set('logoOpen', false))}" width="auto" data-test="logo-popup">
      <HsvPicker startColor="{logoColor}" on:colorChange="{(event) => debounceColor('logo', event.detail)}" />
    </Popup>
  {/if}
{/if}
