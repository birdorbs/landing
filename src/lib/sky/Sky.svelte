<script lang="ts">
	import { mountSky } from './mount';

	let canvas: HTMLCanvasElement;

	$effect(() => mountSky(canvas));
</script>

<canvas bind:this={canvas} aria-hidden="true"></canvas>

<style>
	canvas {
		display: block;
		width: 100%;
		height: 100%;
		touch-action: manipulation;
		cursor: crosshair;
	}
</style>
