# landing

The birdorbs landing page: a SvelteKit site, prerendered to static files with `@sveltejs/adapter-static`.

- `npm ci`, then `npm run dev` to work on it, `npm run check` to typecheck, and `npm run build` to write the site to `build/`.
- The sky engine lives in `src/lib/sky`; the page that mounts it is `src/routes/+page.svelte`.
- `references/prototype/birdorbs.html` is the single-file prototype the design was approved on. `references/flocking-sim` is the Java flocking simulation the birds are ported from.
- `.github/workflows/deploy.yml` checks and builds every pull request, and on a push to `main` deploys `build/` to GitHub Pages. `BASE_PATH` and `ORIGIN` come from the Pages configuration, so the site works both at a project path (`/landing`) and on a custom domain, and its canonical URL, share card and sitemap name the address it is served at.
- `static/og.png` is the share card: a 1200×630 screenshot of the page in its light theme.
