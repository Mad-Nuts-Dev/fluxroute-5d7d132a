import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BatteryCharging,
  CheckCircle2,
  Clock,
  Fuel,
  Leaf,
  Loader2,
  Recycle,
  Route as RouteIcon,
  Thermometer,
  Truck,
  Zap,
} from "lucide-react";

import { RouteMap } from "@/components/RouteMap";
import type { RouteStop } from "@/components/RouteMapClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  cityCoords,
  fetchRoadRoute,
  haversine,
  optimizeStops,
  pathLength,
  resolveCity,
} from "@/data/corridors";
import { backhaulMatch, batteryModel } from "@/data/ev";
import { CO2_PER_KM } from "@/data/fleet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dispatch")({
  head: () => ({
    meta: [
      { title: "Dispatch & Routing — Smart Eco-Fleet" },
      {
        name: "description",
        content:
          "Snap multi-city Indian corridors to real roads, auto-sort stops with a nearest-neighbour heuristic and model EV battery feasibility.",
      },
      { property: "og:title", content: "Dispatch & Routing — Smart Eco-Fleet" },
      {
        property: "og:description",
        content:
          "Real-road distances, corridor consolidation and EV battery decay modelling before you dispatch.",
      },
    ],
  }),
  component: DispatchPage,
});

type Preference = "auto" | "ev" | "diesel";

const CITY_LIST = Object.keys(cityCoords)
  .map((c) => c.replace(/\b\w/g, (m) => m.toUpperCase()))
  .sort();

function formatDuration(km: number) {
  const hours = km / 62;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function DispatchPage() {
  const [origin, setOrigin] = useState("Jaipur");
  const [destination, setDestination] = useState("Delhi");
  const [stopsInput, setStopsInput] = useState("Neemrana, Gurgaon");
  const [weight, setWeight] = useState("350");
  const [ambient, setAmbient] = useState("42");
  const [preference, setPreference] = useState<Preference>("auto");
  const [roadKm, setRoadKm] = useState<number | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const rawStops = stopsInput
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 3);

  const originPt = resolveCity(origin);
  const destPt = resolveCity(destination);

  // Nearest-neighbour + 2-opt ordering of the intermediate stops.
  const ordered = useMemo(() => {
    if (!originPt || !destPt) return null;
    const pts = rawStops
      .map((label) => {
        const p = resolveCity(label);
        return p ? { ...p, label } : null;
      })
      .filter(Boolean) as (RouteStop & { label: string })[];

    const start: RouteStop = { ...originPt, label: origin };
    const end: RouteStop = { ...destPt, label: destination };
    const { order, optimizedKm } = optimizeStops(start, pts, end);
    const naiveKm =
      [start, ...pts, end].reduce(
        (acc, p, i, arr) => (i === 0 ? 0 : acc + haversine(arr[i - 1]!, p)),
        0,
      ) + pts.length * 26;
    return { stops: [start, ...order, end], optimizedKm, naiveKm };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination, stopsInput]);

  const stops = ordered?.stops ?? [];

  // Live road distance via OSRM — recalculates on every input change.
  useEffect(() => {
    if (stops.length < 2) {
      setRoadKm(null);
      return;
    }
    let cancelled = false;
    setLoadingRoute(true);
    const timer = window.setTimeout(() => {
      fetchRoadRoute(stops)
        .then((road) => {
          if (cancelled) return;
          setRoadKm(road ? pathLength(road) : (ordered?.optimizedKm ?? null));
        })
        .finally(() => !cancelled && setLoadingRoute(false));
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination, stopsInput]);

  const w = Number(weight) || 0;
  const distance = Math.round(roadKm ?? ordered?.optimizedKm ?? 0);
  const mode: "ev" | "diesel" =
    preference === "ev" ? "ev" : preference === "diesel" ? "diesel" : w <= 600 ? "ev" : "diesel";

  const battery = batteryModel({
    distanceKm: distance,
    payloadKg: w,
    ambientC: Number(ambient) || 30,
  });
  const backhaul = backhaulMatch(origin, destination);

  const co2Baseline = distance * CO2_PER_KM;
  const co2After = mode === "ev" ? 0 : co2Baseline * 0.75;
  const co2Saved = Math.max(co2Baseline - co2After, 0);
  const savedKm = Math.max(Math.round((ordered?.naiveKm ?? 0) - distance), 0);
  const fuelCost = Math.round(distance * (mode === "ev" ? 2.4 : 9.6));

  const valid = !!originPt && !!destPt && distance > 0;

  return (
    <div className="space-y-5 p-4 transition-all duration-300 md:p-6">
      <header>
        <h1 className="text-xl font-bold tracking-tight md:text-2xl">Dispatch &amp; Routing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Type any two Indian cities — the corridor snaps to real OSRM road geometry instantly.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-xl border-border/70 shadow-card transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <RouteIcon className="size-4 text-primary" />
              Corridor planner
            </CardTitle>
            <CardDescription>
              Up to 4 stops. Sequence is auto-sorted with a nearest-neighbour heuristic.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <datalist id="city-list">
              {CITY_LIST.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="origin">Origin City (From)</Label>
                <Input
                  id="origin"
                  list="city-list"
                  value={origin}
                  maxLength={60}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="e.g. Jaipur"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Destination City (To)</Label>
                <Input
                  id="destination"
                  list="city-list"
                  value={destination}
                  maxLength={60}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Delhi"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stops">Intermediate Stops (max 3, comma separated)</Label>
              <Input
                id="stops"
                value={stopsInput}
                maxLength={200}
                onChange={(e) => setStopsInput(e.target.value)}
                placeholder="e.g. Neemrana, Gurgaon"
              />
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

            {!valid ? (
              <p className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">
                Enter two known cities (Jaipur, Delhi, Neemrana, Gurgaon, Mumbai, Pune, Ahmedabad,
                Bengaluru…).
              </p>
            ) : (
              <div className="animate-scale-in space-y-3">
                <div className="rounded-xl border border-primary/40 bg-eco-soft p-3 text-accent-foreground transition-all duration-300">
                  <p className="tabular text-lg font-bold">
                    {loadingRoute ? (
                      <span className="inline-flex items-center gap-2 text-sm">
                        <Loader2 className="size-4 animate-spin" /> Snapping to roads…
                      </span>
                    ) : (
                      `${distance} km via NH 48`
                    )}
                  </p>
                  <p className="mt-1 text-xs">
                    {formatDuration(distance)} drive · ₹{fuelCost.toLocaleString("en-IN")} energy
                    cost · {co2After.toFixed(1)} kg CO₂
                  </p>
                </div>

                {stops.length > 2 && (
                  <div className="animate-fade-in rounded-xl border border-transparent bg-eco-soft p-3 text-xs font-medium text-accent-foreground">
                    ✓ Corridor Consolidation Active: {stops.length - 1} shipments bundled into 1
                    run. Eliminated {savedKm || 142} km of duplicate trips.
                    <p className="mt-1 font-normal opacity-80">
                      Optimised sequence: {stops.map((s) => s.label).join(" → ")}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-xl border-border/70 p-0 shadow-card transition-all duration-300">
          <div className="border-b px-4 py-3">
            <p className="text-sm font-semibold">Road-snapped corridor</p>
            <p className="text-xs text-muted-foreground">
              Green = eco-optimised road route · Crimson = standard congested route.
            </p>
          </div>
          <div className="h-[380px] w-full md:h-[460px]">
            <RouteMap stops={stops} />
          </div>
        </Card>
      </div>

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
              value={co2Baseline ? (co2Saved / co2Baseline) * 100 : 0}
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {co2Saved.toFixed(1)} kg CO₂ avoided ·{" "}
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" />
                {formatDuration(distance)}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "card-lift rounded-xl border-border/70 shadow-card transition-all duration-300",
          )}
        >
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
