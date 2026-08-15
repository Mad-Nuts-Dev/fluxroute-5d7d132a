export type VehicleType = "diesel" | "electric";

export type LatLng = { lat: number; lng: number };

export type Vehicle = {
  id: string;
  name: string;
  plate: string;
  type: VehicleType;
  driver: string;
  battery?: number;
  fuelLevel?: number;
  lat: number;
  lng: number;
  city: string;
  speed: number;
  origin: { city: string } & LatLng;
  destination: { city: string } & LatLng;
  nextStop: string;
  payloadKg: number;
};

export type ShipmentStatus = "in-transit" | "delayed" | "delivered";

export type TimelineStep = {
  label: string;
  time: string;
  done: boolean;
};

export type Shipment = {
  id: string;
  destination: string;
  weightKg: number;
  distanceKm: number;
  status: ShipmentStatus;
  vehicleId: string;
  eta: string;
  remainingKm: number;
  timeline: TimelineStep[];
};

export type Driver = {
  id: string;
  name: string;
  initials: string;
  vehicle: string;
  ecoScore: number;
  tripsThisWeek: number;
  city: string;
};

export const vehicles: Vehicle[] = [
  {
    id: "VH-01",
    name: "Tata Ace EV",
    plate: "MH 12 EV 4410",
    type: "electric",
    driver: "Rahul Deshmukh",
    battery: 78,
    lat: 19.076,
    lng: 72.8777,
    city: "Mumbai",
    speed: 34,
    origin: { city: "Mumbai", lat: 19.076, lng: 72.8777 },
    destination: { city: "Pune", lat: 18.5204, lng: 73.8567 },
    nextStop: "Lonavala hub",
    payloadKg: 820,
  },
  {
    id: "VH-02",
    name: "Mahindra Treo Zor",
    plate: "DL 3C EV 8821",
    type: "electric",
    driver: "Neha Kulkarni",
    battery: 41,
    lat: 28.6139,
    lng: 77.209,
    city: "New Delhi",
    speed: 22,
    origin: { city: "New Delhi", lat: 28.6139, lng: 77.209 },
    destination: { city: "Noida", lat: 28.5355, lng: 77.391 },
    nextStop: "Noida Sector 62",
    payloadKg: 640,
  },
  {
    id: "VH-03",
    name: "Tata 407 Diesel",
    plate: "KA 05 AB 1290",
    type: "diesel",
    driver: "Imran Sheikh",
    fuelLevel: 62,
    lat: 12.9716,
    lng: 77.5946,
    city: "Bengaluru",
    speed: 51,
    origin: { city: "Bengaluru", lat: 12.9716, lng: 77.5946 },
    destination: { city: "Hyderabad", lat: 17.385, lng: 78.4867 },
    nextStop: "Anantapur checkpoint",
    payloadKg: 1450,
  },
  {
    id: "VH-04",
    name: "Ashok Leyland Dost",
    plate: "GJ 01 HK 7702",
    type: "diesel",
    driver: "Sandeep Yadav",
    fuelLevel: 28,
    lat: 23.0225,
    lng: 72.5714,
    city: "Ahmedabad",
    speed: 47,
    origin: { city: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
    destination: { city: "Surat", lat: 21.1702, lng: 72.8311 },
    nextStop: "Bharuch toll plaza",
    payloadKg: 1180,
  },
];

function timeline(status: ShipmentStatus): TimelineStep[] {
  const delivered = status === "delivered";
  return [
    { label: "Order tendered", time: "Wed 18:20", done: true },
    { label: "Picked up", time: "Thu 05:12", done: true },
    { label: "In transit", time: "Thu 05:40", done: true },
    {
      label: "Out for delivery",
      time: delivered ? "Thu 10:20" : "Est. 15:50",
      done: delivered,
    },
    {
      label: "Delivered",
      time: delivered ? "Thu 11:05" : "Est. 16:42",
      done: delivered,
    },
  ];
}

export const shipments: Shipment[] = [
  {
    id: "SHP-2041",
    destination: "Pune, Maharashtra",
    weightKg: 180,
    distanceKm: 148,
    status: "in-transit",
    vehicleId: "VH-01",
    eta: "Today, 4:30 PM",
    remainingKm: 148,
    timeline: timeline("in-transit"),
  },
  {
    id: "SHP-2042",
    destination: "Noida, Uttar Pradesh",
    weightKg: 95,
    distanceKm: 38,
    status: "delivered",
    vehicleId: "VH-02",
    eta: "Delivered 11:05 AM",
    remainingKm: 0,
    timeline: timeline("delivered"),
  },
  {
    id: "SHP-2043",
    destination: "Hyderabad, Telangana",
    weightKg: 640,
    distanceKm: 575,
    status: "delayed",
    vehicleId: "VH-03",
    eta: "Tomorrow, 9:15 AM",
    remainingKm: 402,
    timeline: timeline("delayed"),
  },
  {
    id: "SHP-2044",
    destination: "Surat, Gujarat",
    weightKg: 420,
    distanceKm: 265,
    status: "in-transit",
    vehicleId: "VH-04",
    eta: "Today, 8:45 PM",
    remainingKm: 190,
    timeline: timeline("in-transit"),
  },
  {
    id: "SHP-2045",
    destination: "Nashik, Maharashtra",
    weightKg: 120,
    distanceKm: 166,
    status: "in-transit",
    vehicleId: "VH-01",
    eta: "Today, 7:10 PM",
    remainingKm: 121,
    timeline: timeline("in-transit"),
  },
  {
    id: "SHP-2046",
    destination: "Mysuru, Karnataka",
    weightKg: 310,
    distanceKm: 144,
    status: "delayed",
    vehicleId: "VH-03",
    eta: "Today, 10:40 PM",
    remainingKm: 96,
    timeline: timeline("delayed"),
  },
];

export const drivers: Driver[] = [
  {
    id: "DRV-01",
    name: "Rahul Deshmukh",
    initials: "RD",
    vehicle: "Tata Ace EV · MH 12 EV 4410",
    ecoScore: 92,
    tripsThisWeek: 14,
    city: "Mumbai",
  },
  {
    id: "DRV-02",
    name: "Neha Kulkarni",
    initials: "NK",
    vehicle: "Mahindra Treo Zor · DL 3C EV 8821",
    ecoScore: 87,
    tripsThisWeek: 11,
    city: "New Delhi",
  },
  {
    id: "DRV-03",
    name: "Imran Sheikh",
    initials: "IS",
    vehicle: "Tata 407 Diesel · KA 05 AB 1290",
    ecoScore: 64,
    tripsThisWeek: 9,
    city: "Bengaluru",
  },
  {
    id: "DRV-04",
    name: "Sandeep Yadav",
    initials: "SY",
    vehicle: "Ashok Leyland Dost · GJ 01 HK 7702",
    ecoScore: 48,
    tripsThisWeek: 12,
    city: "Ahmedabad",
  },
];

export const statusLabels: Record<ShipmentStatus, string> = {
  "in-transit": "In Transit",
  delayed: "Delayed",
  delivered: "Delivered",
};

export const CO2_PER_KM = 0.21;
