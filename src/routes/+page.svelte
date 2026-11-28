<script lang="ts">
	import { page } from '$app/state';
	import { GITHUB_MARK } from '$lib/sky/marks';
	import Sky from '$lib/sky/Sky.svelte';

	const title = 'birdorbs';
	const description = 'birdorbs is an open source organization and the home of Quillmark.';
	const github = 'https://github.com/birdorbs';
	const home = `${page.url.origin}${page.url.pathname.replace(/\/?$/, '/')}`;
	const card = { src: `${home}og.png`, width: 1200, height: 630, alt: 'The birdorbs wordmark in dots, with flocks of small birds flying around it.' };
	/** `<` is escaped so no text in the data can close the script element it is written into. */
	const organization = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: title,
		description,
		url: home,
		logo: `${home}icon-512.png`,
		sameAs: [github]
	}).replace(/</g, '\\u003c');

	const links = [
		{ text: 'quillmark', href: `${github}/quillmark` },
		{ text: 'birdorbs on GitHub', href: github, mark: GITHUB_MARK }
	];
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={home} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={title} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={home} />
	<meta property="og:image" content={card.src} />
	<meta property="og:image:width" content={String(card.width)} />
	<meta property="og:image:height" content={String(card.height)} />
	<meta property="og:image:alt" content={card.alt} />
	<meta name="twitter:card" content="summary_large_image" />
	{@html `<script type="application/ld+json">${organization}</` + `script>`}
</svelte:head>

<main>
	<h1>{title}</h1>
	<p>{description}</p>
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

	h1,
	p {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
