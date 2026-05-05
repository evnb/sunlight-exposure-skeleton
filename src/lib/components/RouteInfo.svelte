<script lang="ts">
	import { formatTime } from '$lib/sunCalc';
	import type { Coords, SunPositionResult, IntermediateSun } from '$lib/sunCalc';

	interface Props {
		azimuth: number | null;
		compassLabel: string | null;
		originSun: SunPositionResult | null;
		originSide: string | null;
		originDatetime: string;
		originCoords: Coords | null;
		destinationSun: SunPositionResult | null;
		destinationSide: string | null;
		destinationDatetime: string;
		destinationCoords: Coords | null;
		intermediateSuns: IntermediateSun[];
	}

	let {
		azimuth,
		compassLabel,
		originSun,
		originSide,
		originDatetime,
		originCoords,
		destinationSun,
		destinationSide,
		destinationDatetime,
		destinationCoords,
		intermediateSuns
	}: Props = $props();
</script>

{#if azimuth !== null}
	<p class="text-sm text-surface-400">
		Route azimuth: {azimuth.toFixed(1)}° {compassLabel}
	</p>
{/if}
{#if originSun && originCoords}
	<p class="text-sm text-surface-400">
		Sun at departure ({formatTime(originDatetime)}, {originCoords.lat.toFixed(3)}°, {originCoords.lng.toFixed(3)}°) — azimuth: {originSun.az.toFixed(1)}° {originSun.compass}, altitude: {originSun.alt.toFixed(1)}° — {originSide}
	</p>
{/if}
{#if intermediateSuns.length > 0}
	<ul class="list-inside list-disc text-sm text-surface-400">
		{#each intermediateSuns as step}
			<li>{step.timeStr} ({step.lat.toFixed(3)}°, {step.lng.toFixed(3)}°) — azimuth: {step.az.toFixed(1)}° {step.compass}, altitude: {step.alt.toFixed(1)}° — {step.side}</li>
		{/each}
	</ul>
{/if}
{#if destinationSun && destinationCoords}
	<p class="text-sm text-surface-400">
		Sun at arrival ({formatTime(destinationDatetime)}, {destinationCoords.lat.toFixed(3)}°, {destinationCoords.lng.toFixed(3)}°) — azimuth: {destinationSun.az.toFixed(1)}° {destinationSun.compass}, altitude: {destinationSun.alt.toFixed(1)}° — {destinationSide}
	</p>
{/if}
