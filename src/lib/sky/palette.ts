import type { Species } from './scene';

export type Rgb = [number, number, number];
export type Rgba = [number, number, number, number];
type Range = [number, number];

export interface Palette {
	/** Top and bottom of the sky. */
	sky: [Rgb, Rgb];
	moon: Rgba;
	letters: Rgb;
	birds: Record<Species, Rgba>;
	/** A soft shadow under a species too close to the sky's own lightness to show without one. */
	shadows?: Partial<Record<Species, Rgba>>;
	butterflies: { hue: Range; saturation: Range; lightness: Range };
}

export const TWILIGHT: Palette = {
	sky: [
		[30, 25, 46],
		[66, 46, 68]
	],
	moon: [134, 96, 122, 255],
	letters: [242, 234, 216],
	birds: {
		bats: [18, 14, 28, 255],
		spirits: [196, 176, 214, 60],
		hummingbirds: [152, 142, 212, 255],
		cardinals: [202, 114, 132, 255],
		wrens: [228, 172, 130, 255],
		doves: [255, 190, 200, 255]
	},
	butterflies: { hue: [285, 390], saturation: [25, 50], lightness: [60, 78] }
};

/** The wordmark is the darkest thing on the page, so the birds drawn under it never hide it. */
export const DUSK_PAPER: Palette = {
	sky: [
		[235, 233, 240],
		[247, 233, 227]
	],
	moon: [247, 224, 202, 255],
	letters: [38, 30, 50],
	birds: {
		bats: [126, 115, 146, 153],
		spirits: [70, 56, 90, 30],
		hummingbirds: [160, 152, 216, 255],
		cardinals: [222, 148, 166, 255],
		wrens: [236, 188, 148, 255],
		doves: [255, 246, 228, 255]
	},
	shadows: { doves: [70, 50, 96, 190] },
	butterflies: { hue: [285, 390], saturation: [30, 50], lightness: [62, 76] }
};
