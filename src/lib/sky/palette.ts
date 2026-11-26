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
	butterflies: { hue: Range; saturation: Range; lightness: Range };
}

export const DUSK: Palette = {
	sky: [
		[50, 40, 60],
		[50, 40, 60]
	],
	moon: [220, 231, 191, 190],
	letters: [220, 231, 191],
	birds: {
		bats: [22, 16, 30, 255],
		spirits: [200, 170, 200, 70],
		hummingbirds: [112, 134, 214, 255],
		cardinals: [212, 98, 96, 255],
		budgerigars: [128, 188, 152, 255],
		doves: [255, 168, 188, 255]
	},
	butterflies: { hue: [250, 400], saturation: [35, 70], lightness: [55, 78] }
};
