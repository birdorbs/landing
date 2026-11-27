# landing

The birdorbs landing page: a SvelteKit site, prerendered to static files with `@sveltejs/adapter-static`.

- `npm ci`, then `npm run dev` to work on it, `npm run check` to typecheck, and `npm run build` to write the site to `build/`.
- The sky engine lives in `src/lib/sky`; the page that mounts it is `src/routes/+page.svelte`.
- `references/prototype/birdorbs.html` is the single-file prototype the design was approved on. `references/flocking-sim` is the Java flocking simulation the birds are ported from.
