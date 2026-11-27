<script lang="ts">
	import { mountSky, type SkyLink } from './mount';

	let { links = [] }: { links?: SkyLink[] } = $props();
	let canvas: HTMLCanvasElement;

	$effect(() => mountSky(canvas, 'birdorbs', links));
</script>

<canvas bind:this={canvas} aria-hidden="true"></canvas>

<style>
	canvas {
		display: block;
		width: 100%;
		height: 100%;
		touch-action: none;
	}
</style>
