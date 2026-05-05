<script lang="ts">
	import { onMount } from 'svelte';
	import type { Coords, SunPoint } from '$lib/sunCalc';

	interface Props {
		origin: Coords | null;
		destination: Coords | null;
		sunPoints?: SunPoint[];
	}

	let { origin, destination, sunPoints = [] }: Props = $props();

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

		(map.getSource('sun-arrows') as maplibregl.GeoJSONSource)?.setData({
			type: 'FeatureCollection',
			features: sunPoints.map((pt) => ({
				type: 'Feature',
				properties: { direction: (pt.az + 180) % 360 },
				geometry: { type: 'Point', coordinates: [pt.lng, pt.lat] }
			}))
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
