import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";

import { drivers, vehicles } from "@/data/fleet";
import {
  curvedRoute,
  fetchRoadRoute,
  multiLegRoute,
  pathLength,
  pointAlong,
  type Coord,
} from "@/data/corridors";

function markerIcon(type: "diesel" | "electric", label: string, active: boolean) {
  return L.divIcon({
    className: "",
    html: `<div class="fleet-marker fleet-marker-${type}${active ? " fleet-marker-active" : ""}">${label}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -16],
  });
}

function chargeIcon() {
  return L.divIcon({
    className: "",
    html: `<div class="fleet-marker fleet-marker-charge">⚡</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
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

function Recenter({ lat, lng, zoom }: { lat: number | null; lng: number | null; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat == null || lng == null) return;
    map.flyTo([lat, lng], zoom, { duration: 0.8 });
  }, [lat, lng, zoom, map]);
  return null;
}

/** Progress ticker used to animate the glowing dot along the road geometry. */
function useTravelProgress(active: boolean) {
  const [t, setT] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    let start = performance.now();
    const loop = (now: number) => {
      const elapsed = (now - start) / 9000;
      if (elapsed >= 1) start = now;
      setT(Math.min(elapsed, 1));
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [active]);

  return t;
}

export default function FleetMapClient({
  selectedId,
  onSelect,
  mini = false,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  mini?: boolean;
}) {
  const selected = vehicles.find((v) => v.id === selectedId) ?? null;
  const [ecoPath, setEcoPath] = useState<Coord[]>([]);

  const fallbackEco = useMemo(() => {
    if (!selected) return [] as Coord[];
    return multiLegRoute(
      [
        { lat: selected.origin.lat, lng: selected.origin.lng },
        { lat: selected.lat, lng: selected.lng },
        { lat: selected.destination.lat, lng: selected.destination.lng },
      ],
      0.07,
    );
  }, [selected]);

  const fallbackConventional = useMemo(() => {
    if (!selected) return [] as Coord[];
    return curvedRoute(
      { lat: selected.origin.lat, lng: selected.origin.lng },
      { lat: selected.destination.lat, lng: selected.destination.lng },
      -0.16,
      80,
    );
  }, [selected]);

  const [conventionalPath, setConventionalPath] = useState<Coord[]>([]);

  // Congested standard route: direct origin -> destination on real roads.
  useEffect(() => {
    if (!selected) {
      setConventionalPath([]);
      return;
    }
    let cancelled = false;
    setConventionalPath(fallbackConventional);
    fetchRoadRoute([
      { lat: selected.origin.lat, lng: selected.origin.lng },
      { lat: selected.destination.lat, lng: selected.destination.lng },
    ]).then((road) => {
      if (!cancelled && road) setConventionalPath(road);
    });
    return () => {
      cancelled = true;
    };
  }, [selected, fallbackConventional]);

  // Snap the eco corridor to the real OSM road network; keep synthetic
  // highway geometry as an offline fallback.
  useEffect(() => {
    if (!selected) {
      setEcoPath([]);
      return;
    }
    let cancelled = false;
    setEcoPath(fallbackEco);
    fetchRoadRoute([
      { lat: selected.origin.lat, lng: selected.origin.lng },
      { lat: selected.lat, lng: selected.lng },
      { lat: selected.destination.lat, lng: selected.destination.lng },
    ]).then((road) => {
      if (!cancelled && road) setEcoPath(road);
    });
    return () => {
      cancelled = true;
    };
  }, [selected, fallbackEco]);

  const progress = useTravelProgress(!!selected || mini);
  const dot = ecoPath.length > 1 ? pointAlong(ecoPath, progress) : null;
  const ahead =
    ecoPath.length > 1 ? pointAlong(ecoPath, Math.min(progress + 0.01, 1)) : null;
  const heading =
    dot && ahead
      ? (Math.atan2(ahead[1] - dot[1], ahead[0] - dot[0]) * 180) / Math.PI
      : 0;

  const ecoKm = ecoPath.length > 1 ? pathLength(ecoPath) : 0;
  const conventionalKm = conventionalPath.length > 1 ? pathLength(conventionalPath) : 0;

  const miniCorridors = useMemo(() => {
    if (!mini) return [] as Coord[][];
    return [
      multiLegRoute(
        [
          { lat: 28.6139, lng: 77.209 },
          { lat: 26.9124, lng: 75.7873 },
          { lat: 23.0225, lng: 72.5714 },
          { lat: 19.076, lng: 72.8777 },
        ],
        0.06,
      ),
    ];
  }, [mini]);

  return (
    <MapContainer
      center={mini ? [23.5, 76] : [21.5, 77.5]}
      zoom={mini ? 4 : 5}
      scrollWheelZoom={false}
      zoomControl={!mini}
      dragging={!mini}
      className="h-full w-full"
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {!mini && (
        <Recenter lat={selected?.lat ?? null} lng={selected?.lng ?? null} zoom={7} />
      )}

      {miniCorridors.map((path, i) => (
        <Polyline
          key={`corridor-${i}`}
          positions={path}
          pathOptions={{
            color: "#10b981",
            weight: 3,
            opacity: 0.85,
            dashArray: "10 12",
            className: "leaflet-eco-flow",
          }}
        />
      ))}

      {selected && (
        <>
          {/* Conventional highway — full diesel emissions */}
          <Polyline
            positions={conventionalPath}
            pathOptions={{ color: "#dc2626", weight: 4, opacity: 0.6 }}
          >
            <Popup>
              <div className="space-y-1 text-xs">
                <p className="text-sm font-semibold">Standard Congested Route</p>
                <p>{Math.round(conventionalKm)} km · 2 toll delays</p>
                <p>{(conventionalKm * 0.21).toFixed(1)} kg CO₂ emitted</p>
              </div>
            </Popup>
          </Polyline>

          {/* Eco-optimised corridor snapped to real roads */}
          <Polyline
            positions={ecoPath}
            pathOptions={{ color: "#10b981", weight: 7, opacity: 0.16 }}
          />
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
            <Popup>
              <div className="space-y-1 text-xs">
                <p className="text-sm font-semibold">Eco-Optimized Corridor</p>
                <p>{Math.round(ecoKm)} km · bypass routing</p>
                <p>22% fuel reduction vs conventional</p>
                <p>Charging points: {selected.origin.city} & {selected.nextStop}</p>
              </div>
            </Popup>
          </Polyline>

          {dot && (
            <Marker position={dot} icon={truckIcon(heading)} interactive={false} />
          )}

          <Marker position={[selected.origin.lat, selected.origin.lng]} icon={chargeIcon()}>
            <Popup>Origin · {selected.origin.city}</Popup>
          </Marker>
          <Marker
            position={[selected.destination.lat, selected.destination.lng]}
            icon={chargeIcon()}
          >
            <Popup>Destination · {selected.destination.city}</Popup>
          </Marker>
        </>
      )}

      {vehicles.map((v) => {
        const driver = drivers.find((d) => d.name === v.driver);
        return (
          <Marker
            key={v.id}
            position={[v.lat, v.lng]}
            icon={markerIcon(v.type, v.type === "electric" ? "EV" : "DSL", v.id === selectedId)}
            eventHandlers={{ click: () => onSelect(v.id) }}
          >
            <Popup>
              <div className="space-y-1 text-xs">
                <p className="text-sm font-semibold">{v.name}</p>
                <p className="text-muted-foreground">{v.plate}</p>
                <p>Driver: {v.driver}</p>
                <p className="tabular">Speed: {v.speed} km/h</p>
                <p>Current city: {v.city}</p>
                <p>Next waypoint: {v.nextStop}</p>
                <p className="tabular">Cargo payload: {v.payloadKg} kg</p>
                <p className="tabular">
                  {v.type === "electric" ? `Battery ${v.battery}%` : `Fuel ${v.fuelLevel}%`}
                </p>
                {driver && <p className="tabular">Driver Eco-Score: {driver.ecoScore}/100</p>}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
