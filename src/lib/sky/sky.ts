import { ROWS, columnsOf, layoutWord, placeWord, type Point } from './letters';
import type { Palette, Rgb, Rgba } from './palette';
import { BUTTERFLIES, BUTTERFLY_LOOK, FLOCKS, REFERENCE_AREA, type FlockSpec, type Look, type Species } from './scene';

const DEG = Math.PI / 180;
const TAU = Math.PI * 2;

const TRAIL = 100 / 255;
const CURSOR_RADIUS = 130;
const CURSOR_WEIGHT = 700;

const BORB_SPEED = 420;
const BORB_ARRIVE = 5;
/** How much a hovered link grows about its middle, dots and spacing alike. */
const LINK_SWELL = 0.12;
/** The swell's front travels this many pixels a second and is this many pixels deep. */
const SWELL_SPEED = 1100;
const SWELL_FRONT = 70;
/** A link's dots settle faster than the title's, so a hover answers at once. */
const LINK_ARRIVE = 16;

const LINK_GAP_COLUMNS = 8;
const GATHER_REACH = 3.2;
const GATHER_WEIGHT = 900;
const FLOW_WEIGHT = 1100;
const FLOW_MARGIN = 26;
/** Drawn last, over the wordmark and the links. */
const TOPMOST: Species = 'doves';
const PERCHERS: Species[] = ['hummingbirds', 'cardinals', 'wrens', 'doves'];

/** What a link's letters and the birds around it do while the link is hovered or focused. */
export type LinkStyle = 'ruffle' | 'perch' | 'gather' | 'hop' | 'tighten' | 'flow';

export type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface Rect {
	x: number;
	y: number;
	w: number;
	h: number;
}

/** A link is spelled in dots, or, given `mark`, drawn as one orb carrying that SVG path from a 16-unit box. */
export interface LinkSpec {
	text: string;
	mark?: string;
	/** The corner a mark sits in; bottom right unless said. */
	corner?: Corner;
}

interface Link {
	text: string;
	/** The orb's radius for a mark link, 0 for a word. */
	radius: number;
	rect: Rect;
	cell: number;
	borbs: Borb[];
	hovered: boolean;
	/** Eases toward 1 while hovered and back to 0 after. */
	glow: number;
	/** Where the current hover began and how long ago, for the swell that spreads from there. */
	origin: Point;
	hoverAge: number;
	percher: Boid | null;
}

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
	tailSize: number;
	tailSpread: number;
	flapPeriod: number;
	flap: number;
	fill: string;
	alpha: number;
	phase: boolean;
	/** Where this bird falls in each of the palette's butterfly ranges. */
	tint: [number, number, number];
	/** Set while the bird is flying to, or sitting on, a hovered link. */
	perch: Point | null;
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

/** A dot of the wordmark or of a link: it flies like a bird while `roam` runs, then steers back to its home. */
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
	link: Link | null;
}

const MARK_REST_ALPHA = 0.62;
/** Every letter dot, in the title or a link, wears the same wings. */
const WING_REACH = 2.6;
const WING_START = 40 * DEG;
const WING_ARC = 130 * DEG;
/** How far, in radians, a hovered link dot's wings jitter about its facing. */
const BUZZ = 0.16;
const FLAP_PEAK = 0.9;
/** How far a tail fades over a wingbeat, as a share of how far the wings do. */
const TAIL_FADE = 0.5;

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
	return (t > 1 ? 2 - t : t) * FLAP_PEAK;
}

export class Sky {
	width = 0;
	height = 0;
	linkStyle: LinkStyle = 'flow';

	/** The moon rests behind the word's "o", or off to one side of a word without one. */
	private moonAnchor: Point = { x: 0, y: 0 };
	private moon = { x: 0, y: 0, vx: 0, vy: 0, size: 0, halo: rand(0.3, 0.6) };
	private butterflies: Boid[] = [];
	private flocks: Flock[] = [];
	private borbs: Borb[] = [];
	private links: Link[] = [];
	private marks: Path2D[] = [];
	private cell = 0;
	private time = 0;
	private populated = false;
	/** Where each pointer on the page is, by pointer id: a mouse, or every finger of a touch. */
	private pointers = new Map<number, Point>();
	private scale = 1;

	private ground: { style: string | CanvasGradient; height: number } | null = null;

	constructor(
		private word: string,
		private palette: Palette,
		private linkSpecs: LinkSpec[] = []
	) {}

	get linkRects(): Rect[] {
		return this.links.map((link) => link.rect);
	}

	touch(id: number, x: number, y: number) {
		this.pointers.set(id, { x, y });
	}

	lift(id: number) {
		this.pointers.delete(id);
	}

	/** Lights or puts out a link. `from` is where the pointer met it; the swell spreads from there. */
	hover(index: number, on: boolean, from?: Point) {
		const link = this.links[index];
		if (on && !link.hovered) {
			const { rect } = link;
			const inside =
				from && from.x >= rect.x && from.x <= rect.x + rect.w && from.y >= rect.y && from.y <= rect.y + rect.h;
			link.origin = inside ? { ...from } : { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
			link.hoverAge = 0;
		}
		link.hovered = on;
		if (this.linkStyle !== 'perch') return;
		if (on) this.callPercher(link);
		else this.release(link, 1.1);
	}

	press(index: number) {
		this.release(this.links[index], 2);
	}

	setLinkStyle(style: LinkStyle) {
		for (const link of this.links) this.release(link, 1.1);
		this.linkStyle = style;
	}

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
		const dx = this.moon.x - this.moonAnchor.x;
		const dy = this.moon.y - this.moonAnchor.y;
		this.width = width;
		this.height = height;

		const { cell, homes, letters } = layoutWord(this.word, width, height);
		this.cell = cell;
		const portrait = height > width;
		this.moonAnchor = letters[this.word.indexOf('o')] ?? {
			x: width * (portrait ? 0.62 : 0.7),
			y: height * (portrait ? 0.48 : 0.52)
		};
		this.moon.size = Math.max(40, Math.min(100, Math.min(width, height) * 0.15));
		this.moon.x = this.moonAnchor.x + (first ? 0 : dx);
		this.moon.y = this.moonAnchor.y + (first ? 0 : dy);
		const placed = this.placeLinks(cell);
		if (first) {
			this.populate();
			this.borbs = this.hatch(homes, null, 0.3);
			this.links = placed.map(({ rect, cell, radius, homes }, i) => {
				const text = this.linkSpecs[i].text;
				const link: Link = { text, radius, rect, cell, borbs: [], hovered: false, glow: 0, origin: { x: 0, y: 0 }, hoverAge: 0, percher: null };
				link.borbs = this.hatch(homes, link, 1.3 + i * 0.3);
				return link;
			});
		} else {
			homes.forEach((home, i) => {
				this.borbs[i].hx = home.x;
				this.borbs[i].hy = home.y;
			});
			placed.forEach(({ rect, cell, radius, homes }, i) => {
				const link = this.links[i];
				link.rect = rect;
				link.cell = cell;
				link.radius = radius;
				homes.forEach((home, j) => {
					link.borbs[j].hx = home.x;
					link.borbs[j].hy = home.y;
				});
			});
		}
	}

	/** Puts the wordmark at rest, for a still frame. */
	settle() {
		for (const b of this.everyBorb()) {
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
		for (const link of this.links) {
			link.glow += ((link.hovered ? 1 : 0) - link.glow) * Math.min(1, 18 * dt);
			link.hoverAge += dt;
		}
		for (const b of this.everyBorb()) this.stepBorb(b, dt);
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
		for (const flock of this.flocks) {
			if (flock.species !== TOPMOST) for (const b of flock.boids) this.drawBoid(ctx, b, dt);
		}

		ctx.fillStyle = rgb(this.palette.letters);
		this.drawBorbs(ctx, this.borbs, this.cell * 0.42, 0.95, dt);
		for (const [index, link] of this.links.entries()) {
			if (link.radius) {
				this.drawMark(ctx, link, index);
				continue;
			}
			const { glow } = link;
			let radius = link.cell * 0.42;
			let alpha = 0.95;
			let grow: ((b: Borb) => number) | undefined;
			if (this.linkStyle === 'flow') {
				grow = (b) => 1 + LINK_SWELL * this.swellOf(b, link);
			} else if (this.linkStyle === 'ruffle') {
				radius *= 1 + 0.3 * glow;
				if (glow > 0.02) {
					for (const b of link.borbs) {
						ctx.globalAlpha = flapAlpha(this.time * 9 + b.seed) * glow * 0.5;
						const sway = Math.sin(this.time * 1.1 + b.seed) * 0.5;
						const facing = b.seed * 7 + sway + Math.sin(this.time * 23 + b.seed * 3) * BUZZ;
						wings(ctx, b.x, b.y, radius * WING_REACH, facing, WING_START, WING_ARC);
					}
				}
			} else if (this.linkStyle === 'tighten') {
				radius *= 0.8 + 0.2 * glow;
				alpha = 0.55 + 0.4 * glow;
			}
			this.drawBorbs(ctx, link.borbs, radius, alpha, dt, grow);
		}
		for (const flock of this.flocks) {
			if (flock.species === TOPMOST) for (const b of flock.boids) this.drawBoid(ctx, b, dt);
		}
		ctx.globalAlpha = 1;
	}

	private *everyBorb() {
		yield* this.borbs;
		for (const link of this.links) yield* link.borbs;
	}

	private get hovering() {
		return this.links.some((link) => link.hovered && !link.radius);
	}

	private hatch(homes: Point[], link: Link | null, delay: number): Borb[] {
		const left = homes[0].x;
		const span = homes[homes.length - 1].x - left || 1;
		return homes.map((home) => {
			const angle = rand(0, TAU);
			return {
				x: rand(0, this.width),
				y: rand(0, this.height),
				vx: Math.cos(angle) * 160,
				vy: Math.sin(angle) * 160,
				hx: home.x,
				hy: home.y,
				roam: delay + (0.9 * (home.x - left)) / span + rand(0, 0.3),
				heading: angle,
				flight: 1,
				flap: rand(0, 10),
				seed: rand(0, TAU),
				link
			};
		});
	}

	/**
	 * Word links sit along the bottom of the page, side by side on a wide screen and stacked on a tall one.
	 * Mark links are orbs in the corners.
	 */
	private placeLinks(wordCell: number) {
		const { width, height } = this;
		const words = this.linkSpecs.filter((spec) => !spec.mark);
		const columns = words.map((spec) => columnsOf(spec.text));
		const stacked = height > width;
		const span = stacked
			? Math.max(0, ...columns)
			: columns.reduce((n, c) => n + c, 0) + LINK_GAP_COLUMNS * (columns.length - 1);
		const cell = Math.min(wordCell * (stacked ? 0.75 : 0.5), (width * 0.8) / (span || 1), 11);
		const rows = stacked ? columns.length * (ROWS + 3) - 3 : ROWS;
		const top = height - Math.max(60, height * 0.13) - (rows - 0.5) * cell;
		let left = (width - (span - 1) * cell) / 2;

		const radius = Math.max(16, Math.min(24, Math.min(width, height) * 0.035));
		const margin = Math.max(20, Math.min(width, height) * 0.04);
		const taken: Partial<Record<Corner, number>> = {};

		let word = 0;
		return this.linkSpecs.map((spec) => {
			if (spec.mark) {
				const corner = spec.corner ?? 'bottom-right';
				const inset = margin + radius + (taken[corner] ?? 0);
				taken[corner] = (taken[corner] ?? 0) + radius * 2 + 16;
				const home = {
					x: corner.endsWith('left') ? inset : width - inset,
					y: corner.startsWith('top') ? margin + radius : height - margin - radius
				};
				const reach = radius + 8;
				return {
					cell: radius * 0.4,
					radius,
					homes: [home],
					rect: { x: home.x - reach, y: home.y - reach, w: reach * 2, h: reach * 2 }
				};
			}
			const i = word++;
			const x = stacked ? (width - (columns[i] - 1) * cell) / 2 : left;
			const y = stacked ? top + i * (ROWS + 3) * cell : top;
			left += (columns[i] + LINK_GAP_COLUMNS) * cell;
			return {
				cell,
				radius: 0,
				homes: placeWord(spec.text, x, y, cell),
				rect: { x: x - cell, y: y - cell, w: (columns[i] + 1) * cell, h: (ROWS + 1) * cell }
			};
		});
	}

	/** A mark is a plain button: it stays in its corner and brightens while hovered. */
	private drawMark(ctx: CanvasRenderingContext2D, link: Link, index: number) {
		const { rect, radius } = link;
		const path = (this.marks[index] ??= new Path2D(this.linkSpecs[index].mark));
		ctx.globalAlpha = MARK_REST_ALPHA + (1 - MARK_REST_ALPHA) * link.glow;
		ctx.save();
		ctx.translate(rect.x + rect.w / 2 - radius, rect.y + rect.h / 2 - radius);
		ctx.scale(radius / 8, radius / 8);
		ctx.fill(path, 'evenodd');
		ctx.restore();
		ctx.fillStyle = rgb(this.palette.letters);
	}

	private callPercher(link: Link) {
		if (link.percher) return;
		const cx = link.rect.x + link.rect.w / 2;
		const cy = link.rect.y + link.rect.h / 2;
		let best: Boid | null = null;
		let bestDist = Infinity;
		for (const flock of this.flocks) {
			if (!PERCHERS.includes(flock.species)) continue;
			for (const b of flock.boids) {
				const dist = Math.hypot(b.x - cx, b.y - cy);
				if (!b.perch && dist < bestDist) {
					best = b;
					bestDist = dist;
				}
			}
		}
		if (!best) return;
		const top = Math.min(...link.borbs.map((b) => b.hy));
		const seat = link.borbs
			.filter((b) => b.hy === top)
			.reduce((a, b) => (Math.abs(b.hx - cx) < Math.abs(a.hx - cx) ? b : a));
		best.perch = { x: seat.hx, y: seat.hy - link.cell * 0.42 - best.size };
		link.percher = best;
	}

	private release(link: Link, vigor: number) {
		const bird = link.percher;
		if (!bird) return;
		bird.perch = null;
		bird.vx = rand(-0.7, 0.7) * 160 * vigor;
		bird.vy = -160 * vigor;
		link.percher = null;
	}

	/** While a link is hovered in the gather style, the pull that bends a bird at (x, y) into orbit around it. */
	private gather(x: number, y: number): { x: number; y: number; weight: number } | null {
		if (this.linkStyle !== 'gather' && this.linkStyle !== 'flow') return null;
		for (const { rect, glow, radius } of this.links) {
			if (radius || glow < 0.05) continue;
			const rx = rect.w / 2 + 34;
			const ry = rect.h / 2 + 34;
			const ex = (x - rect.x - rect.w / 2) / rx;
			const ey = (y - rect.y - rect.h / 2) / ry;
			const ring = Math.hypot(ex, ey) || 1;
			if (ring > GATHER_REACH) continue;
			const tangent = Math.hypot(ey * rx, ex * ry) || 1;
			const normal = Math.hypot(ex / rx, ey / ry) || 1;
			const inward = Math.max(-1, Math.min(1, 1 - ring)) * 1.6;
			const dx = (-ey * rx) / tangent + (ex / rx / normal) * inward;
			const dy = (ex * ry) / tangent + (ey / ry / normal) * inward;
			const length = Math.hypot(dx, dy) || 1;
			const falloff = ring < GATHER_REACH / 2 ? 1 : (GATHER_REACH - ring) / (GATHER_REACH / 2);
			return { x: dx / length, y: dy / length, weight: GATHER_WEIGHT * glow * falloff };
		}
		return null;
	}

	/**
	 * In the flow style a hovered link clears itself: a bird at (x, y) moving along (vx, vy) is pushed off
	 * the word and along its edge, harder the closer it gets.
	 */
	private flow(x: number, y: number, vx: number, vy: number): { x: number; y: number; weight: number } | null {
		if (this.linkStyle !== 'flow') return null;
		let sx = 0;
		let sy = 0;
		let weight = 0;
		const around = (rect: Rect, margin: number, strength: number) => {
			const nx = Math.max(rect.x, Math.min(rect.x + rect.w, x));
			const ny = Math.max(rect.y, Math.min(rect.y + rect.h, y));
			let dx = x - nx;
			let dy = y - ny;
			let dist = Math.hypot(dx, dy);
			if (dist >= margin) return;
			if (dist === 0) {
				dx = 0;
				dy = y < rect.y + rect.h / 2 ? -1 : 1;
				dist = 1;
			} else {
				dx /= dist;
				dy /= dist;
				dist = 1 - dist / margin;
			}
			const along = vx * -dy + vy * dx >= 0 ? 1 : -1;
			sx += (dx + -dy * along * 0.7) * dist * strength;
			sy += (dy + dx * along * 0.7) * dist * strength;
			weight += dist * strength;
		};
		for (const link of this.links) {
			if (!link.radius && link.glow > 0.05) around(link.rect, FLOW_MARGIN, link.glow);
		}
		return weight ? { x: sx * FLOW_WEIGHT, y: sy * FLOW_WEIGHT, weight: Math.min(1, weight) * FLOW_WEIGHT } : null;
	}

	/** Birds leave every pointer alone while they circle a hovered link. */
	private get birdPointers(): Iterable<Point> {
		return (this.linkStyle === 'gather' || this.linkStyle === 'flow') && this.hovering ? [] : this.pointers.values();
	}

	/** How swollen a link's dot is, 0 to 1: the swell spreads from where the hover began and ebbs all at once. */
	private swellOf(b: Borb, link: Link): number {
		const reached = link.hoverAge * SWELL_SPEED - Math.hypot(b.hx - link.origin.x, b.hy - link.origin.y);
		const front = Math.max(0, Math.min(1, reached / SWELL_FRONT + 1));
		return link.hovered ? front : Math.min(front, link.glow);
	}

	private restOffset(b: Borb): Point {
		const t = this.time;
		const link = b.link;
		if (link && this.linkStyle === 'flow') {
			const swell = LINK_SWELL * this.swellOf(b, link);
			const { rect } = link;
			return { x: (b.hx - rect.x - rect.w / 2) * swell, y: (b.hy - rect.y - rect.h / 2) * swell };
		}
		if (link && this.linkStyle === 'ruffle') {
			const reach = link.cell * 0.2 * link.glow;
			return { x: Math.cos(t * 13 + b.seed) * reach, y: Math.sin(t * 17 + b.seed * 2) * reach };
		}
		if (link && this.linkStyle === 'hop') {
			const along = (b.hx - link.rect.x) / link.rect.w;
			return { x: 0, y: -Math.abs(Math.sin(t * 6 - along * 6)) * link.cell * 0.9 * link.glow };
		}
		if (link && this.linkStyle === 'tighten') {
			const reach = link.cell * 0.3 * (1 - link.glow);
			return { x: Math.cos(t * 0.7 + b.seed) * reach, y: Math.sin(t * 0.9 + b.seed * 1.7) * reach };
		}
		const bob = (link?.cell ?? this.cell) * 0.05;
		return { x: Math.cos(t * 0.9 + b.seed) * bob, y: Math.sin(t * 1.3 + b.seed) * bob };
	}

	private drawBorbs(
		ctx: CanvasRenderingContext2D,
		borbs: Borb[],
		size: number,
		alpha: number,
		dt: number,
		grow?: (b: Borb) => number
	) {
		for (const b of borbs) {
			const radius = grow ? size * grow(b) : size;
			if (b.flight > 0.02) {
				b.flap += dt / 0.14;
				ctx.globalAlpha = flapAlpha(b.flap) * b.flight * 0.85;
				wings(ctx, b.x, b.y, radius * WING_REACH, b.heading, WING_START, WING_ARC);
			}
			ctx.globalAlpha = alpha;
			ctx.beginPath();
			ctx.arc(b.x, b.y, radius, 0, TAU);
			ctx.fill();
		}
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
			tailSize: (look.tail?.[0] ?? 0) * size * this.scale,
			tailSpread: (look.tail?.[1] ?? 0) * DEG,
			flapPeriod: look.flapPeriod ?? -1,
			flap: rand(0, 10),
			fill: '',
			alpha: 1,
			phase,
			tint: [Math.random(), Math.random(), Math.random()],
			perch: null
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
		const anchor = this.moonAnchor;
		moon.x += moon.vx * dt;
		moon.y += moon.vy * dt;
		if (Math.abs(moon.x - anchor.x) > 30) moon.vx = -Math.sign(moon.x - anchor.x) * Math.abs(moon.vx);
		if (Math.abs(moon.y - anchor.y) > 30) moon.vy = -Math.sign(moon.y - anchor.y) * Math.abs(moon.vy);
	}

	private stepButterfly(b: Boid, dt: number) {
		const pull = this.gather(b.x, b.y);
		if (pull) {
			const speed = Math.hypot(b.vx, b.vy);
			const turn = (pull.weight / GATHER_WEIGHT) * 4 * dt * speed;
			b.vx += pull.x * turn;
			b.vy += pull.y * turn;
			const scale = speed / (Math.hypot(b.vx, b.vy) || 1);
			b.vx *= scale;
			b.vy *= scale;
		}
		for (const cursor of this.birdPointers) {
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
		const cursors = [...this.birdPointers];
		const next = new Float64Array(boids.length * 2);

		for (let i = 0; i < boids.length; i++) {
			const b = boids[i];
			if (b.perch) {
				const dx = b.perch.x - b.x;
				const dy = b.perch.y - b.y;
				const dist = Math.hypot(dx, dy) || 1;
				const approach = Math.min(speed * 1.8, dist * 5);
				const blend = Math.min(1, 6 * dt);
				next[i * 2] = b.vx + ((dx / dist) * approach - b.vx) * blend;
				next[i * 2 + 1] = b.vy + ((dy / dist) * approach - b.vy) * blend;
				continue;
			}
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

			for (const cursor of cursors) {
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

			const pull = this.gather(b.x, b.y);
			if (pull) {
				sx += pull.x * pull.weight;
				sy += pull.y * pull.weight;
				weight += pull.weight;
			}
			const push = this.flow(b.x, b.y, b.vx, b.vy);
			if (push) {
				sx += push.x;
				sy += push.y;
				weight += push.weight;
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
		if (b.perch) {
			if (Math.hypot(b.perch.x - b.x, b.perch.y - b.y) < 1.5) {
				b.x = b.perch.x;
				b.y = b.perch.y;
				b.vx = b.vy = 0;
			}
			return;
		}
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
			const offset = this.restOffset(b);
			const dx = b.hx + offset.x - b.x;
			const dy = b.hy + offset.y - b.y;
			const dist = Math.hypot(dx, dy) || 1;
			const arrive = b.link ? LINK_ARRIVE : BORB_ARRIVE;
			const speed = Math.min(BORB_SPEED, dist * arrive);
			tx = (dx / dist) * speed;
			ty = (dy / dist) * speed;
			rate = arrive;
		}

		for (const cursor of b.link ? [] : this.pointers.values()) {
			const dx = b.x - cursor.x;
			const dy = b.y - cursor.y;
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
		const folded = b.perch ? Math.min(1, Math.hypot(b.vx, b.vy) / 60) : 1;
		const beat = flapAlpha(b.flap);
		ctx.globalAlpha = beat * b.alpha * folded;
		const heading = Math.atan2(b.vy, b.vx);
		wings(ctx, b.x, b.y, b.wingSize, heading, b.wingStart, b.wingArc);
		if (b.tailSize) {
			ctx.globalAlpha = b.alpha * (1 - TAIL_FADE * (1 - beat / FLAP_PEAK));
			const back = heading + Math.PI;
			ctx.beginPath();
			ctx.moveTo(b.x, b.y);
			ctx.arc(b.x, b.y, b.tailSize, back - b.tailSpread / 2, back + b.tailSpread / 2);
			ctx.fill();
		}
		ctx.globalAlpha = b.alpha;
		ctx.beginPath();
		ctx.arc(b.x, b.y, b.size, 0, TAU);
		ctx.fill();
	}
}
