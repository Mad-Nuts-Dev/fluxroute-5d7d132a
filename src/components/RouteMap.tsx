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
  selectedIndex,
  onRoutes,
}: {
  origin: RoutePoint | null;
  destination: RoutePoint | null;
  selectedIndex: number;
  onRoutes: (routes: RouteOption[]) => void;
}) {
  const dark = useIsDarkTheme();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [error, setError] = useState<string | null>(null);

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
    let cancelled = false;
    setError(null);
    const service = new google.maps.DirectionsService();
    service.route(
      {
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
      },
      (result, status) => {
        if (cancelled) return;
        if (status !== google.maps.DirectionsStatus.OK || !result) {
          setRoutes([]);
          onRoutes([]);
          setError("No drivable route found between these two places.");
          return;
        }
        const parsed: RouteOption[] = result.routes.slice(0, 2).map((r, i) => {
          const meters = r.legs.reduce((acc, l) => acc + (l.distance?.value ?? 0), 0);
          const seconds = r.legs.reduce((acc, l) => acc + (l.duration?.value ?? 0), 0);
          return {
            index: i,
            summary: r.summary || `Route ${i + 1}`,
            distanceKm: meters / 1000,
            durationMin: seconds / 60,
            path: r.overview_path.map((p) => ({ lat: p.lat(), lng: p.lng() })),
          };
        });
        setRoutes(parsed);
        onRoutes(parsed);

        if (mapRef.current && result.routes[0]?.bounds) {
          mapRef.current.fitBounds(result.routes[0].bounds, 48);
        }
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, origin?.lat, origin?.lng, destination?.lat, destination?.lng]);

  if (loadError) return <MapFallback message="Google Maps failed to load." />;
  if (!isLoaded) return <MapFallback message="Loading Google Maps…" />;

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
                strokeColor: "#10b981",
                strokeOpacity: 0.25,
                strokeWeight: selectedIndex === 1 ? 16 : 10,
                zIndex: selectedIndex === 1 ? 3 : 1,
              }}
            />
            <PolylineF
              path={routes[1].path}
              options={{
                strokeColor: "#00f5d4",
                strokeOpacity: selectedIndex === 1 ? 1 : 0.75,
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
              strokeColor: "#2563eb",
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
        {destination && (
          <MarkerF
            position={{ lat: destination.lat, lng: destination.lng }}
            label={{ text: "B", color: "#ffffff", fontWeight: "700" }}
          />
        )}
      </GoogleMap>

      {(!origin || !destination) && (
        <div className="pointer-events-none absolute inset-x-3 top-3 rounded-lg bg-background/90 p-2 text-center text-xs text-muted-foreground shadow-card">
          Pick a From and To city to compare the fastest and eco-friendly routes.
        </div>
      )}
      {error && (
        <div className="pointer-events-none absolute inset-x-3 top-3 rounded-lg bg-background/90 p-2 text-center text-xs text-destructive shadow-card">
          {error}
        </div>
      )}
    </div>
  );
}
