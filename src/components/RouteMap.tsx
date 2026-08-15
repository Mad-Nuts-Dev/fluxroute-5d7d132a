import { GoogleMap, MarkerF, PolylineF, useJsApiLoader } from "@react-google-maps/api";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  GOOGLE_MAPS_BROWSER_KEY,
  GOOGLE_MAPS_LIBRARIES,
  INDIA_CENTER,
  mapOptions,
  useIsDarkTheme,
} from "@/lib/maps";
import { boundsOf, fallbackRoutes, fetchOsrmRoutes, pointAlongPath, truckIcon } from "@/lib/osrm";

export type RoutePoint = { lat: number; lng: number; label: string };

export type RouteOption = {
  index: number;
  summary: string;
  distanceKm: number;
  durationMin: number;
  path: google.maps.LatLngLiteral[];
};

function MapFallback({ message }: { message: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center gap-2 bg-muted text-center text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      {message}
    </div>
  );
}

export function RouteMap({
  origin,
  destination,
  stops = [],
  selectedIndex,
  onRoutes,
}: {
  origin: RoutePoint | null;
  destination: RoutePoint | null;
  stops?: RoutePoint[];
  selectedIndex: number;
  onRoutes: (routes: RouteOption[]) => void;
}) {
  const dark = useIsDarkTheme();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "fluxroute-google-maps",
    googleMapsApiKey: GOOGLE_MAPS_BROWSER_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  useEffect(() => {
    if (!isLoaded || !origin || !destination) {
      setRoutes([]);
      onRoutes([]);
      return;
    }
    const controller = new AbortController();
    setError(null);
    setLoading(true);

    const applyRoutes = (result: RouteOption[]) => {
      setRoutes(result);
      onRoutes(result);
      if (mapRef.current && result[0]?.path.length) {
        mapRef.current.fitBounds(boundsOf(result[0].path), 48);
      }
    };

    fetchOsrmRoutes(origin, destination, controller.signal, stops)
      .then((result) => {
        if (controller.signal.aborted) return;
        applyRoutes(result.length ? result : fallbackRoutes(origin, destination, stops));
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        // Never break the UI: fall back to a direct Origin → stops → Destination corridor.
        console.warn("OSRM routing unavailable, using direct fallback", err);
        applyRoutes(fallbackRoutes(origin, destination, stops));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });


    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isLoaded,
    origin?.lat,
    origin?.lng,
    destination?.lat,
    destination?.lng,
    stops.map((s) => `${s.lat},${s.lng}`).join("|"),
  ]);

  if (loadError) return <MapFallback message="Google Maps failed to load." />;
  if (!isLoaded) return <MapFallback message="Loading Google Maps…" />;

  const activeRoute = routes[selectedIndex] ?? routes[0] ?? null;
  const truckPos = activeRoute ? pointAlongPath(activeRoute.path, 0.4) : null;

  return (
    <div className="relative h-full w-full">
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
        {routes[1] && (
          <>
            <PolylineF
              path={routes[1].path}
              options={{
                strokeColor: "#10B981",
                strokeOpacity: 0.25,
                strokeWeight: selectedIndex === 1 ? 18 : 12,
                zIndex: selectedIndex === 1 ? 3 : 1,
              }}
            />
            <PolylineF
              path={routes[1].path}
              options={{
                strokeColor: "#10B981",
                strokeOpacity: selectedIndex === 1 ? 1 : 0.7,
                strokeWeight: selectedIndex === 1 ? 6 : 4,
                zIndex: selectedIndex === 1 ? 4 : 2,
              }}
            />
          </>
        )}
        {routes[0] && (
          <PolylineF
            path={routes[0].path}
            options={{
              strokeColor: "#3B82F6",
              strokeOpacity: selectedIndex === 0 ? 1 : 0.7,
              strokeWeight: selectedIndex === 0 ? 6 : 4,
              zIndex: selectedIndex === 0 ? 5 : 2,
            }}
          />
        )}
        {origin && (
          <MarkerF
            position={{ lat: origin.lat, lng: origin.lng }}
            label={{ text: "A", color: "#ffffff", fontWeight: "700" }}
          />
        )}
        {stops.map((s, i) => (
          <MarkerF
            key={`${s.lat},${s.lng},${i}`}
            position={{ lat: s.lat, lng: s.lng }}
            label={{ text: String(i + 1), color: "#ffffff", fontWeight: "700" }}
          />
        ))}
        {destination && (
          <MarkerF
            position={{ lat: destination.lat, lng: destination.lng }}
            label={{ text: "B", color: "#ffffff", fontWeight: "700" }}
          />
        )}
        {truckPos && (
          <MarkerF
            position={truckPos}
            zIndex={9}
            icon={{
              url: truckIcon(selectedIndex === 1 ? "#10B981" : "#3B82F6"),
              scaledSize: new google.maps.Size(34, 34),
              anchor: new google.maps.Point(17, 17),
            }}
          />
        )}
      </GoogleMap>

      {(!origin || !destination) && (
        <div className="pointer-events-none absolute inset-x-3 top-3 rounded-lg bg-background/90 p-2 text-center text-xs text-muted-foreground shadow-card">
          Pick a From and To city to compare the fastest and eco-friendly routes.
        </div>
      )}
      {loading && (
        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-center gap-2 rounded-lg bg-background/90 p-2 text-center text-xs text-muted-foreground shadow-card">
          <Loader2 className="size-3.5 animate-spin" /> Tracing highway corridors…
        </div>
      )}
      {error && !loading && (
        <div className="pointer-events-none absolute inset-x-3 top-3 rounded-lg bg-background/90 p-2 text-center text-xs text-destructive shadow-card">
          {error}
        </div>
      )}
    </div>
  );
}
