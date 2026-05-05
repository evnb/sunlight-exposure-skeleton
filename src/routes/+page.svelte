<script lang="ts">
	import LocationInput from '$lib/components/LocationInput.svelte';
	import RouteMap from '$lib/components/RouteMap.svelte';
	import RouteInfo from '$lib/components/RouteInfo.svelte';
	import {
		COMPASS,
		bearingTo,
		sunSide,
		sunPosition,
		routeAzimuth,
		calcIntermediateSuns
	} from '$lib/sunCalc';

	function nowLocal() {
		const d = new Date();
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
	}

	let origin = $state('');
	let originCoords = $state<{ lat: number; lng: number } | null>(null);
	let originPlace = $state<string | null>(null);
	let originDatetime = $state(nowLocal());
	let destination = $state('');
	let destinationCoords = $state<{ lat: number; lng: number } | null>(null);
	let destinationPlace = $state<string | null>(null);
	let destinationDatetime = $state(nowLocal());

	const azimuth = $derived(
		originCoords && destinationCoords ? routeAzimuth(originCoords, destinationCoords) : null
	);
	const compassLabel = $derived(
		azimuth !== null ? COMPASS[Math.round(azimuth / 45) % 8] : null
	);

	const originSun = $derived(originCoords ? sunPosition(originCoords, originDatetime) : null);
	const destinationSun = $derived(
		destinationCoords ? sunPosition(destinationCoords, destinationDatetime) : null
	);

	const originSide = $derived(
		originSun && azimuth !== null ? sunSide(azimuth, originSun.az, originSun.alt) : null
	);
	const destinationSide = $derived.by(() => {
		if (!destinationSun || !originCoords || !destinationCoords) return null;
		const finalBearing =
			(bearingTo(destinationCoords.lat, destinationCoords.lng, originCoords.lat, originCoords.lng) +
				180) %
			360;
		return sunSide(finalBearing, destinationSun.az, destinationSun.alt);
	});

	const intermediateSuns = $derived(
		originCoords && destinationCoords && originDatetime && destinationDatetime
			? calcIntermediateSuns(originCoords, destinationCoords, originDatetime, destinationDatetime)
			: []
	);

	const sunPoints = $derived([
		...(originSun && originCoords
			? [{ lat: originCoords.lat, lng: originCoords.lng, az: originSun.az }]
			: []),
		...intermediateSuns.map((s) => ({ lat: s.lat, lng: s.lng, az: s.az })),
		...(destinationSun && destinationCoords
			? [{ lat: destinationCoords.lat, lng: destinationCoords.lng, az: destinationSun.az }]
			: [])
	]);
</script>

<div class="flex flex-col gap-6">
	<div>
		<h1 class="h1">Sun Exposure Calculator 🌞</h1>
		<h4 class="h4">Calculate sun exposure on a trip, and see which side of the bus / train you should sit on to avoid the sun ➡️⁠🚇⁠⬅️</h4>
	</div>

	<div class="flex flex-col gap-6 md:flex-row md:items-center">
		<div class="flex flex-col gap-4 md:flex-1">
			<LocationInput label="Origin" bind:value={origin} bind:coords={originCoords} bind:placeName={originPlace} bind:datetime={originDatetime} timeLabel="Departure Time" placeholder="Enter origin city / zip / address" />
			<LocationInput label="Destination" bind:value={destination} bind:coords={destinationCoords} bind:placeName={destinationPlace} bind:datetime={destinationDatetime} timeLabel="Arrival Time" placeholder="Enter destination city / zip / address" />
		</div>
		<div class="min-w-0 flex-1 md:max-w-sm">
			<RouteMap origin={originCoords} destination={destinationCoords} {sunPoints} />
		</div>
	</div>

	<RouteInfo
		{azimuth}
		{compassLabel}
		{originSun}
		{originSide}
		{originDatetime}
		originCoords={originCoords}
		{destinationSun}
		{destinationSide}
		{destinationDatetime}
		destinationCoords={destinationCoords}
		{intermediateSuns}
	/>
</div>
