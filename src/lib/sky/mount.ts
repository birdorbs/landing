import { DUSK_PAPER, TWILIGHT } from './palette';
import { Sky } from './sky';

const MAX_PIXEL_RATIO = 2;
const MAX_STEP = 0.05;

export interface SkyLink {
	text: string;
	href: string;
}

/**
 * Runs the sky on `canvas`, in the palette of the system color scheme, until the returned function is called.
 * Each link is spelled in dots under the wordmark, with a real anchor laid over it in the canvas's parent.
 */
export function mountSky(canvas: HTMLCanvasElement, word = 'birdorbs', links: SkyLink[] = []): () => void {
	const ctx = canvas.getContext('2d', { alpha: false })!;
	const light = matchMedia('(prefers-color-scheme: light)');
	const palette = () => (light.matches ? DUSK_PAPER : TWILIGHT);
	const sky = new Sky(
		word,
		palette(),
		links.map((link) => link.text)
	);
	let pointed = -1;
	let focused = -1;
	const anchors = links.map(({ text, href }, i) => {
		const anchor = document.createElement('a');
		anchor.href = href;
		anchor.setAttribute('aria-label', text);
		anchor.style.cssText =
			'position:absolute;border-radius:8px;touch-action:none;-webkit-tap-highlight-color:transparent';
		anchor.addEventListener('focus', () => {
			if (!anchor.matches(':focus-visible')) return;
			focused = i;
			sky.hover(i, true);
		});
		anchor.addEventListener('blur', () => {
			if (focused !== i) return;
			focused = -1;
			if (pointed !== i) sky.hover(i, false);
		});
		anchor.addEventListener('click', () => sky.press(i));
		canvas.parentElement!.append(anchor);
		return anchor;
	});
	const still = matchMedia('(prefers-reduced-motion: reduce)');
	let frame = 0;
	let last = 0;
	let clear = true;

	const fit = () => {
		const { width, height } = canvas.getBoundingClientRect();
		if (!width || !height) return;
		const ratio = Math.min(devicePixelRatio || 1, MAX_PIXEL_RATIO);
		canvas.width = Math.round(width * ratio);
		canvas.height = Math.round(height * ratio);
		ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
		sky.resize(width, height);
		sky.linkRects.forEach((rect, i) => {
			const { style } = anchors[i];
			style.left = `${canvas.offsetLeft + rect.x}px`;
			style.top = `${canvas.offsetTop + rect.y}px`;
			style.width = `${rect.w}px`;
			style.height = `${rect.h}px`;
		});
		clear = true;
		if (still.matches) {
			sky.settle();
			sky.draw(ctx, 0, true);
		}
	};

	const tick = (now: number) => {
		const dt = Math.min((now - last) / 1000, MAX_STEP);
		last = now;
		sky.step(dt);
		sky.draw(ctx, dt, clear);
		clear = false;
		frame = requestAnimationFrame(tick);
	};

	const run = () => {
		cancelAnimationFrame(frame);
		if (document.hidden || still.matches) return;
		last = performance.now();
		frame = requestAnimationFrame(tick);
	};

	const local = (e: PointerEvent) => {
		const rect = canvas.getBoundingClientRect();
		return { x: e.clientX - rect.left, y: e.clientY - rect.top };
	};
	/** A touch stays captured by the element it began on, so the link under the pointer is found by position. */
	const point = (cursor: { x: number; y: number } | null) => {
		sky.cursor = cursor;
		const over = cursor
			? sky.linkRects.findIndex(
					(r) => cursor.x >= r.x && cursor.x <= r.x + r.w && cursor.y >= r.y && cursor.y <= r.y + r.h
				)
			: -1;
		if (over === pointed) return;
		if (pointed >= 0 && pointed !== focused) sky.hover(pointed, false);
		if (over >= 0) sky.hover(over, true);
		pointed = over;
	};
	const onMove = (e: PointerEvent) => point(local(e));
	const onLeave = () => point(null);
	const onUp = (e: PointerEvent) => {
		if (e.pointerType !== 'mouse') point(null);
	};
	const onMotion = () => {
		fit();
		run();
	};
	const onScheme = () => {
		sky.paint(palette());
		onMotion();
	};

	const observer = new ResizeObserver(fit);
	observer.observe(canvas);
	addEventListener('pointermove', onMove);
	document.documentElement.addEventListener('pointerleave', onLeave);
	addEventListener('pointercancel', onLeave);
	addEventListener('pointerdown', onMove);
	addEventListener('pointerup', onUp);
	document.addEventListener('visibilitychange', run);
	still.addEventListener('change', onMotion);
	light.addEventListener('change', onScheme);
	fit();
	run();

	return () => {
		cancelAnimationFrame(frame);
		observer.disconnect();
		for (const anchor of anchors) anchor.remove();
		removeEventListener('pointermove', onMove);
		document.documentElement.removeEventListener('pointerleave', onLeave);
		removeEventListener('pointercancel', onLeave);
		removeEventListener('pointerdown', onMove);
		removeEventListener('pointerup', onUp);
		document.removeEventListener('visibilitychange', run);
		still.removeEventListener('change', onMotion);
		light.removeEventListener('change', onScheme);
	};
}
