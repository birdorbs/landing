import { base } from '$app/paths';

export const prerender = true;

export const GET = ({ url }) =>
	new Response(
		`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\t<url><loc>${url.origin}${base}/</loc></url>\n</urlset>\n`,
		{ headers: { 'content-type': 'application/xml' } }
	);
