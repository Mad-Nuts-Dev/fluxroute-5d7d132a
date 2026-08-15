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

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Eco-Fleet — AI Green Logistics Engine" },
      {
        name: "description",
        content:
          "Road-snapped multi-stop routing, EV battery-decay modelling and an automated ESG carbon ledger for green fleets.",
      },
      { property: "og:title", content: "Smart Eco-Fleet — AI Green Logistics Engine" },
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

function Landing() {
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
