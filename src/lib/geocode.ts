export interface Coords {
	lat: number;
	lng: number;
}

export interface GeocodeResult {
	coords: Coords;
	placeName: string | null;
}

function extractPlaceName(address: Record<string, string>): string | null {
	return address.city ?? address.town ?? address.village ?? address.county ?? null;
}

export async function geocode(query: string): Promise<GeocodeResult | null> {
	if (!query.trim()) return null;
	const res = await fetch(
		`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`
	);
	const data = await res.json();
	if (data.length === 0) return null;
	const r = data[0];
	return {
		coords: { lat: parseFloat(r.lat), lng: parseFloat(r.lon) },
		placeName: extractPlaceName(r.address)
	};
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
	const res = await fetch(
		`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
	);
	const data = await res.json();
	return extractPlaceName(data.address ?? {});
}
