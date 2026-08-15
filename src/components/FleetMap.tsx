import { GoogleMap, InfoWindowF, MarkerF, PolylineF, useJsApiLoader } from "@react-google-maps/api";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useFleet } from "@/context/FleetContext";
import { drivers } from "@/data/fleet";
import {
  GOOGLE_MAPS_BROWSER_KEY,
  GOOGLE_MAPS_LIBRARIES,
  INDIA_CENTER,
  mapOptions,
  useIsDarkTheme,
} from "@/lib/maps";

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

  const corridor = useMemo(() => {
    if (!selected) return [];
    return [
      { lat: selected.origin.lat, lng: selected.origin.lng },
      { lat: selected.lat, lng: selected.lng },
      { lat: selected.destination.lat, lng: selected.destination.lng },
    ];
  }, [selected]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !selected) return;
    mapRef.current.panTo({ lat: selected.lat, lng: selected.lng });
    mapRef.current.setZoom(7);
  }, [isLoaded, selected]);

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
      {selected && (
        <>
          <PolylineF
            path={corridor}
            options={{ strokeColor: "#10b981", strokeOpacity: 0.95, strokeWeight: 5 }}
          />
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
