export type LatLngLit = { lat: number; lng: number };

export type OsrmRoute = {
  index: number;
  summary: string;
  distanceKm: number;
  durationMin: number;
  path: LatLngLit[];
};

/**
 * Fetch real road geometry (with alternatives) from the public OSRM demo server.
 * Returns [] when the network call fails or no route exists.
 */
export async function fetchOsrmRoutes(
  origin: LatLngLit,
  destination: LatLngLit,
  signal?: AbortSignal,
  waypoints: LatLngLit[] = [],
): Promise<OsrmRoute[]> {
  const points = [origin, ...waypoints, destination];
  const hasStops = waypoints.length > 0;
  const coords = points.map((p) => `${p.lng},${p.lat}`).join(";");
  const url =
    `https://router.project-osrm.org/route/v1/driving/${coords}` +
    `?overview=full&geometries=geojson&alternatives=${hasStops ? "false" : "true"}` +
    // Let OSRM re-order the intermediate drop-offs into the most efficient sequence.
    (hasStops ? "&source=first&destination=last&roundtrip=false" : "");

  const res = await fetch(url, { signal: signal ?? null });
  if (!res.ok) throw new Error(`OSRM request failed (${res.status})`);
  const json = (await res.json()) as {
    code?: string;
    routes?: {
      distance: number;
      duration: number;
      geometry?: { coordinates?: [number, number][] };
    }[];
  };
  if (json.code !== "Ok" || !json.routes?.length) return [];

  return json.routes.slice(0, 2).map((r, i) => ({
    index: i,
    summary: hasStops
      ? `Multi-stop corridor · ${waypoints.length} drop-off${waypoints.length > 1 ? "s" : ""}`
      : i === 0
        ? "Fastest highway corridor"
        : "Highway bypass corridor",
    distanceKm: r.distance / 1000,
    durationMin: r.duration / 60,
    path: (r.geometry?.coordinates ?? []).map(([lng, lat]) => ({ lat, lng })),
  }));
}

/** Interpolated position at fraction t (0..1) along a polyline. */
export function pointAlongPath(path: LatLngLit[], t: number): LatLngLit | null {
  if (!path.length) return null;
  if (path.length === 1) return path[0]!;
  const clamped = Math.min(Math.max(t, 0), 1);
  const idx = Math.min(Math.floor(clamped * (path.length - 1)), path.length - 2);
  const a = path[idx]!;
  const b = path[idx + 1]!;
  const local = clamped * (path.length - 1) - idx;
  return { lat: a.lat + (b.lat - a.lat) * local, lng: a.lng + (b.lng - a.lng) * local };
}

export function boundsOf(path: LatLngLit[]) {
  const b = new google.maps.LatLngBounds();
  path.forEach((p) => b.extend(p));
  return b;
}

/** Simple SVG truck marker usable as a Google Maps icon url. */
export function truckIcon(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#ffffff" stroke="${color}" stroke-width="2"/><g transform="translate(3.2,4.6) scale(0.72)" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></g></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
