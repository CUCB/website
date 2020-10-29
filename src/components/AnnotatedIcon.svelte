<script>
  export let icon, color, style;
  let className;
  export { className as class };

  function makeid(length) {
    var result = "";
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  let class_ = makeid(10);
  $: styles = "<" + `style>annotated-icon.${class_} {${color ? `color: ${color};` : ""}${style}}</` + "style>";
</script>

<style>
  annotated-icon {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: fit-content;
    cursor: pointer;
    text-align: center;
  }
  i {
    font-size: 2em;
  }
  p {
    margin: 0;
  }

  @media only screen and (max-width: 400px) {
    annotated-icon {
      flex-direction: row;
    }
    i {
      font-size: 1.5em;
    }
  }
</style>

<svelte:head>
  {@html styles}
</svelte:head>
<annotated-icon on:click class="{class_} {className}" data-test="{$$props['data-test']}">
  <i class="las la-{icon}"></i>
  <p>
    <slot />
  </p>
</annotated-icon>
