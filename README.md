# EcoFleet Dispatch

# Context

Build a complete React-based "Smart Eco-Fleet Logistics Platform" optimized for small fleet owners. It must be mobile-responsive, using Shadcn UI and Tailwind CSS. The app will act as a high-fidelity prototype, so it must use a local mock data state. Do not connect to Supabase, Firebase, or any external backend.

# Design & Aesthetic

The tone is modern, premium, clear, and highly functional. 

- Theme: Clean light mode with deep slate/charcoal text for high contrast.

- Accents: Use a vibrant, trusting eco-green for primary actions, badges, and success states.

- Typography: 'Inter' font. 

- UI Elements: Use generous padding, rounded corners (xl), subtle drop shadows on cards, and translucent surfaces for modals. 

# Data Structure (Mock Data)

Initialize a robust mock state containing:

- 4 Vehicles (2 Diesel Trucks, 2 Electric Vehicles with battery percentages).

- 6 active shipments containing realistic Indian cities as destinations, weights (kg), and distances (km).

# Core Layout

Build a persistent, collapsible sidebar navigation with three main tabs:

1. Live Fleet Map (Default View)

2. Dispatch & Routing

3. Analytics & Alerts

# Page 1: Dashboard & Live Map

- Top Row: 3 metric cards using standard icons.

  - Card 1: "Total CO2 Saved Today: 42.8 kg" (Green trend arrow up).

  - Card 2: "EV Fleet Utilization: 75%".

  - Card 3: "Fuel Cost Savings: ₹2,450".

- Main Body: A large, interactive map component using Leaflet.js (react-leaflet). Render the 4 mock vehicles as custom map markers on the map.

- Right Panel: A scrollable list of active shipments with UI status badges (In Transit, Delayed, Delivered).

# Page 2: Dispatch & Routing (The Eco-Engine)

- Create a clean form to assign a new shipment. Inputs needed: Shipment Weight (kg) and Destination Distance (km).

- Primary Button: "Calculate Optimized Route".

- Interaction Logic: When the button is clicked, simulate a calculation state, then show one of two alert banners based on this rule:

  - If Distance <= 150km AND Weight <= 200kg -> Show a green success banner: "Auto-Assigned to Electric Vehicle (Zero Emissions)".

  - If conditions are not met -> Show a slate/orange warning banner: "Assigned to Diesel Fleet (Route exceeds EV capacity)".

- Below the form, display a visual "Before vs. After" comparison card showing estimated CO2 saved (Assume CO2 = Distance * 0.21 kg/km).

# Page 3: Driver Profiles & Alerts

- Display a grid of driver profiles. Each profile card should have an "Eco-Score" progress bar (0-100) indicating their driving efficiency.

- Add a prominent button labeled "Simulate Traffic Delay". 

- Interaction Logic: When clicked, trigger a modal centered on the screen. The modal should be styled to look exactly like a mobile phone lock screen displaying a simulated WhatsApp push notification that reads: "Smart Eco-Fleet Alert: Shipment delayed by 20 mins due to traffic. Live track your package here."

# Guardrails & Instructions

- Location + Behavior: Ensure the map loads cleanly without grey boxes. If Leaflet CSS is missing, ensure it is imported.

- Speak Atomic: Use proper UI vocabulary (cards, badges, modals, tooltips) throughout the build.

- Do not use "Lorem Ipsum". Use real, contextual text for all headers and descriptions.

- Ensure the layout breaks down cleanly on mobile screens (sidebar becomes a hamburger menu).

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://eco-fleet-buddy.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8acfd2e3-dd43-4f49-b50a-0b5f02d66c32).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
