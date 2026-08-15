import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import {
  shipments as seedShipments,
  vehicles as seedVehicles,
  type Shipment,
  type Vehicle,
} from "@/data/fleet";

export type BookingInput = {
  originCity: string;
  originLat: number;
  originLng: number;
  destinationCity: string;
  destinationLat: number;
  destinationLng: number;
  distanceKm: number;
  etaText: string;
  weightKg: number;
  mode: "ev" | "diesel";
  routeLabel: string;
};

type FleetContextValue = {
  vehicles: Vehicle[];
  shipments: Shipment[];
  bookShipment: (input: BookingInput) => { shipmentId: string; vehicleId: string };
};

const FleetContext = createContext<FleetContextValue | null>(null);

function nowTimeline(): Shipment["timeline"] {
  const stamp = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return [
    { label: "Order tendered", time: stamp, done: true },
    { label: "Picked up", time: "Est. +30m", done: false },
    { label: "In transit", time: "Est. +45m", done: false },
    { label: "Out for delivery", time: "Est. arrival window", done: false },
    { label: "Delivered", time: "Pending", done: false },
  ];
}

export function FleetProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(seedVehicles);
  const [shipments, setShipments] = useState<Shipment[]>(seedShipments);
  const [counter, setCounter] = useState(0);

  const bookShipment = useCallback(
    (input: BookingInput) => {
      const seq = counter + 1;
      setCounter(seq);
      const vehicleId = `VH-${String(seedVehicles.length + seq).padStart(2, "0")}`;
      const shipmentId = `SHP-${2100 + seq}`;

      // Park the live marker a touch along the corridor so it reads as moving.
      const lat = input.originLat + (input.destinationLat - input.originLat) * 0.08;
      const lng = input.originLng + (input.destinationLng - input.originLng) * 0.08;

      const vehicle: Vehicle = {
        id: vehicleId,
        name: input.mode === "ev" ? "Tata Ace EV (new)" : "Tata 407 Diesel (new)",
        plate: `IN ${String(10 + seq).slice(0, 2)} FR ${1000 + seq}`,
        type: input.mode === "ev" ? "electric" : "diesel",
        driver: "Auto-assigned pilot",
        ...(input.mode === "ev" ? { battery: 96 } : { fuelLevel: 88 }),
        lat,
        lng,
        city: input.originCity,
        speed: 42,
        origin: { city: input.originCity, lat: input.originLat, lng: input.originLng },
        destination: {
          city: input.destinationCity,
          lat: input.destinationLat,
          lng: input.destinationLng,
        },
        nextStop: input.destinationCity,
        payloadKg: input.weightKg,
      };

      const shipment: Shipment = {
        id: shipmentId,
        destination: input.destinationCity,
        weightKg: input.weightKg,
        distanceKm: Math.round(input.distanceKm),
        status: "in-transit",
        vehicleId,
        eta: input.etaText,
        remainingKm: Math.round(input.distanceKm),
        timeline: nowTimeline(),
      };

      setVehicles((prev) => [...prev, vehicle]);
      setShipments((prev) => [shipment, ...prev]);
      return { shipmentId, vehicleId };
    },
    [counter],
  );

  const value = useMemo(
    () => ({ vehicles, shipments, bookShipment }),
    [vehicles, shipments, bookShipment],
  );

  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>;
}

export function useFleet() {
  const ctx = useContext(FleetContext);
  if (!ctx) throw new Error("useFleet must be used inside <FleetProvider>");
  return ctx;
}
