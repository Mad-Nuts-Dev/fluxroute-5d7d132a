import { Badge } from "@/components/ui/badge";
import { statusLabels, type ShipmentStatus } from "@/data/fleet";
import { cn } from "@/lib/utils";

const styles: Record<ShipmentStatus, string> = {
  "in-transit": "bg-eco-soft text-accent-foreground border-transparent",
  delayed: "bg-warn-soft text-foreground border-transparent",
  delivered: "bg-secondary text-secondary-foreground border-transparent",
};

export function ShipmentBadge({ status }: { status: ShipmentStatus }) {
  return (
    <Badge variant="outline" className={cn("rounded-full px-2.5 py-0.5", styles[status])}>
      {statusLabels[status]}
    </Badge>
  );
}
