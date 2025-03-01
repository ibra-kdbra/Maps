import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

interface MapProps {
  start: [number, number];
  end: [number, number];
  zoomTo?: [number, number]; // City search zoomTo
  weatherData?: {
    city: string;
    lat: number;
    lon: number;
    temperature: number;
    description: string;
    icon: string; // Weather condition icon
  };
}

const Map = ({ start, end, zoomTo, weatherData }: MapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const routingControlRef = useRef<L.Routing.Control | null>(null);
  const weatherMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    // Initialize the map
    if (!mapRef.current) {
      mapRef.current = L.map("map").setView(start, 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current);
    }

    // Initialize or update routing control
    if (mapRef.current) {
      if (routingControlRef.current) {
        routingControlRef.current.setWaypoints([
          L.latLng(start[0], start[1]),
          L.latLng(end[0], end[1]),
        ]);
      } else {
        routingControlRef.current = L.Routing.control({
          waypoints: [L.latLng(start[0], start[1]), L.latLng(end[0], end[1])],
          routeWhileDragging: true,
        }).addTo(mapRef.current);
      }
    }

    // Show weather data as a popup on the searched city
    if (weatherData && mapRef.current) {
      // Remove previous marker
      if (weatherMarkerRef.current) {
        weatherMarkerRef.current.remove();
      }

      // Add new weather marker with popup
      weatherMarkerRef.current = L.marker([weatherData.lat, weatherData.lon])
        .addTo(mapRef.current)
        .bindPopup(`
          <div style="text-align:center;">
            <h3 style="margin:0;">${weatherData.city}</h3>
            <p style="margin:4px 0;">${weatherData.description}</p>
            <img src="https:${weatherData.icon}" alt="${weatherData.description}" width="50" height="50"/>
            <p style="margin:0;font-weight:bold;">${weatherData.temperature.toFixed(1)}°C</p>
          </div>
        `)
        .openPopup();
    }

    // Zoom to searched city if provided
    if (zoomTo && mapRef.current) {
      mapRef.current.setView(zoomTo, 12);
    }

    return () => {
      if (routingControlRef.current && mapRef.current) {
        mapRef.current.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
    };
  }, [start, end, zoomTo, weatherData]);

  return <div id="map" style={{ height: "100vh", width: "100%" }} />;
};

export default Map;
