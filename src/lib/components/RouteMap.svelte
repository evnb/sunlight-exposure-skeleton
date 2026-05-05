<script lang="ts">
	import { onMount } from 'svelte';
	import SunCalc from 'suncalc';

	interface Coords {
		lat: number;
		lng: number;
	}

	interface Props {
		origin: Coords | null;
		destination: Coords | null;
		originDatetime?: string;
		destinationDatetime?: string;
	}

	let { origin, destination, originDatetime, destinationDatetime }: Props = $props();

	let mapContainer: HTMLDivElement;
	let maplibregl: typeof import('maplibre-gl').default;
	let map: import('maplibre-gl').Map;
	let mapLoaded = $state(false);
	let originMarker: import('maplibre-gl').Marker | null = null;
	let destMarker: import('maplibre-gl').Marker | null = null;

	function loadArrowImage(): Promise<HTMLImageElement> {
		return new Promise((resolve) => {
			const img = new Image(32, 32);
			// Arrow pointing up (north) — rotated by icon-rotate at render time
			const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
				<polygon points="16,2 28,30 16,23 4,30" fill="#fbbf24" stroke="#92400e" stroke-width="1.5" stroke-linejoin="round"/>
			</svg>`;
			img.onload = () => resolve(img);
			img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
		});
	}

	onMount(async () => {
		maplibregl = (await import('maplibre-gl')).default;

		map = new maplibregl.Map({
			container: mapContainer,
			style: 'https://tiles.openfreemap.org/styles/liberty',
			center: [0, 20],
			zoom: 1,
			interactive: false
		});

		map.on('load', async () => {
			map.addImage('sun-arrow', await loadArrowImage());

			map.addSource('route', {
				type: 'geojson',
				data: buildGeoJSON()
			});
			map.addLayer({
				id: 'route-line',
				type: 'line',
				source: 'route',
				layout: { 'line-join': 'round', 'line-cap': 'round' },
				paint: { 'line-color': '#f59e0b', 'line-width': 3 }
			});

			map.addSource('sun-arrows', {
				type: 'geojson',
				data: { type: 'FeatureCollection', features: [] }
			});
			map.addLayer({
				id: 'sun-arrows-layer',
				type: 'symbol',
				source: 'sun-arrows',
				layout: {
					'icon-image': 'sun-arrow',
					'icon-rotate': ['get', 'direction'],
					'icon-rotation-alignment': 'map',
					'icon-anchor': 'top',
					'icon-allow-overlap': true,
					'icon-size': 1.2
				}
			});

			mapLoaded = true;
		});

		return () => map?.remove();
	});

	function buildGeoJSON(): GeoJSON.FeatureCollection {
		if (origin && destination) {
			return {
				type: 'FeatureCollection',
				features: [
					{
						type: 'Feature',
						properties: {},
						geometry: {
							type: 'LineString',
							coordinates: [
								[origin.lng, origin.lat],
								[destination.lng, destination.lat]
							]
						}
					}
				]
			};
		}
		return { type: 'FeatureCollection', features: [] };
	}

	const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

	const azimuth = $derived.by(() => {
		if (!origin || !destination) return null;
		const toRad = (d: number) => (d * Math.PI) / 180;
		const lat1 = toRad(origin.lat);
		const lat2 = toRad(destination.lat);
		const dLng = toRad(destination.lng - origin.lng);
		const y = Math.sin(dLng) * Math.cos(lat2);
		const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
		return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
	});

	const compassLabel = $derived(
		azimuth !== null ? COMPASS[Math.round(azimuth / 45) % 8] : null
	);

	function formatTime(datetime: string | undefined): string | null {
		if (!datetime) return null;
		const d = new Date(datetime);
		if (isNaN(d.getTime())) return null;
		const hrs = d.getHours();
		const m = d.getMinutes().toString().padStart(2, '0');
		return `${hrs % 12 || 12}:${m} ${hrs >= 12 ? 'PM' : 'AM'}`;
	}

	function bearingTo(fromLat: number, fromLng: number, toLat: number, toLng: number): number {
		const toRad = (d: number) => (d * Math.PI) / 180;
		const lat1 = toRad(fromLat), lat2 = toRad(toLat);
		const dLng = toRad(toLng - fromLng);
		const y = Math.sin(dLng) * Math.cos(lat2);
		const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
		return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
	}

	function sunSide(routeAz: number, sunAz: number, sunAlt: number): string {
		if (sunAlt <= 0) return 'Nighttime';
		if (sunAlt <= 5) return 'Minimal sun';
		const diff = (routeAz - sunAz + 360) % 360;
		return diff < 180 ? 'Sunlight from left window' : 'Sunlight from right window';
	}

	function sunPosition(coords: Coords, datetime: string | undefined) {
		if (!coords || !datetime) return null;
		const date = new Date(datetime);
		if (isNaN(date.getTime())) return null;
		const pos = SunCalc.getPosition(date, coords.lat, coords.lng);
		const az = ((pos.azimuth * 180) / Math.PI + 180 + 360) % 360;
		const alt = (pos.altitude * 180) / Math.PI;
		return { az, alt, compass: COMPASS[Math.round(az / 45) % 8] };
	}

	const originSun = $derived(origin ? sunPosition(origin, originDatetime) : null);
	const destinationSun = $derived(destination ? sunPosition(destination, destinationDatetime) : null);

	const originSide = $derived(
		originSun && azimuth !== null ? sunSide(azimuth, originSun.az, originSun.alt) : null
	);
	const destinationSide = $derived.by(() => {
		if (!destinationSun || !origin || !destination) return null;
		const finalBearing = (bearingTo(destination.lat, destination.lng, origin.lat, origin.lng) + 180) % 360;
		return sunSide(finalBearing, destinationSun.az, destinationSun.alt);
	});

	const intermediateSuns = $derived.by(() => {
		if (!origin || !destination || !originDatetime || !destinationDatetime) return [];
		const start = new Date(originDatetime);
		const end = new Date(destinationDatetime);
		if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return [];

		const STEP_MS = 30 * 60 * 1000;
		const totalMs = end.getTime() - start.getTime();
		const results: Array<{ timeStr: string; lat: number; lng: number; az: number; alt: number; compass: string; side: string }> = [];

		// Divide the total duration into n equal intervals so all gaps are the same size
		const n = Math.round(totalMs / STEP_MS);
		if (n < 2) return results;

		// Precompute great-circle values for slerp
		const toRad = (d: number) => (d * Math.PI) / 180;
		const toDeg = (r: number) => (r * 180) / Math.PI;
		const lat1 = toRad(origin.lat), lng1 = toRad(origin.lng);
		const lat2 = toRad(destination.lat), lng2 = toRad(destination.lng);
		const angDist = 2 * Math.asin(Math.sqrt(
			Math.sin((lat2 - lat1) / 2) ** 2 +
			Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2
		));

		for (let i = 1; i < n; i++) {
			const frac = i / n;
			const date = new Date(start.getTime() + frac * totalMs);

			// Spherical linear interpolation along the great circle
			let lat: number, lng: number;
			if (angDist < 1e-10) {
				lat = origin.lat;
				lng = origin.lng;
			} else {
				const a = Math.sin((1 - frac) * angDist) / Math.sin(angDist);
				const b = Math.sin(frac * angDist) / Math.sin(angDist);
				const x = a * Math.cos(lat1) * Math.cos(lng1) + b * Math.cos(lat2) * Math.cos(lng2);
				const y = a * Math.cos(lat1) * Math.sin(lng1) + b * Math.cos(lat2) * Math.sin(lng2);
				const z = a * Math.sin(lat1) + b * Math.sin(lat2);
				lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)));
				lng = toDeg(Math.atan2(y, x));
			}
			const pos = SunCalc.getPosition(date, lat, lng);
			const az = ((pos.azimuth * 180) / Math.PI + 180 + 360) % 360;
			const alt = (pos.altitude * 180) / Math.PI;
			const hrs = date.getHours();
			const m = date.getMinutes().toString().padStart(2, '0');
			const timeStr = `${hrs % 12 || 12}:${m} ${hrs >= 12 ? 'PM' : 'AM'}`;
			const localAz = bearingTo(lat, lng, destination.lat, destination.lng);
			results.push({ timeStr, lat, lng, az, alt, compass: COMPASS[Math.round(az / 45) % 8], side: sunSide(localAz, az, alt) });
		}

		return results;
	});

	$effect(() => {
		if (!mapLoaded) return;

		(map.getSource('route') as maplibregl.GeoJSONSource)?.setData(buildGeoJSON());

		originMarker?.remove();
		destMarker?.remove();

		if (origin) {
			originMarker = new maplibregl.Marker({ color: '#22c55e' })
				.setLngLat([origin.lng, origin.lat])
				.addTo(map);
		}
		if (destination) {
			destMarker = new maplibregl.Marker({ color: '#ef4444' })
				.setLngLat([destination.lng, destination.lat])
				.addTo(map);
		}

		// Sun direction arrows — light travels opposite to the sun's azimuth
		const sunFeatures: GeoJSON.Feature[] = [];
		if (originSun && origin) {
			sunFeatures.push({
				type: 'Feature',
				properties: { direction: (originSun.az + 180) % 360 },
				geometry: { type: 'Point', coordinates: [origin.lng, origin.lat] }
			});
		}
		for (const step of intermediateSuns) {
			sunFeatures.push({
				type: 'Feature',
				properties: { direction: (step.az + 180) % 360 },
				geometry: { type: 'Point', coordinates: [step.lng, step.lat] }
			});
		}
		if (destinationSun && destination) {
			sunFeatures.push({
				type: 'Feature',
				properties: { direction: (destinationSun.az + 180) % 360 },
				geometry: { type: 'Point', coordinates: [destination.lng, destination.lat] }
			});
		}
		(map.getSource('sun-arrows') as maplibregl.GeoJSONSource)?.setData({
			type: 'FeatureCollection',
			features: sunFeatures
		});

		if (origin && destination) {
			map.fitBounds(
				[
					[Math.min(origin.lng, destination.lng), Math.min(origin.lat, destination.lat)],
					[Math.max(origin.lng, destination.lng), Math.max(origin.lat, destination.lat)]
				],
				{ padding: 60, maxZoom: 12 }
			);
		} else if (origin) {
			map.flyTo({ center: [origin.lng, origin.lat], zoom: 8 });
		} else if (destination) {
			map.flyTo({ center: [destination.lng, destination.lat], zoom: 8 });
		}
	});
</script>

<div bind:this={mapContainer} class="h-64 w-full overflow-hidden rounded-container-token"></div>
{#if azimuth !== null}
	<p class="text-sm text-surface-400">
		Route azimuth: {azimuth.toFixed(1)}° {compassLabel}
	</p>
{/if}
{#if originSun}
	<p class="text-sm text-surface-400">
		Sun at departure ({formatTime(originDatetime)}, {origin?.lat.toFixed(3)}°, {origin?.lng.toFixed(3)}°) — azimuth: {originSun.az.toFixed(1)}° {originSun.compass}, altitude: {originSun.alt.toFixed(1)}° — {originSide}
	</p>
{/if}
{#if intermediateSuns.length > 0}
	<ul class="list-inside list-disc text-sm text-surface-400">
		{#each intermediateSuns as step}
			<li>{step.timeStr} ({step.lat.toFixed(3)}°, {step.lng.toFixed(3)}°) — azimuth: {step.az.toFixed(1)}° {step.compass}, altitude: {step.alt.toFixed(1)}° — {step.side}</li>
		{/each}
	</ul>
{/if}
{#if destinationSun}
	<p class="text-sm text-surface-400">
		Sun at arrival ({formatTime(destinationDatetime)}, {destination?.lat.toFixed(3)}°, {destination?.lng.toFixed(3)}°) — azimuth: {destinationSun.az.toFixed(1)}° {destinationSun.compass}, altitude: {destinationSun.alt.toFixed(1)}° — {destinationSide}
	</p>
{/if}
