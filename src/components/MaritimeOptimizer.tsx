import { AlertTriangle, FileDown, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import type { Disruption } from "@/components/MaritimeMap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DIRECTIVES: Record<Disruption, { tone: string; text: string }> = {
  hormuz: {
    tone: "border-destructive/50 bg-destructive/10",
    text: "Strait of Hormuz Blocked. Diverting 14 VLCCs via Cape of Good Hope (+14 days). Initiating 1.1M bpd drawdown from Padur and Mangalore Strategic Petroleum Reserve caverns to prevent domestic refinery shortfalls.",
  },
  redsea: {
    tone: "border-warn/50 bg-warn-soft",
    text: "Bab-el-Mandeb risk elevated. Reallocating Mediterranean crude spot orders to West African sweet crude (Bonny Light/Forcados). Freight surcharge: +$1.85/bbl.",
  },
  normal: {
    tone: "border-primary/40 bg-eco-soft",
    text: "Nominal maritime transit. Persian Gulf and Red Sea corridors are fully operational.",
  },
};

const OPTIONS = [
  {
    source: "West African Sweet Crude (Bonny Light)",
    corridor: "Cape Corridor (19 Days)",
    premium: "+$2.10/bbl",
  },
  {
    source: "Russian Urals via Far-East",
    corridor: "Malacca Strait (12 Days)",
    premium: "+$0.95/bbl",
  },
];

export function MaritimeOptimizer({
  disruption = "normal" as Disruption,
}: {
  disruption?: Disruption;
}) {
  const crisis = disruption !== "normal";
  const directive = DIRECTIVES[disruption];

  return (
    <Card className="rounded-2xl border-border/70 bg-card/80 shadow-card backdrop-blur transition-all duration-300">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <CardTitle className="text-base">Adaptive Procurement Orchestrator</CardTitle>
        <Badge variant={crisis ? "destructive" : "secondary"} className="shrink-0">
          {crisis ? "EMERGENCY CONTINGENCY ACTIVE" : "OPTIMAL TRANSIT"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`rounded-xl border p-3 text-xs leading-relaxed transition-all duration-300 ${directive.tone}`}
        >
          <p className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
            {crisis ? (
              <AlertTriangle className="size-3.5" />
            ) : (
              <ShieldCheck className="size-3.5" />
            )}
            AI Directive
          </p>
          {directive.text}
        </div>

        <div className="overflow-hidden rounded-xl border border-border/70">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-2">Alternative Source</th>
                <th className="p-2">Corridor</th>
                <th className="p-2 text-right">Landed Cost</th>
              </tr>
            </thead>
            <tbody>
              {OPTIONS.map((o) => (
                <tr key={o.source} className="border-t border-border/70">
                  <td className="p-2 font-medium">{o.source}</td>
                  <td className="p-2 text-muted-foreground">{o.corridor}</td>
                  <td className="tabular p-2 text-right font-semibold">{o.premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Button
          className="w-full rounded-xl"
          onClick={() =>
            toast.success("Contingency procurement order exported (PDF)", {
              description: crisis
                ? "Cape corridor reroute + SPR drawdown schedule included."
                : "Nominal transit plan archived for audit.",
            })
          }
        >
          <FileDown className="size-4" />
          Export Contingency Procurement Order (PDF)
        </Button>
      </CardContent>
    </Card>
  );
}

export default MaritimeOptimizer;
