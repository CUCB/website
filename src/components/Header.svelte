<script>
    import Nav from './Nav.svelte';
    export let segment;
</script>

<style>
    header {
        display: grid;
        grid-template-areas:
            "logo title"
            "nav nav";
        align-items: center;
    }


    #logo {
        max-width: 200px;
        grid-area: logo;
    }

    #title {
        grid-area: title;
    }

    :global(Nav) {
        grid-area: nav;
    }
</style>

<header>
    <img id="logo" src="https://www.cucb.co.uk/resources/branded/logo_rounded.svg" alt="Band logo" />
    <h1 id="title">Cambridge University Ceilidh Band</h1>
    <Nav {segment} />
</header>