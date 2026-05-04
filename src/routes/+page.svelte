<script lang="ts">
	import LocationInput from '$lib/components/LocationInput.svelte';
	import RouteMap from '$lib/components/RouteMap.svelte';

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
</script>

<div class="flex flex-col gap-6">
	<div>
		<h1 class="h1">Sun Exposure Calculator 🌞</h1>
		<h4 class="h4">Calculate sun exposure on a trip, and see which side of the bus / train you should sit on ➡️🚇⬅️</h4>
	</div>

	<div class="flex flex-col gap-4">
		<LocationInput label="Origin" bind:value={origin} bind:coords={originCoords} bind:placeName={originPlace} bind:datetime={originDatetime} timeLabel="Departure Time" placeholder="Enter origin city / zip / address" />
		<LocationInput label="Destination" bind:value={destination} bind:coords={destinationCoords} bind:placeName={destinationPlace} bind:datetime={destinationDatetime} timeLabel="Arrival Time" placeholder="Enter destination city / zip / address" />
	</div>

	<RouteMap origin={originCoords} destination={destinationCoords} originDatetime={originDatetime} destinationDatetime={destinationDatetime} />
</div>
