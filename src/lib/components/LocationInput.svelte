<script lang="ts">
	import { LocateFixed, LoaderCircle, Search, X } from '@lucide/svelte';
	import { geocode as geocodeQuery, reverseGeocode, type Coords } from '$lib/geocode';
	import { toaster } from '$lib/toaster';

	interface Props {
		label: string;
		value: string;
		coords?: Coords | null;
		placeName?: string | null;
		datetime?: string;
		timeLabel?: string;
		placeholder?: string;
		onsearch?: () => void;
	}

	let {
		label,
		value = $bindable(),
		coords = $bindable(null),
		placeName = $bindable(null),
		datetime = $bindable(''),
		timeLabel = 'Time',
		placeholder = 'Enter a location...',
		onsearch
	}: Props = $props();

	const inputId = $derived(label.toLowerCase().replace(/\s+/g, '-') + '-location');
	const datetimeId = $derived(label.toLowerCase().replace(/\s+/g, '-') + '-datetime');

	let lastSuccessValue = $state('');
	let lastFailedValue = $state('');
	const isFailedValue = $derived(!!lastFailedValue && value.trim() === lastFailedValue);
	const searchDisabled = $derived(
		!value.trim() || value.trim() === lastSuccessValue || isFailedValue
	);

	$effect(() => {
		if (coords && !lastSuccessValue) {
			lastSuccessValue = value.trim();
		}
	});

	let geocoding = $state(false);

	async function geocode() {
		if (!value.trim()) return;
		geocoding = true;
		const result = await geocodeQuery(value);
		if (result) {
			coords = result.coords;
			placeName = result.placeName;
			lastSuccessValue = value.trim();
		} else {
			lastFailedValue = value.trim();
			toaster.error({ title: 'Location not found', description: `Could not find "${value.trim()}". Try a different location.` });
		}
		onsearch?.();
		geocoding = false;
	}

	let locating = $state(false);

	async function useCurrentLocation() {
		locating = true;
		navigator.geolocation.getCurrentPosition(
			async (pos) => {
				const lat = pos.coords.latitude;
				const lng = pos.coords.longitude;
				coords = { lat, lng };
				value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
				lastSuccessValue = value;
				placeName = await reverseGeocode(lat, lng);
				locating = false;
			},
			() => { locating = false; }
		);
	}
</script>

<div class="flex flex-col gap-1">
	<label for={inputId} class="label font-medium">{label}</label>
	<div class="input-group grid-cols-[1fr_auto_auto]">
		<input id={inputId} class="ig-input" type="text" bind:value {placeholder} onkeydown={(e) => e.key === 'Enter' && geocode()} />
		<button class="ig-btn {isFailedValue ? 'preset-filled-error-500' : 'preset-filled'}" title="Search location" aria-label="Search location" onclick={geocode} disabled={searchDisabled || geocoding}>
			{#if geocoding}
				<LoaderCircle size={16} class="animate-spin" />
			{:else if isFailedValue}
				<X size={16} />
			{:else}
				<Search size={16} />
			{/if}
		</button>
		<button class="ig-btn preset-tonal" title={locating ? 'Loading current location' : 'Use current location'} aria-label={locating ? 'Loading current location' : 'Use current location'} onclick={useCurrentLocation} disabled={locating}>
			{#if locating}
				<LoaderCircle size={16} class="animate-spin" />
			{:else}
				<LocateFixed size={16} />
			{/if}
		</button>
	</div>
	{#if coords}
		<p class="text-sm text-surface-400">
			{coords.lat.toFixed(5)}°, {coords.lng.toFixed(5)}°
			{#if placeName}&nbsp;·&nbsp;{placeName}{/if}
		</p>
	{/if}
	<label for={datetimeId} class="label font-medium">{timeLabel}</label>
	<input id={datetimeId} class="input" type="datetime-local" bind:value={datetime} />
</div>

<!--
	Skeleton's input-group draws its border via box-shadow using Tailwind v4's internal --tw-ring-shadow variable. Tailwind
	v4 only emits the reset for that variable when a ring-* utility is actually used somewhere in your project — since none are, the variable
	is undefined and the entire box-shadow declaration is silently invalid.

	The fix: add a scoped style in the component that sets outline directly. Svelte's scoped selector (.input-group[svelte-xxxx]) wins over the
	utility class, so it overrides input-group's outline-color: transparent.
-->
<style>
	.input-group,
	.input {
		outline: 1px solid var(--color-surface-200-800);
	}
</style>
