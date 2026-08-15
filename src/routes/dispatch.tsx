import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useJsApiLoader } from "@react-google-maps/api";
import { useMemo, useState } from "react";
import {
  BatteryCharging,
  CheckCircle2,
  Clock,
  Fuel,
  Gauge,
  Leaf,
  PackageCheck,
  Recycle,
  Route as RouteIcon,
  Thermometer,
  Truck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { CityAutocomplete } from "@/components/CityAutocomplete";
import { RouteMap, type RouteOption, type RoutePoint } from "@/components/RouteMap";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useFleet } from "@/context/FleetContext";
import { backhaulMatch, batteryModel } from "@/data/ev";
import { CO2_PER_KM } from "@/data/fleet";
import { GOOGLE_MAPS_BROWSER_KEY, GOOGLE_MAPS_LIBRARIES } from "@/lib/maps";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dispatch")({
  head: () => ({
    meta: [
      { title: "Dispatch & Routing — FluxRoute: Green Logistics AI" },
      {
        name: "description",
        content:
          "Plan Pan-India corridors with Google Maps, compare the fastest and eco-friendly route, then dispatch cargo in one click.",
      },
      { property: "og:title", content: "Dispatch & Routing — FluxRoute: Green Logistics AI" },
      {
        property: "og:description",
        content:
          "Google Places city search, dual-route comparison and instant cargo booking into the live fleet.",
      },
    ],
  }),
  component: DispatchPage,
});

type Preference = "auto" | "ev" | "diesel";

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function etaText(minutes: number) {
  const d = new Date(Date.now() + minutes * 60_000);
  return `${d.toLocaleDateString("en-IN", { weekday: "short" })}, ${d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function DispatchPage() {
  const navigate = useNavigate();
  const { bookShipment } = useFleet();

  const { isLoaded } = useJsApiLoader({
    id: "fluxroute-google-maps",
    googleMapsApiKey: GOOGLE_MAPS_BROWSER_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [originText, setOriginText] = useState("");
  const [destinationText, setDestinationText] = useState("");
  const [origin, setOrigin] = useState<RoutePoint | null>(null);
  const [destination, setDestination] = useState<RoutePoint | null>(null);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [weight, setWeight] = useState("350");
  const [ambient, setAmbient] = useState("42");
  const [preference, setPreference] = useState<Preference>("auto");

  const fastest = routes[0] ?? null;
  const eco = routes[1] ?? routes[0] ?? null;
  const active = selectedRoute === 1 ? eco : fastest;

  const w = Number(weight) || 0;
  const distance = Math.round(active?.distanceKm ?? 0);
  const mode: "ev" | "diesel" =
    preference === "ev" ? "ev" : preference === "diesel" ? "diesel" : w <= 600 ? "ev" : "diesel";

  const battery = batteryModel({
    distanceKm: distance,
    payloadKg: w,
    ambientC: Number(ambient) || 30,
  });
  const backhaul = backhaulMatch(origin?.label ?? "Jaipur", destination?.label ?? "Delhi");

  // Eco corridor avoids stop-start congestion, so its per-km factor is lower.
  const fastestCo2 = (fastest?.distanceKm ?? 0) * CO2_PER_KM;
  const ecoCo2 = (eco?.distanceKm ?? 0) * CO2_PER_KM * 0.78;
  const co2Saved = Math.max(fastestCo2 - ecoCo2, 0);

  const co2Baseline = distance * CO2_PER_KM;
  const co2After = mode === "ev" ? 0 : selectedRoute === 1 ? ecoCo2 : fastestCo2;
  const fuelCost = Math.round(distance * (mode === "ev" ? 2.4 : 9.6));

  const ecoMinutes = eco ? eco.durationMin * (eco === fastest ? 1.08 : 1) : 0;

  const canBook = !!origin && !!destination && !!active && distance > 0;

  const cards = useMemo(() => {
    if (!fastest) return [];
    return [
      {
        index: 0,
        title: "Fastest Route",
        via: fastest.summary,
        km: fastest.distanceKm,
        minutes: fastest.durationMin,
        co2: fastestCo2,
        highlight: null as string | null,
      },
      {
        index: 1,
        title: "Eco-Friendly Route",
        via: eco?.summary ?? fastest.summary,
        km: eco?.distanceKm ?? fastest.distanceKm,
        minutes: ecoMinutes,
        co2: ecoCo2,
        highlight: `Save ${co2Saved.toFixed(1)} kg CO₂`,
      },
    ];
  }, [fastest, eco, fastestCo2, ecoCo2, ecoMinutes, co2Saved]);

  function handleBook() {
    if (!canBook || !origin || !destination || !active) return;
    const minutes = selectedRoute === 1 ? ecoMinutes : active.durationMin;
    const { shipmentId } = bookShipment({
      originCity: origin.label,
      originLat: origin.lat,
      originLng: origin.lng,
      destinationCity: destination.label,
      destinationLat: destination.lat,
      destinationLng: destination.lng,
      distanceKm: active.distanceKm,
      etaText: etaText(minutes),
      weightKg: w,
      mode,
      routeLabel: selectedRoute === 1 ? "Eco-Friendly Route" : "Fastest Route",
    });
    toast.success(`${shipmentId} dispatched`, {
      description: `${origin.label} → ${destination.label} · ${distance} km`,
    });
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="space-y-5 p-4 transition-all duration-300 md:p-6">
      <header>
        <h1 className="text-xl font-bold tracking-tight md:text-2xl">Dispatch &amp; Routing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search any city, town or industrial hub in India — FluxRoute compares the fastest and the
          greenest corridor on live Google road data.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-xl border-border/70 shadow-card transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <RouteIcon className="size-4 text-primary" />
              Corridor planner
            </CardTitle>
            <CardDescription>Pan-India Google Places search, restricted to India.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="origin">Origin City (From)</Label>
                {isLoaded ? (
                  <CityAutocomplete
                    id="origin"
                    value={originText}
                    placeholder="e.g. Jaipur"
                    onTextChange={(t) => {
                      setOriginText(t);
                      if (!t) setOrigin(null);
                    }}
                    onSelect={(p) => {
                      setOrigin(p);
                      setOriginText(p.label);
                    }}
                  />
                ) : (
                  <Input id="origin" placeholder="Loading city search…" disabled />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Destination City (To)</Label>
                {isLoaded ? (
                  <CityAutocomplete
                    id="destination"
                    value={destinationText}
                    placeholder="e.g. Delhi"
                    onTextChange={(t) => {
                      setDestinationText(t);
                      if (!t) setDestination(null);
                    }}
                    onSelect={(p) => {
                      setDestination(p);
                      setDestinationText(p.label);
                    }}
                  />
                ) : (
                  <Input id="destination" placeholder="Loading city search…" disabled />
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="weight">Payload (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  min={0}
                  max={5000}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ambient">Ambient Temp (°C)</Label>
                <Input
                  id="ambient"
                  type="number"
                  min={-10}
                  max={55}
                  value={ambient}
                  onChange={(e) => setAmbient(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Vehicle Type Preference</Label>
              <ToggleGroup
                type="single"
                value={preference}
                onValueChange={(v) => v && setPreference(v as Preference)}
                className="w-full flex-wrap justify-start gap-2"
              >
                <ToggleGroupItem value="auto" className="rounded-xl border px-3">
                  Auto-Select
                </ToggleGroupItem>
                <ToggleGroupItem value="ev" className="rounded-xl border px-3">
                  <BatteryCharging className="size-4" />
                  Electric (EV)
                </ToggleGroupItem>
                <ToggleGroupItem value="diesel" className="rounded-xl border px-3">
                  <Truck className="size-4" />
                  Diesel Truck
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {canBook ? (
              <div className="animate-scale-in rounded-xl border border-primary/40 bg-eco-soft p-3 text-accent-foreground">
                <p className="tabular text-lg font-bold">
                  {distance} km via {active?.summary}
                </p>
                <p className="mt-1 text-xs">
                  {formatDuration(selectedRoute === 1 ? ecoMinutes : (active?.durationMin ?? 0))}{" "}
                  drive · ₹{fuelCost.toLocaleString("en-IN")} energy cost ·{" "}
                  {co2After.toFixed(1)} kg CO₂
                </p>
              </div>
            ) : (
              <p className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">
                Select a From and To city from the suggestions to calculate both corridors.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-xl border-border/70 p-0 shadow-card transition-all duration-300">
          <div className="border-b px-4 py-3">
            <p className="text-sm font-semibold">Google route comparison</p>
            <p className="text-xs text-muted-foreground">
              Blue = fastest route · Glowing green = eco-friendly highway bypass.
            </p>
          </div>
          <div className="h-[380px] w-full md:h-[460px]">
            <RouteMap
              origin={origin}
              destination={destination}
              selectedIndex={selectedRoute}
              onRoutes={setRoutes}
            />
          </div>
        </Card>
      </div>

      {cards.length > 0 && (
        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {cards.map((c) => {
              const isActive = selectedRoute === c.index;
              return (
                <button
                  key={c.index}
                  type="button"
                  onClick={() => setSelectedRoute(c.index)}
                  className={cn(
                    "rounded-xl border bg-card p-4 text-left shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-float",
                    isActive
                      ? c.index === 1
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-chart-3 ring-2 ring-chart-3/30"
                      : "border-border/70",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      {c.index === 1 ? (
                        <Leaf className="size-4 text-primary" />
                      ) : (
                        <Gauge className="size-4 text-chart-3" />
                      )}
                      {c.title}
                    </p>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                        <CheckCircle2 className="size-3.5" /> Selected
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">via {c.via}</p>
                  <div className="tabular mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <span className="font-bold">{Math.round(c.km)} km</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5 text-muted-foreground" />
                      {formatDuration(c.minutes)}
                    </span>
                    <span>{c.co2.toFixed(1)} kg CO₂</span>
                  </div>
                  {c.highlight && (
                    <p className="mt-3 inline-flex rounded-lg bg-eco-soft px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                      🌿 {c.highlight}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          <Button
            size="lg"
            className="w-full rounded-xl text-base font-semibold"
            disabled={!canBook}
            onClick={handleBook}
          >
            <PackageCheck className="size-5" />
            Book Cargo &amp; Dispatch
          </Button>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="card-lift rounded-xl border-border/70 shadow-card transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BatteryCharging className="size-4 text-primary" />
              AI Battery Feasibility
            </CardTitle>
            <CardDescription>Elevation, payload and temperature decay model.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={Math.min(battery.feasibility, 100)} className="h-2.5" />
            <p className="tabular text-xs text-muted-foreground">
              Payload: {w} kg + High Ambient Temp (+{battery.ambientC}°C) → Estimated Battery
              Consumption: {battery.consumption.toFixed(2)} kWh/km
            </p>
            <p className="tabular text-xs text-muted-foreground">
              Usable pack {battery.usableKwh} kWh → {Math.round(battery.rangeKm)} km real range on{" "}
              {battery.gradient}% average gradient.
            </p>
            {battery.chargers > 0 ? (
              <Alert className="rounded-xl border-transparent bg-eco-soft text-accent-foreground">
                <Zap className="size-4" />
                <AlertTitle>
                  Auto-assigned {battery.chargers} intermediate Fast-Charger
                  {battery.chargers > 1 ? "s" : ""} at {battery.chargerCity}
                </AlertTitle>
                <AlertDescription className="text-accent-foreground/80">
                  Relay charging keeps the EV feasible across the full {distance} km run.
                </AlertDescription>
              </Alert>
            ) : (
              <p className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                <CheckCircle2 className="size-3.5" />
                Single-charge feasible — no charging stop required.
              </p>
            )}
            <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Thermometer className="size-3.5" />
              Heat derating applied above 30°C.
            </p>
          </CardContent>
        </Card>

        <Card className="card-lift rounded-xl border-border/70 shadow-card transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Leaf className="size-4 text-primary" />
              Before vs. after
            </CardTitle>
            <CardDescription>At {CO2_PER_KM} kg CO₂ per km baseline.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-muted/60 p-3">
                <p className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Fuel className="size-3.5" /> Before
                </p>
                <p className="tabular mt-1 text-xl font-bold">{co2Baseline.toFixed(1)} kg</p>
              </div>
              <div className="rounded-xl border border-transparent bg-eco-soft p-3">
                <p className="inline-flex items-center gap-2 text-xs font-semibold text-accent-foreground">
                  <Zap className="size-3.5" /> After
                </p>
                <p className="tabular mt-1 text-xl font-bold text-accent-foreground">
                  {co2After.toFixed(1)} kg
                </p>
              </div>
            </div>
            <Progress
              value={co2Baseline ? (Math.max(co2Baseline - co2After, 0) / co2Baseline) * 100 : 0}
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {Math.max(co2Baseline - co2After, 0).toFixed(1)} kg CO₂ avoided on the selected
              corridor.
            </p>
          </CardContent>
        </Card>

        <Card className="card-lift rounded-xl border-border/70 shadow-card transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Recycle className="size-4 text-primary" />
              Smart Backhaul Match
            </CardTitle>
            <CardDescription>Anti-deadheading return cargo suggestion.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="animate-fade-in rounded-xl bg-eco-soft p-3 text-xs font-medium text-accent-foreground">
              💡 Return Load Found: {backhaul.weightKg} kg cargo ready in {backhaul.city} for return
              to {backhaul.returnTo}. Prevents 0% empty return run.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
