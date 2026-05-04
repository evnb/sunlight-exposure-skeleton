<script lang="ts">
	import { LocateFixed, MapPin } from '@lucide/svelte';

	interface Coords {
		lat: number;
		lng: number;
	}

	interface Props {
		label: string;
		value: string;
		coords?: Coords | null;
		placeholder?: string;
	}

	let { label, value = $bindable(), coords = $bindable(null), placeholder = 'Enter a location...' }: Props = $props();

	async function geocode() {
		if (!value.trim()) return;
		const res = await fetch(
			`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=1`
		);
		const data = await res.json();
		if (data.length > 0) {
			coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
		}
	}

	function useCurrentLocation() {
		navigator.geolocation.getCurrentPosition((pos) => {
			coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
			value = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
		});
	}
</script>

<div class="flex flex-col gap-1">
	<label class="label font-medium">{label}</label>
	<div class="input-group grid-cols-[1fr_auto_auto]">
		<input class="ig-input" type="text" bind:value {placeholder} />
		<button class="ig-btn preset-tonal" title="Geocode location" onclick={geocode}>
			<MapPin size={16} />
		</button>
		<button class="ig-btn preset-filled" title="Use current location" onclick={useCurrentLocation}>
			<LocateFixed size={16} />
		</button>
	</div>
</div>

<!--
	Skeleton's input-group draws its border via box-shadow using Tailwind v4's internal --tw-ring-shadow variable. Tailwind
	v4 only emits the reset for that variable when a ring-* utility is actually used somewhere in your project — since none are, the variable
	is undefined and the entire box-shadow declaration is silently invalid.

	The fix: add a scoped style in the component that sets outline directly. Svelte's scoped selector (.input-group[svelte-xxxx]) wins over the
	utility class, so it overrides input-group's outline-color: transparent.
-->
<style>
	.input-group {
		outline: 1px solid var(--color-surface-200-800);
	}
</style>
