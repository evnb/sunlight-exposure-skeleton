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
