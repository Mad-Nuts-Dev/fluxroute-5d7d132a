import { Check, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { statusLabels, type Shipment } from "@/data/fleet";
import { cn } from "@/lib/utils";

export function OrderHistoryDialog({
  shipment,
  onOpenChange,
}: {
  shipment: Shipment | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!shipment} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[92vw] rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Order Status &amp; History</DialogTitle>
        </DialogHeader>

        {shipment && (
          <div className="space-y-5">
            <div className="rounded-xl bg-foreground p-4 text-background">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-background/60">
                Current status
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold">
                <MapPin className="size-4 text-primary" />
                {shipment.status === "delivered"
                  ? "Delivered — 0 km out"
                  : `${statusLabels[shipment.status]} — ${shipment.remainingKm} km out`}
              </p>
              <p className="mt-1 text-xs text-background/60">
                {shipment.id} · {shipment.destination} · {shipment.eta}
              </p>
            </div>

            <ol className="relative space-y-5 pl-1">
              {shipment.timeline.map((step, i) => (
                <li key={step.label} className="relative flex gap-3">
                  {i < shipment.timeline.length - 1 && (
                    <span
                      className={cn(
                        "absolute left-[11px] top-6 h-[calc(100%+0.4rem)] w-px",
                        step.done ? "bg-primary/60" : "bg-border",
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      "z-10 grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors",
                      step.done
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background",
                    )}
                  >
                    {step.done && <Check className="size-3.5" />}
                  </span>
                  <div className="min-w-0 pb-0.5">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        step.done ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.time}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        <DialogFooter>
          <Button variant="secondary" className="w-full rounded-xl" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
