export type Coord = [number, number];

export type Point = { lat: number; lng: number };

const R = 6371;

export function haversine(a: Point, b: Point) {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function pathLength(path: Coord[]) {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!;
    const b = path[i]!;
    total += haversine({ lat: a[0], lng: a[1] }, { lat: b[0], lng: b[1] });
  }
  return total;
}

/**
 * High-density synthetic highway geometry: a quadratic bend plus small
 * sinusoidal deviations so the line reads like a real NH corridor rather
 * than a straight point-to-point chord. Used as an offline fallback when
 * the OSRM road network is unreachable.
 */
export function curvedRoute(a: Point, b: Point, bend = 0.1, steps = 72): Coord[] {
  const mx = (a.lat + b.lat) / 2;
  const my = (a.lng + b.lng) / 2;
  const dx = b.lat - a.lat;
  const dy = b.lng - a.lng;
  const cx = mx - dy * bend;
  const cy = my + dx * bend;

  const out: Coord[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const one = (1 - t) ** 2;
    const two = 2 * (1 - t) * t;
    const three = t ** 2;
    const wobble = Math.sin(t * Math.PI * 6) * 0.012 * (1 - Math.abs(0.5 - t) * 1.4);
    out.push([
      one * a.lat + two * cx + three * b.lat + wobble,
      one * a.lng + two * cy + three * b.lng - wobble * 0.7,
    ]);
  }
  return out;
}

export function multiLegRoute(points: Point[], bend = 0.1): Coord[] {
  const out: Coord[] = [];
  for (let i = 1; i < points.length; i++) {
    const leg = curvedRoute(points[i - 1]!, points[i]!, bend);
    out.push(...(i === 1 ? leg : leg.slice(1)));
  }
  return out;
}

/** Snap a set of waypoints to the real OSM road network via OSRM. */
export async function fetchRoadRoute(points: Point[]): Promise<Coord[] | null> {
  try {
    const coords = points.map((p) => `${p.lng},${p.lat}`).join(";");
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      routes?: { geometry?: { coordinates?: [number, number][] } }[];
    };
    const line = json.routes?.[0]?.geometry?.coordinates;
    if (!line?.length) return null;
    return line.map(([lng, lat]) => [lat, lng] as Coord);
  } catch {
    return null;
  }
}

/** Interpolated position at fraction t (0..1) along a polyline. */
export function pointAlong(path: Coord[], t: number): Coord {
  if (path.length < 2) return path[0] ?? ([0, 0] as Coord);
  const clamped = Math.min(Math.max(t, 0), 1);
  const target = pathLength(path) * clamped;
  let acc = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!;
    const b = path[i]!;
    const seg = haversine({ lat: a[0], lng: a[1] }, { lat: b[0], lng: b[1] });
    if (acc + seg >= target) {
      const f = seg === 0 ? 0 : (target - acc) / seg;
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    }
    acc += seg;
  }
  return path[path.length - 1]!;
}

/** Nearest-neighbour tour + 2-opt refinement for the multi-stop optimizer. */
export function optimizeStops<T extends Point>(start: T, stops: T[], end: T) {
  const remaining = [...stops];
  const order: T[] = [];
  let current: Point = start;
  while (remaining.length) {
    let best = 0;
    let bestD = Infinity;
    remaining.forEach((s: T, i: number) => {
      const d = haversine(current, s);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    current = remaining[best]!;
    order.push(remaining.splice(best, 1)[0]!);
  }

  const tourLength = (list: T[]) => {
    const full = [start, ...list, end];
    let total = 0;
    for (let i = 1; i < full.length; i++) total += haversine(full[i - 1]!, full[i]!);
    return total;
  };

  let improved = true;
  let bestOrder = order;
  while (improved) {
    improved = false;
    for (let i = 0; i < bestOrder.length - 1; i++) {
      for (let j = i + 1; j < bestOrder.length; j++) {
        const candidate = [...bestOrder];
        const slice = candidate.slice(i, j + 1).reverse();
        candidate.splice(i, slice.length, ...slice);
        if (tourLength(candidate) < tourLength(bestOrder) - 0.001) {
          bestOrder = candidate;
          improved = true;
        }
      }
    }
  }

  return {
    order: bestOrder,
    naiveKm: tourLength(order === bestOrder ? order : order),
    optimizedKm: tourLength(bestOrder),
  };
}

/** Reference geo for the dispatch corridor planner. */
export const cityCoords: Record<string, Point> = {
  jaipur: { lat: 26.9124, lng: 75.7873 },
  delhi: { lat: 28.6139, lng: 77.209 },
  "new delhi": { lat: 28.6139, lng: 77.209 },
  neemrana: { lat: 27.9846, lng: 76.3846 },
  behror: { lat: 27.8892, lng: 76.2827 },
  gurgaon: { lat: 28.4595, lng: 77.0266 },
  gurugram: { lat: 28.4595, lng: 77.0266 },
  manesar: { lat: 28.354, lng: 76.938 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  pune: { lat: 18.5204, lng: 73.8567 },
  nashik: { lat: 19.9975, lng: 73.7898 },
  surat: { lat: 21.1702, lng: 72.8311 },
  vadodara: { lat: 22.3072, lng: 73.1812 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  udaipur: { lat: 24.5854, lng: 73.7125 },
  indore: { lat: 22.7196, lng: 75.8577 },
  bhopal: { lat: 23.2599, lng: 77.4126 },
  nagpur: { lat: 21.1458, lng: 79.0882 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  mysuru: { lat: 12.2958, lng: 76.6394 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
  kanpur: { lat: 26.4499, lng: 80.3319 },
  agra: { lat: 27.1767, lng: 78.0081 },
  noida: { lat: 28.5355, lng: 77.391 },
  ludhiana: { lat: 30.901, lng: 75.8573 },
  chandigarh: { lat: 30.7333, lng: 76.7794 },
};

export function resolveCity(name: string): Point | null {
  const key = name.trim().toLowerCase();
  if (!key) return null;
  const exact = cityCoords[key];
  if (exact) return exact;
  const partial = Object.keys(cityCoords).find(
    (c) => c.startsWith(key) || key.startsWith(c),
  );
  return partial ? cityCoords[partial]! : null;
}
