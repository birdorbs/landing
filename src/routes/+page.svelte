<script lang="ts">
	import Sky from '$lib/sky/Sky.svelte';
</script>

<svelte:head>
	<title>birdorbs</title>
	<meta name="description" content="birdorbs is an open source organization and the home of Quillmark." />
</svelte:head>

<main>
	<h1>birdorbs</h1>
	<Sky />
</main>

<style>
	main {
		position: fixed;
		inset: 0;
	}

	h1 {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
