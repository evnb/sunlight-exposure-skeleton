import SunCalc from 'suncalc';

export interface Coords {
	lat: number;
	lng: number;
}

export interface SunPositionResult {
	az: number;
	alt: number;
	compass: string;
}

export interface IntermediateSun {
	timeStr: string;
	lat: number;
	lng: number;
	az: number;
	alt: number;
	compass: string;
	side: string;
}

export interface SunPoint {
	lat: number;
	lng: number;
	az: number;
}

export const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export function formatTime(datetime: string | undefined): string | null {
	if (!datetime) return null;
	const d = new Date(datetime);
	if (isNaN(d.getTime())) return null;
	const hrs = d.getHours();
	const m = d.getMinutes().toString().padStart(2, '0');
	return `${hrs % 12 || 12}:${m} ${hrs >= 12 ? 'PM' : 'AM'}`;
}

export function bearingTo(fromLat: number, fromLng: number, toLat: number, toLng: number): number {
	const toRad = (d: number) => (d * Math.PI) / 180;
	const lat1 = toRad(fromLat), lat2 = toRad(toLat);
	const dLng = toRad(toLng - fromLng);
	const y = Math.sin(dLng) * Math.cos(lat2);
	const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
	return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function sunSide(routeAz: number, sunAz: number, sunAlt: number): string {
	if (sunAlt <= 0) return 'Nighttime';
	if (sunAlt <= 5) return 'Minimal sun';
	const diff = (routeAz - sunAz + 360) % 360;
	return diff < 180 ? 'Sunlight from left window' : 'Sunlight from right window';
}

export function sunPosition(coords: Coords, datetime: string | undefined): SunPositionResult | null {
	if (!datetime) return null;
	const date = new Date(datetime);
	if (isNaN(date.getTime())) return null;
	const pos = SunCalc.getPosition(date, coords.lat, coords.lng);
	const az = ((pos.azimuth * 180) / Math.PI + 180 + 360) % 360;
	const alt = (pos.altitude * 180) / Math.PI;
	return { az, alt, compass: COMPASS[Math.round(az / 45) % 8] };
}

export function routeAzimuth(origin: Coords, destination: Coords): number {
	const toRad = (d: number) => (d * Math.PI) / 180;
	const lat1 = toRad(origin.lat);
	const lat2 = toRad(destination.lat);
	const dLng = toRad(destination.lng - origin.lng);
	const y = Math.sin(dLng) * Math.cos(lat2);
	const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
	return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function calcIntermediateSuns(
	origin: Coords,
	destination: Coords,
	originDatetime: string,
	destinationDatetime: string
): IntermediateSun[] {
	const start = new Date(originDatetime);
	const end = new Date(destinationDatetime);
	if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return [];

	const STEP_MS = 30 * 60 * 1000;
	const totalMs = end.getTime() - start.getTime();
	const results: IntermediateSun[] = [];

	const n = Math.round(totalMs / STEP_MS);
	if (n < 2) return results;

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
}
