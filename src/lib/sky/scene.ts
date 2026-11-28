export interface Look {
	/** A wedge behind the body that fades half as far as the wings on each beat: its length in body radii and its spread in degrees. */
	tail?: [number, number];
	wingSize?: number;
	/** The wings' length in body radii, where `wingSize` is not set. */
	wingReach?: number;
	wingStart: number;
	wingArc: number;
	flapPeriod?: number;
	/** A wedge ahead of the body, drawn like the tail: its length in body radii and its spread in degrees. */
	bill?: [number, number];
	/** Fade the wings, tail and bill with the bird's speed, leaving only its body once it sits. */
	tucks?: boolean;
}

export type Species = 'bats' | 'spirits' | 'hummingbirds' | 'cardinals' | 'wrens' | 'doves' | 'herons';

export interface FlockSpec {
	species: Species;
	look: Look;
	flocks: [number, number];
	count: [number, number];
	speed: [number, number];
	size: number;
	phaseRatio?: number;
	/** The flock flies on past the page's edges instead of turning back. */
	wanders?: boolean;
	alignmentWeight?: number;
	cohesionWeight?: number;
	separationWeight?: number;
	currentVelocityWeight?: number;
	cohesionRadius?: number;
	separationRadius?: number;
}

/** Flock counts and the butterfly count are tuned for this area and scale with the viewport. */
export const REFERENCE_AREA = 1200 * 600;

export const BUTTERFLIES = 80;
export const BUTTERFLY_LOOK = { wingSize: 5, wingStart: [30, 60], wingArc: [120, 180] } as const;

export const FLOCKS: FlockSpec[] = [
	{
		species: 'bats',
		look: { wingStart: 40, wingArc: 130 },
		flocks: [4, 4],
		count: [14, 17],
		speed: [50, 70],
		size: 7,
		phaseRatio: 1,
		separationRadius: 20
	},
	{
		species: 'spirits',
		look: { wingSize: 24, wingStart: 0, wingArc: 180, flapPeriod: 1.5 },
		flocks: [1, 1],
		count: [5, 5],
		speed: [180, 180],
		size: 14,
		phaseRatio: 1,
		alignmentWeight: 10,
		cohesionWeight: 120,
		separationWeight: 120,
		cohesionRadius: 200,
		separationRadius: 90
	},
	{
		species: 'hummingbirds',
		look: { wingStart: 55, wingArc: 160, flapPeriod: 0.05, tail: [2.4, 30] },
		flocks: [4, 4],
		count: [14, 17],
		speed: [150, 150],
		size: 4,
		phaseRatio: 0.3,
		alignmentWeight: 60,
		cohesionWeight: 20,
		cohesionRadius: 400
	},
	{
		species: 'cardinals',
		look: { wingStart: 40, wingArc: 160, tail: [2.8, 36] },
		flocks: [2, 3],
		count: [11, 14],
		speed: [150, 190],
		size: 7,
		phaseRatio: 0.4,
		currentVelocityWeight: 20,
		separationRadius: 18
	},
	{
		species: 'wrens',
		look: { wingStart: 75, wingArc: 120, tail: [3.6, 26] },
		flocks: [1, 2],
		count: [11, 13],
		speed: [120, 140],
		size: 8,
		alignmentWeight: 300,
		cohesionWeight: 100,
		separationWeight: 300
	},
	{
		species: 'doves',
		look: { wingReach: 2.5, wingStart: 30, wingArc: 170, tail: [2.8, 62] },
		flocks: [1, 1],
		count: [2, 2],
		speed: [120, 120],
		size: 8,
		phaseRatio: 0.5,
		alignmentWeight: 50,
		cohesionWeight: 110,
		separationWeight: 115,
		cohesionRadius: Infinity,
		separationRadius: 30
	},
	{
		species: 'herons',
		look: { wingReach: 3, wingStart: 45, wingArc: 125, tail: [1.8, 50], bill: [2.5, 10], tucks: true },
		flocks: [1, 1],
		count: [2, 2],
		speed: [95, 110],
		size: 9,
		wanders: true,
		cohesionWeight: 20,
		separationRadius: 70
	}
];
