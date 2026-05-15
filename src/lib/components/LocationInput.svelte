<script lang="ts">
	import { LocateFixed, LoaderCircle, Search } from '@lucide/svelte';

	interface Coords {
		lat: number;
		lng: number;
	}

	interface Props {
		label: string;
		value: string;
		coords?: Coords | null;
		placeName?: string | null;
		datetime?: string;
		timeLabel?: string;
		placeholder?: string;
	}

	let {
		label,
		value = $bindable(),
		coords = $bindable(null),
		placeName = $bindable(null),
		datetime = $bindable(''),
		timeLabel = 'Time',
		placeholder = 'Enter a location...'
	}: Props = $props();

	const inputId = $derived(label.toLowerCase().replace(/\s+/g, '-') + '-location');
	const datetimeId = $derived(label.toLowerCase().replace(/\s+/g, '-') + '-datetime');

	async function geocode() {
		if (!value.trim()) return;
		const res = await fetch(
			`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=1&addressdetails=1`
		);
		const data = await res.json();
		if (data.length > 0) {
			const r = data[0];
			coords = { lat: parseFloat(r.lat), lng: parseFloat(r.lon) };
			placeName =
				r.address.city ?? r.address.town ?? r.address.village ?? r.address.county ?? null;
		}
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

				const res = await fetch(
					`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
				);
				const data = await res.json();
				placeName =
					data.address?.city ?? data.address?.town ?? data.address?.village ?? data.address?.county ?? null;
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
		<button class="ig-btn preset-filled" title="Search location" aria-label="Search location" onclick={geocode}>
			<Search size={16} />
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
