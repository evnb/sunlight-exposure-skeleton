<script lang="ts">
	import { onMount } from 'svelte';

	interface Coords {
		lat: number;
		lng: number;
	}

	interface Props {
		origin: Coords | null;
		destination: Coords | null;
	}

	let { origin, destination }: Props = $props();

	let mapContainer: HTMLDivElement;
	let maplibregl: typeof import('maplibre-gl').default;
	let map: import('maplibre-gl').Map;
	let mapLoaded = $state(false);
	let originMarker: import('maplibre-gl').Marker | null = null;
	let destMarker: import('maplibre-gl').Marker | null = null;

	onMount(async () => {
		maplibregl = (await import('maplibre-gl')).default;

		map = new maplibregl.Map({
			container: mapContainer,
			style: 'https://tiles.openfreemap.org/styles/liberty',
			center: [0, 20],
			zoom: 1
		});

		map.on('load', () => {
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
