<script>
  import { themeName } from "../../view";
  export let value, select, disabled;
</script>

<style lang="scss">
  .dropdown {
    display: inline-block;
    position: relative;
    overflow: hidden;
    height: 2.5em;
    background: #f2f2f2;
    border: 1px solid;
    border-color: white #f7f7f7 whitesmoke;
    border-radius: 3px;
    background-image: -webkit-linear-gradient(top, transparent, rgba(0, 0, 0, 0.06));
    background-image: -moz-linear-gradient(top, transparent, rgba(0, 0, 0, 0.06));
    background-image: -o-linear-gradient(top, transparent, rgba(0, 0, 0, 0.06));
    background-image: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.06));
    -webkit-box-shadow: 0 1px 1px rgba(0, 0, 0, 0.08);
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.08);
  }

  .dropdown:before,
  .dropdown:after {
    content: "";
    position: absolute;
    z-index: 2;
    top: 0.85em;
    right: 10px;
    width: 0;
    height: 0;
    border: 4px dashed;
    border-color: #888888 transparent;
    pointer-events: none;
  }

  .dropdown:before {
    border-bottom-style: solid;
    border-top: none;
  }

  .dropdown:after {
    margin-top: 0.475em;
    border-top-style: solid;
    border-bottom: none;
  }

  .dropdown-select {
    position: relative;
    width: 130%;
    margin: 0;
    padding: 6px 8px 6px 10px;
    height: 100%;
    font-size: 0.9rem;
    text-shadow: 0 1px white;
    color: #62717a;
    background: #f2f2f2; /* Fallback for IE 8 */
    background: rgba(0, 0, 0, 0) !important; /* "transparent" doesn't work with Opera */
    border: 0;
    border-radius: 0;
    -webkit-appearance: none;
  }

  .dropdown-select:focus {
    z-index: 3;
    width: 100%;
    outline: 0;
  }
  .dropdown:focus-within {
    border-color: var(--accent);
    box-shadow: 0px 0px 4px 1px var(--accent);
    outline: 0;
  }

  :global(.dropdown-select > option) {
    margin: 3px;
    padding: 6px 8px;
    text-shadow: none;
    background: #f2f2f2;
    border-radius: 3px;
    cursor: pointer;
  }

  /* Dirty fix for Firefox adding padding where it shouldn't. */

  @-moz-document url-prefix() {
    .dropdown-select {
      padding-left: 6px;
    }
  }

  .dropdown-dark {
    background: #444;
    border-color: #111111 #0a0a0a black;
    background-image: -webkit-linear-gradient(top, transparent, rgba(0, 0, 0, 0.4));
    background-image: -moz-linear-gradient(top, transparent, rgba(0, 0, 0, 0.4));
    background-image: -o-linear-gradient(top, transparent, rgba(0, 0, 0, 0.4));
    background-image: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.4));
    -webkit-box-shadow: inset 0 1px rgba(255, 255, 255, 0.1), 0 1px 1px rgba(0, 0, 0, 0.2);
    box-shadow: inset 0 1px rgba(255, 255, 255, 0.1), 0 1px 1px rgba(0, 0, 0, 0.2);
  }

  .dropdown-dark:before {
    border-bottom-color: #aaa;
  }

  .dropdown-dark:after {
    border-top-color: #aaa;
  }

  .dropdown-dark .dropdown-select {
    color: #aaa;
    text-shadow: 0 1px black;
    background: #444; /* Fallback for IE 8 */
  }

  .dropdown-dark .dropdown-select:focus {
    color: #ccc;
  }

  :global(.dropdown-dark .dropdown-select > option) {
    background: #444;
    text-shadow: 0 1px rgba(0, 0, 0, 0.4);
  }

  @media (prefers-color-scheme: dark) {
    .dropdown-default .dropdown-select {
      color: #aaa;
      text-shadow: 0 1px black;
      background: #444; /* Fallback for IE 8 */
    }

    .dropdown-default {
      background: #444;
      border-color: #111111 #0a0a0a black;
      background-image: -webkit-linear-gradient(top, transparent, rgba(0, 0, 0, 0.4));
      background-image: -moz-linear-gradient(top, transparent, rgba(0, 0, 0, 0.4));
      background-image: -o-linear-gradient(top, transparent, rgba(0, 0, 0, 0.4));
      background-image: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.4));
      -webkit-box-shadow: inset 0 1px rgba(255, 255, 255, 0.1), 0 1px 1px rgba(0, 0, 0, 0.2);
      box-shadow: inset 0 1px rgba(255, 255, 255, 0.1), 0 1px 1px rgba(0, 0, 0, 0.2);
    }

    :global(.dropdown-default .dropdown-select > option) {
      background: #444;
      text-shadow: 0 1px rgba(0, 0, 0, 0.4);
    }
  }

  *:disabled {
    filter: opacity(0.5);
  }
</style>

<div class="dropdown dropdown-{$themeName}" {disabled}>
  <select class="dropdown-select" data-test="select-box" on:change on:blur bind:value bind:this="{select}" {disabled}>
    <slot />
  </select>
</div>
