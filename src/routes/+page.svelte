<script lang="ts">
	import { onMount } from 'svelte';
	import LocationInput from '$lib/components/LocationInput.svelte';
	import RouteMap from '$lib/components/RouteMap.svelte';
	import RouteInfo from '$lib/components/RouteInfo.svelte';
	import faviconRaw from '$lib/assets/favicon.svg?raw';
	import {
		COMPASS,
		bearingTo,
		sunSide,
		sunPosition,
		routeAzimuth,
		calcIntermediateSuns
	} from '$lib/sunCalc';
	import { CircleQuestionMark } from '@lucide/svelte';
	import { Popover, Portal } from '@skeletonlabs/skeleton-svelte';

	const faviconSvg = faviconRaw
		.replace(/<\?xml[^?]*\?>\s*/g, '')
		.replace(/<!DOCTYPE[^>]*>\s*/g, '')
		.trim();

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

	const sideRecommendation = $derived.by(() => {
		const sides = [originSide, ...intermediateSuns.map((s) => s.side), destinationSide].filter(
			Boolean
		) as string[];
		if (sides.length === 0) return null;
		const left = sides.filter((s) => s === 'Sunlight from left window').length;
		const right = sides.filter((s) => s === 'Sunlight from right window').length;
		if (left === 0 && right === 0) return 'nighttime';
		if (left === right) return 'both';
		return left > right ? 'left' : 'right';
	});

	const sunPoints = $derived([
		...(originSun && originCoords
			? [{ lat: originCoords.lat, lng: originCoords.lng, az: originSun.az }]
			: []),
		...intermediateSuns.map((s) => ({ lat: s.lat, lng: s.lng, az: s.az })),
		...(destinationSun && destinationCoords
			? [{ lat: destinationCoords.lat, lng: destinationCoords.lng, az: destinationSun.az }]
			: [])
	]);

	const siteUrl = 'https://evnb.github.io/sunlight-exposure-skeleton';
	const ogImage = `${siteUrl}/og-image.png`;

	async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
		const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
		const data = await res.json();
		return data.address?.city ?? data.address?.town ?? data.address?.village ?? data.address?.county ?? null;
	}

	onMount(() => {
		const p = new URLSearchParams(window.location.search);
		const olat = p.get('olat'), olng = p.get('olng');
		if (olat && olng) {
			const lat = parseFloat(olat), lng = parseFloat(olng);
			originCoords = { lat, lng };
			origin = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
			reverseGeocode(lat, lng).then(name => { originPlace = name; });
		}
		const dlat = p.get('dlat'), dlng = p.get('dlng');
		if (dlat && dlng) {
			const lat = parseFloat(dlat), lng = parseFloat(dlng);
			destinationCoords = { lat, lng };
			destination = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
			reverseGeocode(lat, lng).then(name => { destinationPlace = name; });
		}
	});

	$effect(() => {
		const p = new URLSearchParams();
		if (originCoords) {
			p.set('olat', originCoords.lat.toFixed(6));
			p.set('olng', originCoords.lng.toFixed(6));
		}
		if (destinationCoords) {
			p.set('dlat', destinationCoords.lat.toFixed(6));
			p.set('dlng', destinationCoords.lng.toFixed(6));
		}
		const qs = p.toString();
		history.replaceState({}, '', qs ? `?${qs}` : window.location.pathname);
	});

	let recommendationEl = $state<HTMLElement | null>(null);
	let prevRecommendation: string | null = null;

	$effect(() => {
		if (sideRecommendation !== null && prevRecommendation === null && recommendationEl) {
			recommendationEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
		prevRecommendation = sideRecommendation;
	});
</script>

<svelte:head>
	<title>Sun Exposure Calculator</title>
	<meta name="description" content="Find out which side of the bus or train to sit on to avoid the sun." />
	<meta property="og:title" content="Sun Exposure Calculator" />
	<meta property="og:description" content="Find out which side of the bus or train to sit on to avoid the sun." />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={siteUrl} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Sun Exposure Calculator" />
	<meta name="twitter:description" content="Find out which side of the bus or train to sit on to avoid the sun." />
	<meta name="twitter:image" content={ogImage} />
</svelte:head>

<div class="flex flex-col gap-6">
	<div>
		<h1 class="h1">Sun Exposure Calculator 🌞 <span class="inline-block h-[1.4em] w-[1.4em] align-middle">{@html faviconSvg}</span></h1>
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

	{#if sideRecommendation !== null}
		<div bind:this={recommendationEl} class="flex items-center gap-3">
			{#if sideRecommendation === 'left'}
				<h2 class="h2">🌞➡️🚇 Sun coming through left window. Sit on the right side for standard seating</h2>
			{:else if sideRecommendation === 'right'}
				<h2 class="h2">🚇⬅️🌞 Sun coming through right window. Sit on the left side for standard seating</h2>
			{:else if sideRecommendation === 'both'}
				<h2 class="h2">🌞 Sun coming from both sides. Sit on either side</h2>
			{:else if sideRecommendation === 'nighttime'}
				<h2 class="h2">🌚 Nighttime. Sit on either side</h2>
			{/if}
			{#if sideRecommendation === 'left' || sideRecommendation === 'right'}
				<Popover>
					<Popover.Trigger class="btn-icon preset-tonal shrink-0" aria-label="More info">
						<CircleQuestionMark size={20} />
					</Popover.Trigger>
					<Portal>
						<Popover.Positioner class="z-20!">
							<Popover.Content class="card p-4 text-sm max-w-xs bg-surface-100-900 shadow-xl">
								For forward-facing seats, sit on the {#if sideRecommendation === 'left'} right {:else if sideRecommendation === 'right'} left {/if} side. For aisle-facing seats, sit on the {#if sideRecommendation === 'left'} left {:else if sideRecommendation === 'right'} right {/if} side.
								<Popover.Arrow class="[--arrow-size:--spacing(2)] [--arrow-background:var(--color-surface-100-900)]">
									<Popover.ArrowTip />
								</Popover.Arrow>
							</Popover.Content>
						</Popover.Positioner>
					</Portal>
				</Popover>
			{/if}
		</div>
	{/if}
</div>
