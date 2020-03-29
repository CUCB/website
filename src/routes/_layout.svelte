<script>
	import Header from '../components/Header.svelte';
	import Footer from '../components/Footer.svelte';

	export let segment;
</script>

<style>
	.layout {
		display: grid;
		min-height: 100vh;
		grid-template-rows: auto 1fr auto;
		align-items: stretch;
	}

	main {
		position: relative;
		max-width: 56em;
		background-color: white;
		padding: 2em 2em 0 2em;
		width: 100%;
		box-sizing: border-box;
		justify-self: center;
	}

    :global(Footer) {
        max-width: 40em;
		padding: 0 2em 1em 2em;
		justify-self: center;
    }
</style>

<div class="layout">
	<Header {segment}/>

	<main>
		<slot></slot>
	</main>

	<Footer />
</div>
