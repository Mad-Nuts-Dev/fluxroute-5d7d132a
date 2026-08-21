import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BatteryCharging,
  Gauge,
  Leaf,
  Radar,
  Route as RouteIcon,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useState } from "react";

import FleetMap from "@/components/FleetMap";
import MaritimeMap, { type Disruption } from "@/components/MaritimeMap";
import MaritimeOptimizer from "@/components/MaritimeOptimizer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FluxRoute: Green Logistics AI" },
      {
        name: "description",
        content:
          "Road-snapped multi-stop routing, EV battery-decay modelling and an automated ESG carbon ledger for green fleets.",
      },
      { property: "og:title", content: "FluxRoute: Green Logistics AI" },
      {
        property: "og:description",
        content:
          "Launch the live cockpit or explore the OSRM-powered eco-routing engine for Indian freight corridors.",
      },
    ],
  }),
  component: Landing,
});

const achievements = [
  { icon: Leaf, value: "42.8 kg", label: "CO₂ Offset Today" },
  { icon: BatteryCharging, value: "88%", label: "EV Dispatch Rate" },
  { icon: Wallet, value: "₹14,200", label: "Fuel Saved" },
  { icon: Gauge, value: "Zero", label: "Deadhead Miles" },
];

const steps = [
  {
    n: "01",
    icon: Radar,
    title: "Intelligent Multi-Stop Geocoding & Road Snapping",
    body: "City presets resolve to coordinates, then every leg is snapped to real OSRM road geometry — no straight-line guesswork.",
  },
  {
    n: "02",
    icon: BatteryCharging,
    title: "EV Elevation & Battery Decay Simulation",
    body: "Payload, gradient and ambient temperature feed a kWh/km model that auto-inserts fast-charger stops where feasibility drops.",
  },
  {
    n: "03",
    icon: ShieldCheck,
    title: "Automated ESG Carbon Ledger & Telegram Incident Webhook",
    body: "Every run books into a carbon ledger you can export as a green certificate, with live delay alerts pushed to Telegram.",
  },
];

const KPIS: Record<Disruption, { label: string; value: string; hot?: boolean }[]> = {
  normal: [
    { label: "Strategic Reserves (SPR)", value: "9.5 Days" },
    { label: "Import Dependency", value: "87.8% (4.82M bpd Intake)" },
    { label: "Active VLCC Fleet", value: "38 Tankers" },
    { label: "Resilience Index", value: "86 / 100" },
  ],
  hormuz: [
    { label: "Strategic Reserves (SPR)", value: "4.1 Days (Drawdown Active)", hot: true },
    { label: "Import Dependency", value: "87.8% (4.82M bpd Intake)" },
    { label: "Active VLCC Fleet", value: "14 Diverting via Cape", hot: true },
    { label: "Resilience Index", value: "38 / 100", hot: true },
  ],
  redsea: [
    { label: "Strategic Reserves (SPR)", value: "7.2 Days" },
    { label: "Import Dependency", value: "87.8% (4.82M bpd Intake)" },
    { label: "Active VLCC Fleet", value: "38 Tankers" },
    { label: "Resilience Index", value: "64 / 100" },
  ],
};

const SIMS: { id: Disruption; label: string; cls: string }[] = [
  { id: "normal", label: "Normal Flow", cls: "bg-primary text-primary-foreground" },
  {
    id: "hormuz",
    label: "Hormuz Blockade",
    cls: "bg-destructive text-destructive-foreground animate-pulse",
  },
  { id: "redsea", label: "Red Sea Threat", cls: "bg-warn text-background animate-pulse" },
];

function EnergyView() {
  const [disruption, setDisruption] = useState<Disruption>("normal");

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 pb-14">
      <div className="flex flex-wrap gap-2">
        {SIMS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setDisruption(s.id)}
            className={cn(
              "rounded-xl border border-border/70 px-4 py-2 text-xs font-semibold transition-all duration-300",
              disruption === s.id ? s.cls : "bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS[disruption].map((k) => (
          <Card
            key={k.label}
            className={cn(
              "rounded-2xl border-border/70 bg-card/80 shadow-card backdrop-blur transition-all duration-300",
              k.hot && "border-destructive/50",
            )}
          >
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p
                className={cn(
                  "tabular mt-1 text-xl font-bold transition-colors duration-300",
                  k.hot && "text-destructive",
                )}
              >
                {k.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MaritimeMap disruption={disruption} />
        </div>
        <MaritimeOptimizer disruption={disruption} />
      </div>
    </div>
  );
}

function Landing() {
  const [tab, setTab] = useState<"energy" | "fleet">("energy");

  return (
    <div className="pt-6">
      <div className="mx-auto mb-5 flex max-w-7xl gap-2 px-4">
        {(
          [
            ["energy", "⚡ Energy Security (PS1 Target)"],
            ["fleet", "🚛 Domestic Fleet & Freight"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "rounded-xl border border-border/70 px-4 py-2 text-sm font-semibold transition-all duration-300",
              tab === id
                ? "bg-primary text-primary-foreground shadow-card"
                : "bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "energy" ? <EnergyView /> : <FleetView />}
    </div>
  );
}

function FleetView() {

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-[640px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--eco) 55%, transparent), transparent 65%)",
        }}
      />

      <section className="relative mx-auto max-w-5xl px-4 pb-10 pt-14 text-center md:pt-20">
        <span className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-primary/40 bg-eco-soft px-4 py-1.5 text-xs font-semibold text-accent-foreground transition-all duration-300">
          🌱 Next-Gen AI-Driven Green Logistics Engine
        </span>
        <h1 className="animate-fade-in glow-text mt-6 text-balance text-4xl font-extrabold tracking-tight md:text-6xl">
          Smart, Green, Connected Fleet Management
        </h1>
        <p className="animate-fade-in mx-auto mt-4 max-w-2xl text-pretty text-sm text-muted-foreground md:text-base">
          Plan road-accurate corridors across India, bundle shipments automatically and prove every
          gram of CO₂ you avoid.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="rounded-xl transition-all duration-300">
            <Link to="/dashboard">
              Launch Live Cockpit
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-xl transition-all duration-300"
          >
            <Link to="/dispatch">
              <RouteIcon className="size-4" />
              Explore Routing Engine
            </Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-12 sm:grid-cols-2 xl:grid-cols-4">
        {achievements.map((a) => (
          <Card
            key={a.label}
            className="card-lift rounded-2xl border-border/70 bg-card/80 shadow-card backdrop-blur transition-all duration-300"
          >
            <CardContent className="flex items-center gap-3 p-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-eco-soft text-accent-foreground">
                <a.icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="tabular text-xl font-bold">{a.value}</p>
                <p className="truncate text-xs text-muted-foreground">{a.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-center text-2xl font-bold tracking-tight">How it works</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <article
              key={s.n}
              className="card-lift group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-card transition-all duration-300"
            >
              <span className="tabular text-xs font-bold tracking-[0.2em] text-primary">{s.n}</span>
              <span className="mt-3 grid size-10 place-items-center rounded-xl bg-eco-soft text-accent-foreground transition-transform duration-300 group-hover:scale-110">
                <s.icon className="size-5" />
              </span>
              <h3 className="mt-3 text-sm font-semibold">{s.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
