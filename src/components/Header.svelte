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
        max-width: 160px;
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
    <img id="logo" src="/logo.svg" alt="Band logo" />
    <h1 id="title">Cambridge University Ceilidh Band</h1>
    <Nav {segment} />
</header>