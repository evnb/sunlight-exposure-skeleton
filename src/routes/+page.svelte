<script lang="ts">
	import LocationInput from '$lib/components/LocationInput.svelte';

	let origin = $state('');
	let destination = $state('');
</script>

<div class="flex flex-col gap-6">
	<div>
		<h1 class="h1">Sun Exposure Calculator 🌞</h1>
		<h4 class="h4">Calculate sun exposure on a trip, and see which side of the bus / train you should sit on ➡️🚇⬅️</h4>
	</div>

	<div class="flex flex-col gap-4">
		<LocationInput label="Origin" bind:value={origin} placeholder="Enter origin city / zip / address" />
		<LocationInput label="Destination" bind:value={destination} placeholder="Enter destination city / zip / address" />
	</div>
</div>
