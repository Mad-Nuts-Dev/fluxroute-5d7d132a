import { Autocomplete } from "@react-google-maps/api";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import type { RoutePoint } from "@/components/RouteMap";
import { INDIA_BOUNDS } from "@/lib/maps";

export function CityAutocomplete({
  id,
  value,
  placeholder,
  onTextChange,
  onSelect,
}: {
  id: string;
  value: string;
  placeholder: string;
  onTextChange: (text: string) => void;
  onSelect: (point: RoutePoint) => void;
}) {
  const [ac, setAc] = useState<google.maps.places.Autocomplete | null>(null);

  function handlePlaceChanged() {
    const place = ac?.getPlace();
    const loc = place?.geometry?.location;
    if (!place || !loc) return;
    const label = place.name || place.formatted_address || value;
    onSelect({ lat: loc.lat(), lng: loc.lng(), label });
  }

  return (
    <Autocomplete
      onLoad={setAc}
      onPlaceChanged={handlePlaceChanged}
      options={{
        componentRestrictions: { country: "in" },
        fields: ["name", "formatted_address", "geometry.location"],
        bounds: INDIA_BOUNDS,
        strictBounds: false,
      }}
    >
      <Input
        id={id}
        value={value}
        maxLength={80}
        placeholder={placeholder}
        onChange={(e) => onTextChange(e.target.value)}
        autoComplete="off"
      />
    </Autocomplete>
  );
}
