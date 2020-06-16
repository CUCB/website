<style>
  div {
    box-sizing: border-box;
    border-style: solid;
    border-width: 2px;
    border-radius: 5px;
    border-color: var(--accent);
    padding: 0px 10px;
    width: 100%;
    max-width: 700px;
    margin: 5px auto;
    font-size: 0.8em;
  }

  #person {
    text-align: right;
    font-style: italic;
  }
</style>

<script>
  export let person;
</script>

<div class="testimonial">
  <p id="text">
    <slot />
  </p>
  <p id="person">{person}</p>
</div>
