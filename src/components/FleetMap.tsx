import { GoogleMap, InfoWindowF, MarkerF, PolylineF, useJsApiLoader } from "@react-google-maps/api";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useFleet } from "@/context/FleetContext";
import { drivers } from "@/data/fleet";
import {
  GOOGLE_MAPS_BROWSER_KEY,
  GOOGLE_MAPS_LIBRARIES,
  INDIA_CENTER,
  mapOptions,
  useIsDarkTheme,
} from "@/lib/maps";
import { boundsOf, fetchOsrmRoutes, pointAlongPath, type LatLngLit } from "@/lib/osrm";

function MapFallback({ message = "Loading live fleet positions…" }: { message?: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center gap-2 bg-muted text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      {message}
    </div>
  );
}

export function FleetMap({
  selectedId = null,
  onSelect = () => {},
}: {
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const { vehicles } = useFleet();
  const dark = useIsDarkTheme();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "fluxroute-google-maps",
    googleMapsApiKey: GOOGLE_MAPS_BROWSER_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const selected = vehicles.find((v) => v.id === selectedId) ?? null;

  const [corridor, setCorridor] = useState<LatLngLit[]>([]);

  // Real highway geometry (OSRM) between the selected vehicle's origin and destination.
  useEffect(() => {
    if (!isLoaded || !selected) {
      setCorridor([]);
      return;
    }
    const controller = new AbortController();
    fetchOsrmRoutes(
      { lat: selected.origin.lat, lng: selected.origin.lng },
      { lat: selected.destination.lat, lng: selected.destination.lng },
      controller.signal,
    )
      .then((routes) => {
        if (controller.signal.aborted) return;
        setCorridor(routes[0]?.path ?? []);
      })
      .catch(() => {
        if (!controller.signal.aborted) setCorridor([]);
      });
    return () => controller.abort();
  }, [isLoaded, selected?.id, selected?.origin.lat, selected?.destination.lat]);

  // Fraction travelled, derived from the vehicle's live straight-line progress.
  const progress = selected
    ? Math.min(
        Math.max(
          Math.hypot(
            selected.lat - selected.origin.lat,
            selected.lng - selected.origin.lng,
          ) /
            (Math.hypot(
              selected.destination.lat - selected.origin.lat,
              selected.destination.lng - selected.origin.lng,
            ) || 1),
          0,
        ),
        1,
      )
    : 0;

  const snapped = corridor.length ? pointAlongPath(corridor, progress) : null;

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !selected) return;
    if (corridor.length) {
      mapRef.current.fitBounds(boundsOf(corridor), 56);
      return;
    }
    mapRef.current.panTo({ lat: selected.lat, lng: selected.lng });
    mapRef.current.setZoom(7);
  }, [isLoaded, selected, corridor]);

  if (loadError) {
    return <MapFallback message="Google Maps failed to load." />;
  }
  if (!isLoaded) return <MapFallback />;

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%" }}
      center={INDIA_CENTER}
      zoom={5}
      options={mapOptions(dark)}
      onLoad={(map) => {
        mapRef.current = map;
      }}
      onUnmount={() => {
        mapRef.current = null;
      }}
    >
      {selected && corridor.length > 0 && (
        <>
          <PolylineF
            path={corridor}
            options={{
              strokeColor: "#10B981",
              strokeOpacity: 0.22,
              strokeWeight: 14,
              zIndex: 1,
            }}
          />
          <PolylineF
            path={corridor}
            options={{ strokeColor: "#10B981", strokeOpacity: 1, strokeWeight: 5, zIndex: 2 }}
          />
        </>
      )}
      {selected && (
        <>
          <MarkerF
            position={{ lat: selected.origin.lat, lng: selected.origin.lng }}
            label={{ text: "A", color: "#ffffff", fontWeight: "700" }}
          />
          <MarkerF
            position={{ lat: selected.destination.lat, lng: selected.destination.lng }}
            label={{ text: "B", color: "#ffffff", fontWeight: "700" }}
          />
        </>
      )}

      {vehicles.map((v) => {
        const driver = drivers.find((d) => d.name === v.driver);
        const active = v.id === selectedId;
        return (
          <MarkerF
            key={v.id}
            position={{ lat: v.lat, lng: v.lng }}
            onClick={() => {
              onSelect(v.id);
              setOpenId(v.id);
            }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: active ? 12 : 9,
              fillColor: v.type === "electric" ? "#10b981" : "#f97316",
              fillOpacity: 1,
              strokeColor: dark ? "#0f1b17" : "#ffffff",
              strokeWeight: 3,
            }}
          >
            {openId === v.id && (
              <InfoWindowF onCloseClick={() => setOpenId(null)}>
                <div style={{ color: "#111", fontSize: 12, lineHeight: 1.5 }}>
                  <strong>{v.name}</strong>
                  <div>{v.plate}</div>
                  <div>Driver: {v.driver}</div>
                  <div>Speed: {v.speed} km/h</div>
                  <div>
                    {v.origin.city} → {v.destination.city}
                  </div>
                  <div>Payload: {v.payloadKg} kg</div>
                  <div>
                    {v.type === "electric" ? `Battery ${v.battery}%` : `Fuel ${v.fuelLevel}%`}
                  </div>
                  {driver && <div>Eco-Score: {driver.ecoScore}/100</div>}
                </div>
              </InfoWindowF>
            )}
          </MarkerF>
        );
      })}
    </GoogleMap>
  );
}

export default FleetMap;
