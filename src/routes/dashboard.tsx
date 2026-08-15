import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowUpRight,
  BatteryCharging,
  Fuel,
  Leaf,
  MapPin,
  Package,
  TrendingUp,
  Zap,
} from "lucide-react";

import { FleetMap } from "@/components/FleetMap";
import { OrderHistoryDialog } from "@/components/OrderHistoryDialog";
import { ShipmentBadge } from "@/components/ShipmentBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { type Shipment } from "@/data/fleet";
import { useFleet } from "@/context/FleetContext";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Live Fleet Map — FluxRoute: Green Logistics AI" },
      {
        name: "description",
        content:
          "Track diesel and electric vehicles live, monitor CO2 savings and follow every active shipment.",
      },
      { property: "og:title", content: "Live Fleet Map — FluxRoute: Green Logistics AI" },
      {
        property: "og:description",
        content: "Live vehicle positions, emissions savings and shipment status in one view.",
      },
    ],
  }),
  component: Dashboard,
});

const metrics = [
  {
    label: "Total CO2 Saved Today",
    value: "42.8 kg",
    hint: "+12.4% vs yesterday",
    icon: Leaf,
    trend: true,
  },
  {
    label: "EV Fleet Utilization",
    value: "75%",
    hint: "3 of 4 vehicles on EV-eligible routes",
    icon: Zap,
    trend: false,
  },
  {
    label: "Fuel Cost Savings",
    value: "₹2,450",
    hint: "Diesel avoided across 4 trips",
    icon: Fuel,
    trend: false,
  },
];

function Dashboard() {
  const { shipments, vehicles } = useFleet();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [openShipment, setOpenShipment] = useState<Shipment | null>(null);

  return (
    <div className="space-y-5 p-4 md:p-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight md:text-2xl">
            Live Fleet Map
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time positions for every active vehicle across India.
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-eco-soft px-3 py-1.5 text-xs font-semibold text-accent-foreground">
          <span className="size-2 animate-pulse rounded-full bg-primary" />
          Telemetry live
        </span>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((m) => (
          <Card key={m.label} className="rounded-xl border-border/70 shadow-card">
            <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {m.label}
              </CardTitle>
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-eco-soft text-accent-foreground">
                <m.icon className="size-4" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold tracking-tight">{m.value}</p>
                {m.trend && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    <TrendingUp className="size-3.5" />
                    Up
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{m.hint}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="overflow-hidden rounded-xl border-border/70 p-0 shadow-card">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Fleet positions</p>
              <p className="text-xs text-muted-foreground">
                Tap a vehicle or shipment to draw its live route.
              </p>
            </div>
            <MapPin className="size-4 shrink-0 text-muted-foreground" />
          </div>
          <div className="h-[380px] w-full md:h-[520px]">
            <FleetMap selectedId={selectedVehicleId} onSelect={setSelectedVehicleId} />
          </div>
        </Card>

        <Card className="rounded-xl border-border/70 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="size-4 text-primary" />
              Active shipments
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[300px] pr-3 xl:h-[470px]">
              <ul className="space-y-3">
                {shipments.map((s) => {
                  const vehicle = vehicles.find((v) => v.id === s.vehicleId);
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVehicleId(s.vehicleId);
                          setOpenShipment(s);
                        }}
                        className={`w-full rounded-xl border bg-card p-3 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-float ${
                          selectedVehicleId === s.vehicleId
                            ? "border-primary/70 ring-2 ring-primary/20"
                            : "border-border/70"
                        }`}
                      >
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{s.destination}</p>
                          <p className="text-xs text-muted-foreground">{s.id}</p>
                        </div>
                        <ShipmentBadge status={s.status} />
                      </div>
                      <Separator className="my-2.5" />
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>{s.weightKg} kg</span>
                        <span>{s.distanceKm} km</span>
                        <span className="inline-flex items-center gap-1">
                          {vehicle?.type === "electric" ? (
                            <BatteryCharging className="size-3.5 text-primary" />
                          ) : (
                            <Fuel className="size-3.5" />
                          )}
                          {vehicle?.name}
                        </span>
                      </div>
                      <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium">
                        <ArrowUpRight className="size-3.5 text-primary" />
                        {s.eta}
                      </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      </section>

      <OrderHistoryDialog
        shipment={openShipment}
        onOpenChange={(open) => !open && setOpenShipment(null)}
      />
    </div>
  );
}
