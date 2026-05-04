<script lang="ts">
	import { LocateFixed } from '@lucide/svelte';

	interface Props {
		label: string;
		value: string;
		placeholder?: string;
	}

	let { label, value = $bindable(), placeholder = 'Enter a location...' }: Props = $props();

	function useCurrentLocation() {
		navigator.geolocation.getCurrentPosition((pos) => {
			value = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
		});
	}
</script>

<div class="flex flex-col gap-1">
	<label class="label font-medium">{label}</label>
	<div class="input-group grid-cols-[1fr_auto]">
		<input class="ig-input" type="text" bind:value {placeholder} />
		<button class="ig-btn preset-filled" title="Use current location" onclick={useCurrentLocation}>
			<LocateFixed size={16} />
		</button>
	</div>
</div>
