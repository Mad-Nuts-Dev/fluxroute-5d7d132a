import { Suspense, lazy, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import type { RouteStop } from "./RouteMapClient";

const RouteMapClient = lazy(() => import("./RouteMapClient"));

function MapFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center gap-2 bg-muted text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      Snapping corridor to real roads…
    </div>
  );
}

export function RouteMap({ stops }: { stops: RouteStop[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <MapFallback />;

  return (
    <Suspense fallback={<MapFallback />}>
      <RouteMapClient stops={stops} />
    </Suspense>
  );
}
