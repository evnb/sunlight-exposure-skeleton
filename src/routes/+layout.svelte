<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import './+layout.css';
	import { SiGithub, SiBluesky } from '@icons-pack/svelte-simple-icons';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<main class="mx-auto max-w-4xl px-4 py-8">
	{@render children()}
</main>

<footer class="mx-auto max-w-4xl px-4 py-6 text-sm text-surface-400 border-t border-surface-200-800 mt-4">
	<div class="flex items-center justify-between mb-3">
		<p class="font-medium">Attributions</p>
		<div class="flex gap-3">
			<a class="anchor" href="https://github.com/evnb/sunlight-exposure-skeleton" target="_blank" rel="noopener" title="GitHub"><SiGithub size={18} /></a>
			<a class="anchor" href="https://bsky.app/profile/evan.click" target="_blank" rel="noopener" title="Bluesky"><SiBluesky size={18} /></a>
		</div>
	</div>
	<ul class="flex flex-col gap-1">
		<li>Geocoding by <a class="anchor" href="https://nominatim.org" target="_blank" rel="noopener">Nominatim</a> · © <a class="anchor" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors</li>
		<li>Map tiles by <a class="anchor" href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a></li>
		<li>Map rendering by <a class="anchor" href="https://maplibre.org" target="_blank" rel="noopener">MapLibre GL</a></li>
		<li>Sun position calculations by <a class="anchor" href="https://github.com/mourner/suncalc" target="_blank" rel="noopener">SunCalc</a></li>
	</ul>
</footer>
