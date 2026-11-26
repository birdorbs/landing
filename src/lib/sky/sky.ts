import { layoutWord } from './letters';
import { DUSK, type Palette, type Rgb, type Rgba } from './palette';
import { BUTTERFLIES, BUTTERFLY_LOOK, FLOCKS, REFERENCE_AREA, type FlockSpec, type Look, type Species } from './scene';

const DEG = Math.PI / 180;
const TAU = Math.PI * 2;

const TRAIL = 100 / 255;
const CURSOR_RADIUS = 130;
const CURSOR_WEIGHT = 700;

const BORB_SPEED = 420;
const BORB_ARRIVE = 5;

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
const rgb = (c: Rgba | Rgb) => `rgb(${c[0]},${c[1]},${c[2]})`;

interface Boid {
	x: number;
	y: number;
	vx: number;
	vy: number;
	size: number;
	wingSize: number;
	wingStart: number;
	wingArc: number;
	flapPeriod: number;
	flap: number;
	fill: string;
	alpha: number;
	phase: boolean;
	/** Where this bird falls in each of the palette's butterfly ranges. */
	tint: [number, number, number];
}

interface Flock {
	species: Species;
	boids: Boid[];
	speed: number;
	alignmentRadius: number;
	cohesionRadius: number;
	separationRadius: number;
	alignmentWeight: number;
	cohesionWeight: number;
	separationWeight: number;
	currentVelocityWeight: number;
}

/** A dot of the wordmark: it flies like a bird while `roam` runs, then steers back to its home. */
interface Borb {
	x: number;
	y: number;
	vx: number;
	vy: number;
	hx: number;
	hy: number;
	roam: number;
	heading: number;
	flight: number;
	flap: number;
	seed: number;
}

interface Point {
	x: number;
	y: number;
}

function wings(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, heading: number, start: number, arc: number) {
	ctx.beginPath();
	ctx.moveTo(x, y);
	ctx.arc(x, y, r, heading + start, heading + start + arc);
	ctx.closePath();
	ctx.moveTo(x, y);
	ctx.arc(x, y, r, heading - start - arc, heading - start);
	ctx.closePath();
	ctx.fill();
}

function flapAlpha(flap: number) {
	const t = flap % 2;
	return (t > 1 ? 2 - t : t) * 0.9;
}

export class Sky {
	width = 0;
	height = 0;
	cursor: Point | null = null;

	private moon = { x: 0, y: 0, vx: 0, vy: 0, size: 0, halo: rand(0.3, 0.6) };
	private butterflies: Boid[] = [];
	private flocks: Flock[] = [];
	private borbs: Borb[] = [];
	private cell = 0;
	private time = 0;
	private populated = false;
	private scale = 1;

	private ground: { style: string | CanvasGradient; height: number } | null = null;

	constructor(
		private word: string,
		private palette: Palette = DUSK
	) {}

	paint(palette: Palette) {
		this.palette = palette;
		this.ground = null;
		const mix = ([min, max]: [number, number], t: number) => min + (max - min) * t;
		const { hue, saturation, lightness } = palette.butterflies;
		for (const b of this.butterflies) {
			b.fill = `hsl(${mix(hue, b.tint[0]) % 360} ${mix(saturation, b.tint[1])}% ${mix(lightness, b.tint[2])}%)`;
		}
		for (const flock of this.flocks) {
			const color = palette.birds[flock.species];
			for (const b of flock.boids) {
				b.fill = rgb(color);
				b.alpha = color[3] / 255;
			}
		}
	}

	resize(width: number, height: number) {
		const first = !this.populated;
		const dx = this.moon.x - this.moonAnchor().x;
		const dy = this.moon.y - this.moonAnchor().y;
		this.width = width;
		this.height = height;

		const anchor = this.moonAnchor();
		this.moon.size = Math.max(40, Math.min(100, Math.min(width, height) * 0.15));
		this.moon.x = anchor.x + (first ? 0 : dx);
		this.moon.y = anchor.y + (first ? 0 : dy);

		const { cell, homes } = layoutWord(this.word, width, height);
		this.cell = cell;
		if (first) {
			this.populate();
			const left = homes[0].x;
			const span = homes[homes.length - 1].x - left || 1;
			this.borbs = homes.map((home) => {
				const angle = rand(0, TAU);
				return {
					x: rand(0, width),
					y: rand(0, height),
					vx: Math.cos(angle) * 160,
					vy: Math.sin(angle) * 160,
					hx: home.x,
					hy: home.y,
					roam: 0.3 + (0.9 * (home.x - left)) / span + rand(0, 0.3),
					heading: angle,
					flight: 1,
					flap: rand(0, 10),
					seed: rand(0, TAU)
				};
			});
		} else {
			homes.forEach((home, i) => {
				this.borbs[i].hx = home.x;
				this.borbs[i].hy = home.y;
			});
		}
	}

	/** Puts the wordmark at rest, for a still frame. */
	settle() {
		for (const b of this.borbs) {
			b.x = b.hx;
			b.y = b.hy;
			b.vx = b.vy = b.roam = b.flight = 0;
		}
	}

	step(dt: number) {
		this.time += dt;
		this.stepMoon(dt);
		for (const b of this.butterflies) this.stepButterfly(b, dt);
		for (const flock of this.flocks) this.steer(flock, dt);
		for (const flock of this.flocks) for (const b of flock.boids) this.move(b, dt);
		for (const b of this.borbs) this.stepBorb(b, dt);
	}

	draw(ctx: CanvasRenderingContext2D, dt: number, clear = false) {
		ctx.globalAlpha = clear ? 1 : 1 - Math.pow(1 - TRAIL, dt * 60);
		ctx.fillStyle = this.sky(ctx);
		ctx.fillRect(0, 0, this.width, this.height);

		const moon = this.moon;
		const moonAlpha = this.palette.moon[3] / 255;
		ctx.fillStyle = rgb(this.palette.moon);
		ctx.globalAlpha = moonAlpha * 0.9 * moon.halo;
		ctx.beginPath();
		ctx.arc(moon.x, moon.y, moon.size * 1.15, 0, TAU);
		ctx.fill();
		ctx.globalAlpha = moonAlpha;
		ctx.beginPath();
		ctx.arc(moon.x, moon.y, moon.size, 0, TAU);
		ctx.fill();

		for (const b of this.butterflies) this.drawBoid(ctx, b, dt);
		for (const flock of this.flocks) for (const b of flock.boids) this.drawBoid(ctx, b, dt);

		const radius = this.cell * 0.42;
		ctx.fillStyle = rgb(this.palette.letters);
		for (const b of this.borbs) {
			if (b.flight > 0.02) {
				b.flap += dt / 0.14;
				ctx.globalAlpha = flapAlpha(b.flap) * b.flight * 0.85;
				wings(ctx, b.x, b.y, radius * 2.6, b.heading, 40 * DEG, 130 * DEG);
			}
			ctx.globalAlpha = 0.95;
			ctx.beginPath();
			ctx.arc(b.x, b.y, radius, 0, TAU);
			ctx.fill();
		}
		ctx.globalAlpha = 1;
	}

	private sky(ctx: CanvasRenderingContext2D) {
		if (this.ground?.height !== this.height) {
			const [top, bottom] = this.palette.sky;
			let style: string | CanvasGradient = rgb(top);
			if (rgb(top) !== rgb(bottom)) {
				style = ctx.createLinearGradient(0, 0, 0, this.height);
				style.addColorStop(0, rgb(top));
				style.addColorStop(1, rgb(bottom));
			}
			this.ground = { style, height: this.height };
		}
		return this.ground.style;
	}

	private moonAnchor(): Point {
		const portrait = this.height > this.width;
		return { x: this.width * (portrait ? 0.68 : 0.74), y: this.height * (portrait ? 0.2 : 0.23) };
	}

	private populate() {
		this.populated = true;
		const { width, height } = this;
		this.scale = Math.max(0.6, Math.min(1, Math.min(width, height) / 700));
		const density = Math.max(0.4, Math.min(1.1, (width * height) / REFERENCE_AREA));
		const scaled = (n: number) => Math.max(1, Math.round(n * density));

		const drift = rand(0, TAU);
		this.moon.vx = Math.cos(drift) * 2;
		this.moon.vy = Math.sin(drift) * 2;

		for (let i = 0; i < scaled(BUTTERFLIES); i++) {
			this.butterflies.push(
				this.spawn(
					{
						wingSize: BUTTERFLY_LOOK.wingSize,
						wingStart: randInt(...BUTTERFLY_LOOK.wingStart),
						wingArc: randInt(...BUTTERFLY_LOOK.wingArc)
					},
					1,
					false
				)
			);
		}

		for (const spec of FLOCKS) {
			const flocks = spec.flocks[1] === 1 ? 1 : scaled(randInt(...spec.flocks));
			for (let i = 0; i < flocks; i++) this.flocks.push(this.spawnFlock(spec));
		}
		this.paint(this.palette);
	}

	private spawn(look: Look, size: number, phase: boolean): Boid {
		return {
			x: rand(0, this.width),
			y: rand(0, this.height),
			vx: rand(-1, 1) * 100,
			vy: rand(-1, 1) * 100,
			size: size * this.scale,
			wingSize: (look.wingSize ?? size * 3) * this.scale,
			wingStart: look.wingStart * DEG,
			wingArc: look.wingArc * DEG,
			flapPeriod: look.flapPeriod ?? -1,
			flap: rand(0, 10),
			fill: '',
			alpha: 1,
			phase,
			tint: [Math.random(), Math.random(), Math.random()]
		};
	}

	private spawnFlock(spec: FlockSpec): Flock {
		const count = randInt(...spec.count);
		const phasers = Math.floor((spec.phaseRatio ?? 0) * count);
		const boids = Array.from({ length: count }, (_, i) =>
			this.spawn(spec.look, Math.max(1, spec.size + randInt(-1, 1)), i < phasers)
		);
		return {
			species: spec.species,
			boids,
			speed: rand(...spec.speed),
			alignmentRadius: 200,
			cohesionRadius: spec.cohesionRadius ?? 200,
			separationRadius: spec.separationRadius ?? spec.size * 2,
			alignmentWeight: spec.alignmentWeight ?? 120,
			cohesionWeight: spec.cohesionWeight ?? 40,
			separationWeight: spec.separationWeight ?? 80,
			currentVelocityWeight: spec.currentVelocityWeight ?? 100
		};
	}

	private stepMoon(dt: number) {
		const moon = this.moon;
		const anchor = this.moonAnchor();
		moon.x += moon.vx * dt;
		moon.y += moon.vy * dt;
		if (Math.abs(moon.x - anchor.x) > 30) moon.vx = -Math.sign(moon.x - anchor.x) * Math.abs(moon.vx);
		if (Math.abs(moon.y - anchor.y) > 30) moon.vy = -Math.sign(moon.y - anchor.y) * Math.abs(moon.vy);
	}

	private stepButterfly(b: Boid, dt: number) {
		const cursor = this.cursor;
		if (cursor) {
			const dx = b.x - cursor.x;
			const dy = b.y - cursor.y;
			const dist = Math.hypot(dx, dy);
			if (dist < CURSOR_RADIUS && dist > 0) {
				const speed = Math.hypot(b.vx, b.vy);
				const push = (1 - dist / CURSOR_RADIUS) * 900 * dt;
				b.vx += (dx / dist) * push;
				b.vy += (dy / dist) * push;
				const scale = speed / (Math.hypot(b.vx, b.vy) || 1);
				b.vx *= scale;
				b.vy *= scale;
			}
		}
		this.move(b, dt);
	}

	private steer(flock: Flock, dt: number) {
		const { boids, speed } = flock;
		const cursor = this.cursor;
		const next = new Float64Array(boids.length * 2);

		for (let i = 0; i < boids.length; i++) {
			const b = boids[i];
			let sx: number;
			let sy: number;
			let weight = flock.alignmentWeight + flock.cohesionWeight + flock.separationWeight;
			let ax = 0;
			let ay = 0;
			let cx = 0;
			let cy = 0;
			let near = 0;
			let px = 0;
			let py = 0;
			for (const o of boids) {
				const dx = b.x - o.x;
				const dy = b.y - o.y;
				const dist = Math.hypot(dx, dy);
				if (dist < flock.alignmentRadius) {
					ax += o.vx;
					ay += o.vy;
				}
				if (dist < flock.cohesionRadius) {
					cx += o.x;
					cy += o.y;
					near++;
				}
				if (dist < flock.separationRadius) {
					const closeness = (1 - (dist * dist) / (flock.separationRadius * flock.separationRadius)) * speed;
					px += dx * closeness;
					py += dy * closeness;
				}
			}
			const alignment = Math.hypot(ax, ay) || 1;
			cx = cx / near - b.x;
			cy = cy / near - b.y;
			const cohesion = Math.hypot(cx, cy) || 1;
			const separation = Math.max(1, Math.hypot(px, py));

			sx =
				(ax / alignment) * flock.alignmentWeight +
				(cx / cohesion) * flock.cohesionWeight +
				(px / separation) * flock.separationWeight;
			sy =
				(ay / alignment) * flock.alignmentWeight +
				(cy / cohesion) * flock.cohesionWeight +
				(py / separation) * flock.separationWeight;

			if (cursor) {
				const dx = b.x - cursor.x;
				const dy = b.y - cursor.y;
				const dist = Math.hypot(dx, dy);
				if (dist < CURSOR_RADIUS && dist > 0) {
					const push = CURSOR_WEIGHT * (1 - dist / CURSOR_RADIUS);
					sx += (dx / dist) * push;
					sy += (dy / dist) * push;
					weight += push;
				}
			}

			const steering = Math.hypot(sx, sy);
			if (steering > 0) {
				sx = (sx / steering) * speed;
				sy = (sy / steering) * speed;
			} else {
				const current = Math.hypot(b.vx, b.vy) || 1;
				sx = (b.vx / current) * speed;
				sy = (b.vy / current) * speed;
			}

			const lerp = (weight / (weight + flock.currentVelocityWeight)) * dt;
			next[i * 2] = sx * lerp + b.vx * (1 - lerp);
			next[i * 2 + 1] = sy * lerp + b.vy * (1 - lerp);
		}

		for (let i = 0; i < boids.length; i++) {
			boids[i].vx = next[i * 2];
			boids[i].vy = next[i * 2 + 1];
		}
	}

	private move(b: Boid, dt: number) {
		b.x += b.vx * dt;
		b.y += b.vy * dt;
		if (b.phase) {
			b.x = ((b.x % this.width) + this.width) % this.width;
			b.y = ((b.y % this.height) + this.height) % this.height;
			return;
		}
		if (b.x < b.size) b.vx = Math.abs(b.vx);
		else if (b.x > this.width - b.size) b.vx = -Math.abs(b.vx);
		if (b.y < b.size) b.vy = Math.abs(b.vy);
		else if (b.y > this.height - b.size) b.vy = -Math.abs(b.vy);
	}

	private stepBorb(b: Borb, dt: number) {
		let tx: number;
		let ty: number;
		let rate: number;

		if (b.roam > 0) {
			b.roam -= dt;
			const current = Math.hypot(b.vx, b.vy) || 1;
			tx = (b.vx / current) * 200;
			ty = (b.vy / current) * 200;
			rate = 1.5;
			if (b.x < 0) b.vx = Math.abs(b.vx);
			else if (b.x > this.width) b.vx = -Math.abs(b.vx);
			if (b.y < 0) b.vy = Math.abs(b.vy);
			else if (b.y > this.height) b.vy = -Math.abs(b.vy);
		} else {
			const bob = this.cell * 0.05;
			const dx = b.hx + Math.cos(this.time * 0.9 + b.seed) * bob - b.x;
			const dy = b.hy + Math.sin(this.time * 1.3 + b.seed) * bob - b.y;
			const dist = Math.hypot(dx, dy) || 1;
			const speed = Math.min(BORB_SPEED, dist * BORB_ARRIVE);
			tx = (dx / dist) * speed;
			ty = (dy / dist) * speed;
			rate = BORB_ARRIVE;
		}

		if (this.cursor) {
			const dx = b.x - this.cursor.x;
			const dy = b.y - this.cursor.y;
			const dist = Math.hypot(dx, dy);
			if (dist < CURSOR_RADIUS && dist > 0) {
				const closeness = 1 - dist / CURSOR_RADIUS;
				tx += (dx / dist) * 580 * closeness;
				ty += (dy / dist) * 580 * closeness;
				rate += 6 * closeness;
			}
		}

		const blend = Math.min(1, rate * dt);
		b.vx += (tx - b.vx) * blend;
		b.vy += (ty - b.vy) * blend;
		b.x += b.vx * dt;
		b.y += b.vy * dt;

		const speed = Math.hypot(b.vx, b.vy);
		if (speed > 6) b.heading = Math.atan2(b.vy, b.vx);
		const flight = Math.min(1, Math.max(0, (speed - 4) / 50));
		b.flight += (flight - b.flight) * Math.min(1, 8 * dt);
	}

	private drawBoid(ctx: CanvasRenderingContext2D, b: Boid, dt: number) {
		const period =
			b.flapPeriod < 0 ? (20 / Math.max(20, Math.hypot(b.vx, b.vy))) * (Math.max(20, b.size) / 10) : b.flapPeriod;
		b.flap += dt / period;

		ctx.fillStyle = b.fill;
		ctx.globalAlpha = flapAlpha(b.flap) * b.alpha;
		wings(ctx, b.x, b.y, b.wingSize, Math.atan2(b.vy, b.vx), b.wingStart, b.wingArc);
		ctx.globalAlpha = b.alpha;
		ctx.beginPath();
		ctx.arc(b.x, b.y, b.size, 0, TAU);
		ctx.fill();
	}
}
