import { useEffect, useState } from "react";

/** Places is needed for the Pan-India city Autocomplete inputs. */
export const GOOGLE_MAPS_LIBRARIES: "places"[] = ["places"];

export const GOOGLE_MAPS_BROWSER_KEY = (import.meta.env[
  "VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"
] ?? "") as string;

export const INDIA_CENTER = { lat: 21.5, lng: 78.5 };

export const INDIA_BOUNDS = {
  north: 35.6,
  south: 6.5,
  west: 68.0,
  east: 97.5,
};

/** Night-mode styling array applied whenever the app theme is dark. */
export const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0f1b17" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f1b17" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#7d9d92" }] },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#1d2f28" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#b7cfc6" }],
  },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1b2b25" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6f8d83" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#24413a" }],
  },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#08110e" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3f5c53" }],
  },
];

export const LIGHT_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

/** Tracks the `dark` class that ThemeToggle writes onto <html>. */
export function useIsDarkTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setDark(root.classList.contains("dark"));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return dark;
}

export function mapOptions(dark: boolean, extra?: google.maps.MapOptions): google.maps.MapOptions {
  return {
    styles: dark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE,
    disableDefaultUI: false,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    backgroundColor: dark ? "#0f1b17" : "#eef3f0",
    ...extra,
  };
}
