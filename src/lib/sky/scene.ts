export type Rgba = [number, number, number, number];

export interface Look {
	color: Rgba;
	wingSize?: number;
	wingStart: number;
	wingArc: number;
	flapPeriod?: number;
}

export interface FlockSpec {
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

export const BACKGROUND: [number, number, number] = [50, 40, 60];
export const MOON: Rgba = [220, 231, 191, 190];

/** Flock counts and the butterfly count are tuned for this area and scale with the viewport. */
export const REFERENCE_AREA = 1200 * 600;

export const BUTTERFLIES = 80;
export const BUTTERFLY_LOOK = { wingSize: 5, wingStart: [30, 60], wingArc: [120, 180] } as const;

export const FLOCKS: FlockSpec[] = [
	{
		look: { color: [22, 16, 30, 255], wingStart: 40, wingArc: 130 },
		flocks: [3, 3],
		count: [14, 17],
		speed: [50, 70],
		size: 7,
		phaseRatio: 1,
		separationRadius: 20
	},
	{
		look: { color: [200, 170, 200, 70], wingSize: 24, wingStart: 0, wingArc: 180, flapPeriod: 1.5 },
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
		look: { color: [112, 134, 214, 255], wingStart: 55, wingArc: 160, flapPeriod: 0.05 },
		flocks: [3, 3],
		count: [14, 17],
		speed: [150, 150],
		size: 4,
		phaseRatio: 0.3,
		alignmentWeight: 60,
		cohesionWeight: 20,
		cohesionRadius: 400
	},
	{
		look: { color: [212, 98, 96, 255], wingStart: 40, wingArc: 160 },
		flocks: [2, 3],
		count: [11, 14],
		speed: [150, 190],
		size: 7,
		phaseRatio: 0.4,
		currentVelocityWeight: 20,
		separationRadius: 18
	},
	{
		look: { color: [128, 188, 152, 255], wingStart: 75, wingArc: 120 },
		flocks: [1, 2],
		count: [11, 13],
		speed: [120, 140],
		size: 8,
		alignmentWeight: 300,
		cohesionWeight: 100,
		separationWeight: 300
	},
	{
		look: { color: [255, 168, 188, 255], wingStart: 30, wingArc: 170 },
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
