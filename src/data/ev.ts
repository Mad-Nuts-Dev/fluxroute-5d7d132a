/** EV elevation / temperature / payload battery-decay model. */
export type BatteryModel = {
  consumption: number; // kWh per km
  usableKwh: number;
  rangeKm: number;
  feasibility: number; // 0-100 for the given distance
  chargers: number;
  chargerCity: string;
  ambientC: number;
  gradient: number;
};

const CHARGER_CITIES = ["Behror", "Manesar", "Vadodara", "Chitradurga"];

export function batteryModel({
  distanceKm,
  payloadKg,
  ambientC = 42,
  gradient = 1.8,
  usableKwh = 62,
}: {
  distanceKm: number;
  payloadKg: number;
  ambientC?: number;
  gradient?: number;
  usableKwh?: number;
}): BatteryModel {
  const base = 0.19;
  const payloadPenalty = (payloadKg / 1000) * 0.06;
  const heatPenalty = Math.max(ambientC - 30, 0) * 0.004;
  const gradePenalty = Math.max(gradient, 0) * 0.012;
  const consumption = Number((base + payloadPenalty + heatPenalty + gradePenalty).toFixed(3));
  const rangeKm = usableKwh / consumption;
  const feasibility = Math.max(
    0,
    Math.min(100, distanceKm > 0 ? (rangeKm / distanceKm) * 100 : 100),
  );
  const chargers = distanceKm > rangeKm ? Math.ceil(distanceKm / rangeKm) - 1 : 0;

  return {
    consumption,
    usableKwh,
    rangeKm,
    feasibility,
    chargers,
    chargerCity: CHARGER_CITIES[Math.min(chargers, CHARGER_CITIES.length - 1)] ?? "Behror",
    ambientC,
    gradient,
  };
}

/** Anti-deadheading backhaul suggestions keyed by drop city. */
export function backhaulMatch(from: string, to: string) {
  const seed = (from.length * 37 + to.length * 11) % 5;
  const loads = [220, 180, 340, 260, 410];
  return {
    weightKg: loads[seed] ?? 220,
    city: to || "Delhi",
    returnTo: from || "Jaipur",
  };
}
