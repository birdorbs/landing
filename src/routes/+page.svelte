<script lang="ts">
	import { GITHUB_MARK } from '$lib/sky/marks';
	import Sky from '$lib/sky/Sky.svelte';

	const links = [
		{ text: 'quillmark', href: 'https://github.com/birdorbs/quillmark' },
		{ text: 'birdorbs on GitHub', href: 'https://github.com/birdorbs', mark: GITHUB_MARK }
	];
</script>

<svelte:head>
	<title>birdorbs</title>
	<meta name="description" content="birdorbs is an open source organization and the home of Quillmark." />
</svelte:head>

<main>
	<h1>birdorbs</h1>
	<Sky {links} />
</main>

<style>
	main {
		position: fixed;
		inset: 0;
		user-select: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
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
