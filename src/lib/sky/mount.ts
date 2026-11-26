import { Sky } from './sky';

const MAX_PIXEL_RATIO = 2;
const MAX_STEP = 0.05;

/** Runs the sky on `canvas` until the returned function is called. */
export function mountSky(canvas: HTMLCanvasElement, word = 'birdorbs'): () => void {
	const ctx = canvas.getContext('2d', { alpha: false })!;
	const sky = new Sky(word);
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
	const onMove = (e: PointerEvent) => (sky.cursor = local(e));
	const onLeave = () => (sky.cursor = null);
	const onUp = (e: PointerEvent) => {
		if (e.pointerType !== 'mouse') sky.cursor = null;
	};
	const onMotion = () => {
		fit();
		run();
	};

	const observer = new ResizeObserver(fit);
	observer.observe(canvas);
	canvas.addEventListener('pointermove', onMove);
	canvas.addEventListener('pointerleave', onLeave);
	canvas.addEventListener('pointercancel', onLeave);
	canvas.addEventListener('pointerdown', onMove);
	canvas.addEventListener('pointerup', onUp);
	document.addEventListener('visibilitychange', run);
	still.addEventListener('change', onMotion);
	fit();
	run();

	return () => {
		cancelAnimationFrame(frame);
		observer.disconnect();
		canvas.removeEventListener('pointermove', onMove);
		canvas.removeEventListener('pointerleave', onLeave);
		canvas.removeEventListener('pointercancel', onLeave);
		canvas.removeEventListener('pointerdown', onMove);
		canvas.removeEventListener('pointerup', onUp);
		document.removeEventListener('visibilitychange', run);
		still.removeEventListener('change', onMotion);
	};
}
