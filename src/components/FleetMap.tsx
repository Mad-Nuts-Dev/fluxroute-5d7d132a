import { Suspense, lazy, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const FleetMapClient = lazy(() => import("./FleetMapClient"));

function MapFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center gap-2 bg-muted text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      Loading live fleet positions…
    </div>
  );
}

export function FleetMap({
  selectedId = null,
  onSelect = () => {},
}: {
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <MapFallback />;

  return (
    <Suspense fallback={<MapFallback />}>
      <FleetMapClient selectedId={selectedId} onSelect={onSelect} />
    </Suspense>
  );
}
