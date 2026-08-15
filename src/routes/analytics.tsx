import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BellRing, Gauge, Loader2, MapPin, MessageCircle, Send, Signal, Wifi, Battery, FileDown } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { drivers } from "@/data/fleet";
import { sendDelayAlert } from "@/lib/telegram.functions";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics & Alerts — FluxRoute: Green Logistics AI" },
      {
        name: "description",
        content:
          "Review driver eco-scores and simulate customer delay alerts before they reach the road.",
      },
      { property: "og:title", content: "Analytics & Alerts — FluxRoute: Green Logistics AI" },
      {
        property: "og:description",
        content: "Driver eco-scores, efficiency coaching and simulated traffic delay notifications.",
      },
    ],
  }),
  component: AnalyticsPage,
});

function scoreTone(score: number) {
  if (score >= 85) return { label: "Excellent", cls: "bg-eco-soft text-accent-foreground" };
  if (score >= 65) return { label: "Steady", cls: "bg-secondary text-secondary-foreground" };
  return { label: "Needs coaching", cls: "bg-warn-soft text-foreground" };
}

function downloadEsgCertificate() {
  const now = new Date();
  const totalTrips = drivers.reduce((a, d) => a + d.tripsThisWeek, 0);
  const avgScore = Math.round(drivers.reduce((a, d) => a + d.ecoScore, 0) / drivers.length);
  const offsetKg = (totalTrips * 3.42).toFixed(1);
  const rows = [
    ["FluxRoute: Green Logistics AI — ESG Green Certificate"],
    ["Generated", now.toISOString()],
    ["Reporting period", "Current week"],
    ["Total trips", String(totalTrips)],
    ["Fleet average eco-score", `${avgScore}/100`],
    ["Estimated CO2 offset (kg)", offsetKg],
    ["Methodology", "0.21 kg CO2/km diesel baseline vs EV/eco-corridor actuals"],
    [],
    ["Driver", "Vehicle", "Eco-score", "Trips"],
    ...drivers.map((d) => [d.name, d.vehicle, String(d.ecoScore), String(d.tripsThisWeek)]),
  ];
  const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `esg-green-certificate-${now.toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("ESG Green Certificate downloaded");
}

function AnalyticsPage() {
  const [alertOpen, setAlertOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [minutes, setMinutes] = useState("20");
  const [chatId, setChatId] = useState("1419099842");
  const [token, setToken] = useState("");
  const [sending, setSending] = useState(false);

  const delayMinutes = Math.min(Math.max(Number(minutes) || 0, 1), 600);

  async function handleSend() {
    setSending(true);
    try {
      const res = await sendDelayAlert({
        data: {
          minutes: delayMinutes,
          chatId: chatId.trim() || undefined,
          token: token.trim() || undefined,
        },
      });
      if (res.ok) {
        toast.success(`Telegram alert sent — ${delayMinutes} min delay`);
      } else {
        toast.error(`Telegram alert failed: ${res.error}`);
      }
    } catch {
      toast.error("Could not reach the alert service.");
    } finally {
      setSending(false);
      setComposeOpen(false);
      setAlertOpen(true);
    }
  }

  return (
    <div className="space-y-5 p-4 md:p-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight md:text-2xl">
            Analytics &amp; Alerts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Driver efficiency scores and customer-facing delay notifications.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            variant="outline"
            className="rounded-xl transition-all duration-300"
            onClick={downloadEsgCertificate}
          >
            <FileDown className="size-4" />
            Download ESG Green Certificate
          </Button>
          <Button
            className="rounded-xl transition-all duration-300"
            onClick={() => setComposeOpen(true)}
          >
            <BellRing className="size-4" />
            Simulate Traffic Delay
          </Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {drivers.map((driver) => {
          const tone = scoreTone(driver.ecoScore);
          return (
            <Card key={driver.id} className="card-lift rounded-xl border-border/70 shadow-card transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-10 shrink-0">
                    <AvatarFallback className="bg-eco-soft text-sm font-semibold text-accent-foreground">
                      {driver.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">{driver.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 truncate">
                      <MapPin className="size-3 shrink-0" />
                      {driver.city}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="truncate text-xs text-muted-foreground">{driver.vehicle}</p>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <Gauge className="size-3.5" />
                      Eco-Score
                    </span>
                    <span className="text-sm font-bold">{driver.ecoScore}/100</span>
                  </div>
                  <Progress value={driver.ecoScore} className="mt-2 h-2" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className={`rounded-full border-transparent ${tone.cls}`}>
                    {tone.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {driver.tripsThisWeek} trips this week
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card className="card-lift rounded-xl border-border/70 shadow-card transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-base">How eco-scores are calculated</CardTitle>
          <CardDescription>
            Harsh braking, idling time, over-speeding and regenerative braking use are blended into a
            single 0–100 efficiency score per driver.
          </CardDescription>
        </CardHeader>
      </Card>

      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-[92vw] rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Send delay alert</DialogTitle>
            <DialogDescription>
              We notify the customer on Telegram and show the lock-screen preview.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delay">Enter Delay Time in Minutes:</Label>
              <Input
                id="delay"
                type="number"
                min={1}
                max={600}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chat">Telegram Chat ID</Label>
              <Input
                id="chat"
                value={chatId}
                maxLength={64}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="1419099842"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token">Bot token override (optional)</Label>
              <Input
                id="token"
                value={token}
                maxLength={200}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Leave blank to use the stored bot token"
              />
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full rounded-xl" onClick={handleSend} disabled={sending}>
              {sending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Send Alert
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
        <DialogContent
          className="w-[330px] max-w-[92vw] overflow-hidden rounded-[2.5rem] border-4 border-foreground/80 bg-foreground/90 p-0 shadow-float backdrop-blur-xl [&>button]:text-background/70"
        >

          <DialogTitle className="sr-only">Simulated delay notification</DialogTitle>
          <div className="relative h-[560px] bg-gradient-to-b from-foreground via-foreground to-secondary-foreground p-4">
            <div className="flex items-center justify-between text-[11px] font-medium text-background/80">
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <Signal className="size-3" />
                <Wifi className="size-3" />
                <Battery className="size-3" />
              </div>
            </div>

            <div className="mt-10 text-center text-background">
              <p className="text-5xl font-semibold tracking-tight">2:14</p>
              <p className="mt-1 text-sm text-background/70">Thursday, 13 August</p>
            </div>

            <div className="mt-8 rounded-2xl border border-background/15 bg-background/85 p-3 shadow-float backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <MessageCircle className="size-4" />
                </span>
                <p className="min-w-0 flex-1 truncate text-xs font-semibold">WhatsApp</p>
                <span className="shrink-0 text-[10px] text-muted-foreground">now</span>
              </div>
              <p className="mt-2 text-xs font-semibold">FluxRoute Alert</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                ⚠️ Shipment delayed by {delayMinutes} mins due to heavy traffic. Live tracking link:
                eco-fleet-buddy.lovable.app
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Sent to Telegram chat {chatId || "—"}
              </p>
            </div>

            <div className="absolute inset-x-4 bottom-5 text-center">
              <p className="text-[11px] text-background/60">Swipe up to open · Simulated preview</p>
              <Button
                variant="secondary"
                className="mt-3 w-full rounded-xl"
                onClick={() => setAlertOpen(false)}
              >
                Dismiss alert
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
