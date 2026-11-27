import { CONTRAST_MARK } from './marks';
import { DUSK_PAPER, TWILIGHT } from './palette';
import { Sky, type LinkSpec } from './sky';

const MAX_PIXEL_RATIO = 2;
const MAX_STEP = 0.05;
const THEME_KEY = 'theme';
/** How long a link stays lit after a touch lifts off it, so a tap shows the whole swell. */
const TOUCH_LINGER = 450;

type Theme = 'light' | 'dark';

function storedTheme(): Theme | null {
	try {
		const theme = localStorage.getItem(THEME_KEY);
		return theme === 'light' || theme === 'dark' ? theme : null;
	} catch {
		return null;
	}
}

export interface SkyLink extends Omit<LinkSpec, 'corner'> {
	href: string;
}

/**
 * Runs the sky on `canvas` until the returned function is called. Each link is drawn in the sky with a real
 * anchor laid over it in the canvas's parent, and so is a button that switches between light and dark. A touch
 * has no hover, so a tapped link stays lit for a moment after the finger lifts, and one that is opening its page
 * stays lit until the page is hidden. Every finger on the page is its own pointer to the birds. The
 * palette follows the system color scheme until that button is pressed; the choice is kept in `localStorage`
 * and mirrored to `data-theme` on the root element.
 */
export function mountSky(canvas: HTMLCanvasElement, word = 'birdorbs', links: SkyLink[] = []): () => void {
	const ctx = canvas.getContext('2d', { alpha: false })!;
	const root = document.documentElement;
	const light = matchMedia('(prefers-color-scheme: light)');
	let chosen = storedTheme();
	if (chosen) root.dataset.theme = chosen;
	const theme = (): Theme => chosen ?? (light.matches ? 'light' : 'dark');
	const palette = () => (theme() === 'light' ? DUSK_PAPER : TWILIGHT);
	const sky = new Sky(word, palette(), [
		...links.map(({ text, mark }) => ({ text, mark })),
		{ text: 'theme', mark: CONTRAST_MARK, corner: 'left' }
	]);
	let pointed = -1;
	let focused = -1;
	let held = -1;
	let linger = 0;
	const letGo = () => {
		clearTimeout(linger);
		if (held >= 0 && held !== focused) sky.hover(held, false);
		held = -1;
	};
	const overlay = <T extends HTMLElement>(control: T, label: string, i: number): T => {
		control.setAttribute('aria-label', label);
		control.style.cssText =
			'position:absolute;padding:0;border:0;background:none;border-radius:8px;cursor:pointer;touch-action:none;-webkit-tap-highlight-color:transparent';
		control.addEventListener('focus', () => {
			if (!control.matches(':focus-visible')) return;
			focused = i;
			sky.hover(i, true);
		});
		control.addEventListener('blur', () => {
			if (focused !== i) return;
			focused = -1;
			if (pointed !== i && held !== i) sky.hover(i, false);
		});
		control.addEventListener('click', () => sky.press(i));
		canvas.parentElement!.append(control);
		return control;
	};
	const anchors: HTMLElement[] = links.map(({ text, href }, i) => {
		const anchor = document.createElement('a');
		anchor.href = href;
		anchor.addEventListener('click', () => {
			if (held === i) clearTimeout(linger);
		});
		return overlay(anchor, text, i);
	});
	const toggle = overlay(document.createElement('button'), 'Switch between light and dark', links.length);
	toggle.type = 'button';
	toggle.addEventListener('click', () => {
		chosen = theme() === 'light' ? 'dark' : 'light';
		root.dataset.theme = chosen;
		try {
			localStorage.setItem(THEME_KEY, chosen);
		} catch {
			// The choice still holds for this visit.
		}
		onScheme();
	});
	anchors.push(toggle);
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
		const over = cursor
			? sky.linkRects.findIndex(
					(r) => cursor.x >= r.x && cursor.x <= r.x + r.w && cursor.y >= r.y && cursor.y <= r.y + r.h
				)
			: -1;
		if (cursor && held >= 0) {
			clearTimeout(linger);
			if (over === held) pointed = held;
			else if (held !== focused) sky.hover(held, false);
			held = -1;
		}
		if (over === pointed) return;
		if (pointed >= 0 && pointed !== focused) sky.hover(pointed, false);
		if (over >= 0) sky.hover(over, true, cursor!);
		pointed = over;
	};
	const onMove = (e: PointerEvent) => {
		const at = local(e);
		sky.touch(e.pointerId, at.x, at.y);
		if (e.isPrimary) point(at);
	};
	const onDown = (e: PointerEvent) => {
		const at = local(e);
		sky.touch(e.pointerId, at.x, at.y, e.pointerType !== 'mouse');
		if (e.isPrimary) point(at);
		if (e.pointerType !== 'mouse' && !(e.isPrimary && pointed >= 0)) sky.startle(at.x, at.y);
	};
	const onLeave = (e: PointerEvent) => {
		if (e.pointerType === 'touch') return;
		sky.lift(e.pointerId);
		point(null);
	};
	const onCancel = (e: PointerEvent) => {
		sky.lift(e.pointerId, true);
		if (e.isPrimary) point(null);
	};
	const onUp = (e: PointerEvent) => {
		if (e.pointerType === 'mouse') return;
		sky.lift(e.pointerId, true);
		if (!e.isPrimary) return;
		const lifted = pointed;
		pointed = -1;
		point(null);
		if (lifted < 0) return;
		held = lifted;
		linger = window.setTimeout(letGo, TOUCH_LINGER);
	};
	const onHide = () => {
		if (document.hidden) letGo();
		run();
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
	addEventListener('pointercancel', onCancel);
	addEventListener('pointerdown', onDown);
	addEventListener('pointerup', onUp);
	document.addEventListener('visibilitychange', onHide);
	still.addEventListener('change', onMotion);
	light.addEventListener('change', onScheme);
	fit();
	run();

	return () => {
		cancelAnimationFrame(frame);
		clearTimeout(linger);
		observer.disconnect();
		for (const anchor of anchors) anchor.remove();
		removeEventListener('pointermove', onMove);
		document.documentElement.removeEventListener('pointerleave', onLeave);
		removeEventListener('pointercancel', onCancel);
		removeEventListener('pointerdown', onDown);
		removeEventListener('pointerup', onUp);
		document.removeEventListener('visibilitychange', onHide);
		still.removeEventListener('change', onMotion);
		light.removeEventListener('change', onScheme);
	};
}
