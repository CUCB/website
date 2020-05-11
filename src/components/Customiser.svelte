<script>
    export let value;
    import { createEventDispatcher } from 'svelte';
    let {logo, accent, color, font } = value;
    logo = '#' + logo;
    accent = '#' + accent;
    const update = () => value = {logo: logo.slice(1), accent: accent.slice(1), color, font};

    const dispatch = createEventDispatcher();
    const submit = () => dispatch('submit', {});
</script>

<label>Logo: <input type="color" on:change={update} bind:value={logo}/></label>
<label>Accent: <input type="color" on:change={update} bind:value={accent}/></label>
<label>Theme:
    <select bind:value={color} on:change={update}>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
    </select>
</label>
<label>Font:
    <select bind:value={font} on:change={update}>
        <option value="standard">Standard</option>
        <option value="hacker">Hacker</option>
    </select>
</label>
<button on:click={submit}>Set colours</button>
