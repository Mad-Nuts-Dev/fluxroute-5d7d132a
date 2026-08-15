import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";

import {
  fetchRoadRoute,
  multiLegRoute,
  pointAlong,
  type Coord,
  type Point,
} from "@/data/corridors";

export type RouteStop = Point & { label: string };

function stopIcon(label: string, index: number) {
  return L.divIcon({
    className: "",
    html: `<div class="fleet-marker fleet-marker-electric">${index}</div><div class="fleet-stop-label">${label}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function truckIcon(angle: number) {
  return L.divIcon({
    className: "",
    html: `<div class="fleet-truck" style="transform: rotate(${angle}deg)">🚚</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function FitBounds({ path }: { path: Coord[] }) {
  const map = useMap();
  useEffect(() => {
    if (path.length < 2) return;
    map.fitBounds(L.latLngBounds(path), { padding: [30, 30] });
  }, [path, map]);
  return null;
}

export default function RouteMapClient({ stops }: { stops: RouteStop[] }) {
  const [ecoPath, setEcoPath] = useState<Coord[]>([]);
  const [congestedPath, setCongestedPath] = useState<Coord[]>([]);
  const [t, setT] = useState(0);
  const raf = useRef<number | null>(null);

  const fallback = useMemo(
    () => (stops.length > 1 ? multiLegRoute(stops, 0.05) : []),
    [stops],
  );

  useEffect(() => {
    if (stops.length < 2) {
      setEcoPath([]);
      setCongestedPath([]);
      return;
    }
    let cancelled = false;
    setEcoPath(fallback);
    fetchRoadRoute(stops).then((road) => {
      if (!cancelled && road) setEcoPath(road);
    });
    fetchRoadRoute([stops[0]!, stops[stops.length - 1]!]).then((road) => {
      if (!cancelled && road) setCongestedPath(road);
    });
    return () => {
      cancelled = true;
    };
  }, [stops, fallback]);

  useEffect(() => {
    let start = performance.now();
    const loop = (now: number) => {
      const elapsed = (now - start) / 11000;
      if (elapsed >= 1) start = now;
      setT(Math.min(elapsed, 1));
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  const truck = ecoPath.length > 1 ? pointAlong(ecoPath, t) : null;
  const ahead = ecoPath.length > 1 ? pointAlong(ecoPath, Math.min(t + 0.01, 1)) : null;
  const heading =
    truck && ahead ? (Math.atan2(ahead[1] - truck[1], ahead[0] - truck[0]) * 180) / Math.PI : 0;

  return (
    <MapContainer
      center={[24, 77]}
      zoom={5}
      scrollWheelZoom={false}
      className="h-full w-full"
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds path={ecoPath} />

      {congestedPath.length > 1 && (
        <Polyline positions={congestedPath} pathOptions={{ color: "#dc2626", weight: 4, opacity: 0.55 }}>
          <Popup>Standard congested route</Popup>
        </Polyline>
      )}

      {ecoPath.length > 1 && (
        <>
          <Polyline positions={ecoPath} pathOptions={{ color: "#10b981", weight: 8, opacity: 0.18 }} />
          <Polyline
            positions={ecoPath}
            pathOptions={{
              color: "#00f5d4",
              weight: 4,
              opacity: 0.95,
              dashArray: "14 10",
              className: "leaflet-eco-flow",
            }}
          >
            <Popup>Eco-optimised road corridor</Popup>
          </Polyline>
        </>
      )}

      {truck && <Marker position={truck} icon={truckIcon(heading)} interactive={false} />}

      {stops.map((s, i) => (
        <Marker key={`${s.label}-${i}`} position={[s.lat, s.lng]} icon={stopIcon(s.label, i + 1)}>
          <Popup>
            {i + 1}. {s.label}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
