import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import { WeatherData } from "../types";
import { useWeather } from "../hooks/useWeather";

interface MapProps {
  start: [number, number];
  end: [number, number];
  zoomTo: [number, number] | null;
  weatherData: WeatherData | null;
}

const Map = ({ start, end, zoomTo, weatherData }: MapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const routingControlRef = useRef<L.Routing.Control | null>(null);
  const weatherMarkerRef = useRef<L.Marker | null>(null);
  const { fetchWeatherByCoords } = useWeather();

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("map").setView(start, 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current);

      // Add click handler to fetch weather at clicked location
      mapRef.current.on('click', async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        await fetchWeatherByCoords(lat, lng);
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Handle routing updates separately
  useEffect(() => {
    if (mapRef.current && routingControlRef.current) {
      routingControlRef.current.setWaypoints([
        L.latLng(start[0], start[1]),
        L.latLng(end[0], end[1]),
      ]);
    } else if (mapRef.current && !routingControlRef.current) {
      routingControlRef.current = L.Routing.control({
        waypoints: [L.latLng(start[0], start[1]), L.latLng(end[0], end[1])],
        routeWhileDragging: true,
      }).addTo(mapRef.current);
    }
  }, [start, end]);

  // Handle weather marker updates separately
  useEffect(() => {
    if (weatherData && mapRef.current) {
      // Remove previous marker
      if (weatherMarkerRef.current) {
        weatherMarkerRef.current.remove();
      }

      // Create popup content with enhanced weather data
      const popupContent = `
        <div style="text-align:center; min-width: 200px;">
          <h3 style="margin:0;">${weatherData.city}</h3>
          <p style="margin:4px 0;">${weatherData.description}</p>
          <img src="https:${weatherData.icon}" alt="${weatherData.description}" width="50" height="50"/>
          <p style="margin:4px 0;font-weight:bold;font-size:18px;">${weatherData.temperature.toFixed(1)}°C</p>
          <div style="margin:8px 0;">
            <p style="margin:2px 0;"><strong>Wind:</strong> ${weatherData.windSpeed.toFixed(1)} km/h</p>
            <p style="margin:2px 0;"><strong>Humidity:</strong> ${weatherData.humidity}%</p>
            ${weatherData.airQuality ? `<p style="margin:2px 0;"><strong>Air Quality:</strong> ${weatherData.airQuality.description} (${weatherData.airQuality.index})</p>` : ''}
          </div>
          <button id="refresh-weather" style="padding:4px 8px; margin-top:8px; cursor:pointer; background:#007bff; color:white; border:none; border-radius:4px;">Refresh</button>
        </div>
      `;

      // Add new weather marker with popup
      weatherMarkerRef.current = L.marker([weatherData.lat, weatherData.lon])
        .addTo(mapRef.current)
        .bindPopup(popupContent)
        .openPopup();

      // Add refresh button handler
      weatherMarkerRef.current.on('popupopen', () => {
        const refreshBtn = document.getElementById('refresh-weather');
        if (refreshBtn) {
          // Remove previous event listeners
          const newBtn = refreshBtn.cloneNode(true);
          refreshBtn.parentNode?.replaceChild(newBtn, refreshBtn);

          newBtn.addEventListener('click', async () => {
            await fetchWeatherByCoords(weatherData.lat, weatherData.lon);
          });
        }
      });
    }
  }, [weatherData]);

  // Handle zoom updates separately
  useEffect(() => {
    if (zoomTo && mapRef.current) {
      mapRef.current.setView(zoomTo, 12);
    }
  }, [zoomTo]);

  return <div id="map" style={{ height: "100vh", width: "100%" }} />;
};

export default Map;
