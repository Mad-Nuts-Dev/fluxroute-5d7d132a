<div align="center">
  <img src="https://github.com/Mad-Nuts-Dev/fluxroute-5d7d132a/raw/main/src/Gemini_Generated_Image_6mwaue6mwaue6mwa.png" alt="FluxRoute Banner" width="100%" style="border-radius: 12px;"/>

  # 🌿 FluxRoute: Green Logistics AI
  ### **Smart Fleet Coordination and Logistics Management Platform**
  
  *“Right Vehicle • Right Route • Right Shipment”*

  [![Smart India Hackathon 2026](https://img.shields.io/badge/SIH-2026-orange.svg)]()
  [![Category: Software](https://img.shields.io/badge/Category-Software-blue.svg)]()
  [![Live Demo](https://img.shields.io/badge/Live-MVP_Preview-success.svg)](https://fluxroute.lovable.app)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
</div>

---

## 🚀 Overview

**FluxRoute** is an AI-powered, end-to-end green logistics and fleet coordination platform engineered to tackle rising fuel costs, inefficient vehicle utilization, and carbon emissions in freight transport. Built specifically for modern logistics operators, FluxRoute uses multi-objective route optimization, automated EV suitability matching, and real-time telemetry to ensure every delivery is fast, cost-efficient, and sustainable.

Developed for **Smart India Hackathon 2026 (Software Edition)** by Team **HEXA NEURONS**.

---

## ✨ Key Features & Modules

### 1. 🗺️ Live Fleet Map & Telemetry Dashboard
* **Real-Time Visibility:** Interactive map interface tracking active fleet positions across realistic Indian transport corridors (e.g., Bengaluru to Hyderabad via NH 44).
* **Dynamic Route Geometry:** Replaces old straight-line tracking with actual highway-snapped routing paths.
* **Live Telemetry Popups:** Inspect active vehicle speeds, battery percentages (for EVs), fuel levels, and current shipment ETAs instantly[cite: 2].

### 2. ⚡ Dispatch & Routing Eco-Engine
* **Pan-India Google Places Search:** Restrictive location search built for Indian cities, hubs, and industrial zones[cite: 2].
* **Dynamic Stopover Waypoints:** Add intermediate drop-off cities with individual payload tracking on the fly[cite: 2].
* **Dual-Corridor Comparison:** Simultaneously compute and render two distinct paths on the map:
  * 🔵 **Fastest Route:** Optimized for minimum transit time.
  * 🟢 **Eco-Friendly Highway Bypass:** Optimized for minimum $\text{CO}_2$ emissions.
* **Smart EV vs. Diesel Matching:** Intelligent payload and distance validation that automatically assigns light shipments under optimal thresholds to zero-emission electric vehicles[cite: 2].

### 3. 📊 Analytics, Alerts & ESG Compliance
* **Driver Eco-Scores:** Efficiency progress tracking (0–100 scale) for driver performance coaching.
* **Automated ESG Reporting:** Generates certified $\text{CO}_2$ emission tracking reports per shipment to fulfill corporate sustainability mandates.
* **Simulated Push Alerts:** Interactive simulation showcasing real-time traffic delay notifications delivered via WhatsApp/Telegram notification overlays[cite: 2].

---

## 🛠️ Technology Stack

* **Frontend Framework:** React, Vite, TypeScript, Tailwind CSS
* **UI Components:** Shadcn UI, Radix UI, Lucide Icons
* **Mapping & Routing:** Google Maps JavaScript API (`@react-google-maps/api`), Google Directions Service with Waypoints, and OSRM (Open Source Routing Machine) road-snapping geometry.
* **State Management:** Local mock state architecture for instantaneous high-fidelity prototyping and demo reliability.
* **Notifications:** Telegram Bot API integration for real-time fleet operations alerts.

---

## 📈 Impact & Business Viability

* **Environmental Impact:** Directly cuts urban carbon footprints through precise $\text{CO}_2$ tracking per kilometer and automated EV fleet promotion[cite: 2].
* **Economic Savings:** Achieves up to **15–20% reduction in fuel consumption** while eliminating empty return trips (*deadhead miles*) through smart backhaul matching[cite: 2].
* **Commercial Model:** B2B SaaS subscription structured with tiered pricing based on fleet size, paired with enterprise analytics modules[cite: 2].

---

## 🏃‍♂️ Getting Started Locally

If you prefer running or testing the application locally on your machine, follow these steps:

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18 or higher) and `npm` installed.

### Installation Steps

1. **Clone the repository:**
   
   ```bash
   git clone [https://github.com/Mad-Nuts-Dev/fluxroute-5d7d132a.git](https://github.com/Mad-Nuts-Dev/fluxroute-5d7d132a.git)
   
3. Navigate to the project directory:
   
   ```bash
   cd fluxroute-5d7d132a
   
4. Install dependencies:
   
   ```bash
   npm install
   
5. Run the development server:
   
   ```bash
   npm run dev
   
6. Open your browser and navigate to http://localhost:5173 to view the local prototype. 

🌐 Live Prototype
Explore the fully interactive hosted application live:
👉 www.fluxroute.lovable.app



👥 Team Information
Team Name: HEXA NEURONS

Competition: Smart India Hackathon 2026 (SIH)

Problem Statement ID: Software PS-2

Problem Title: Smart Fleet Coordination and Logistics Management Platform

📝 License
This project is open-source and available under the MIT License.
