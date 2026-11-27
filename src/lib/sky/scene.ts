export interface Look {
	/** A wedge behind the body that fades half as far as the wings on each beat: its length in body radii and its spread in degrees. */
	tail?: [number, number];
	wingSize?: number;
	wingStart: number;
	wingArc: number;
	flapPeriod?: number;
}

export type Species = 'bats' | 'spirits' | 'hummingbirds' | 'cardinals' | 'budgerigars' | 'doves';

export interface FlockSpec {
	species: Species;
	look: Look;
	flocks: [number, number];
	count: [number, number];
	speed: [number, number];
	size: number;
	phaseRatio?: number;
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
		flocks: [3, 3],
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
		species: 'budgerigars',
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
		look: { wingStart: 30, wingArc: 170, tail: [2.7, 62] },
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
	}
];
