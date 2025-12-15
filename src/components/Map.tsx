import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import { WeatherData } from "../types";
import { useWeather } from "../hooks/useWeather";
import { useMapStore } from "../store/mapStore";

// Google Maps-style marker icons
const createGoogleMapsIcon = (color: string) => {
  return L.divIcon({
    html: `
      <div style="
        position: relative;
        width: 32px;
        height: 32px;
      ">
        <!-- Shadow -->
        <div style="
          position: absolute;
          top: 24px;
          left: 8px;
          width: 16px;
          height: 8px;
          background: rgba(0,0,0,0.2);
          border-radius: 50%;
          filter: blur(1px);
        "></div>
        <!-- Pin -->
        <svg width="32" height="32" viewBox="0 0 32 32" style="position: absolute; top: 0; left: 0;">
          <path d="M16 2C11.6 2 8 5.6 8 10c0 7.4 6.6 14.8 7.4 15.7.4.4 1.2.4 1.6 0C17.4 24.8 24 17.4 24 10c0-4.4-3.6-8-8-8z" fill="${color}" stroke="white" stroke-width="2"/>
          <circle cx="16" cy="10" r="4" fill="white"/>
        </svg>
      </div>
    `,
    className: 'custom-google-maps-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const weatherIcon = createGoogleMapsIcon('#4285F4'); // Google Blue

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
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const { fetchWeatherByCoords } = useWeather();
  const { currentLayer, availableLayers } = useMapStore();

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("map", {
        zoomControl: true, // Keep zoom controls
      }).setView(start, 13);

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

  // Handle layer switching
  useEffect(() => {
    if (mapRef.current) {
      // Remove existing tile layer
      if (tileLayerRef.current) {
        mapRef.current.removeLayer(tileLayerRef.current);
      }

      // Find the selected layer
      const selectedLayer = availableLayers.find(layer => layer.id === currentLayer);
      if (selectedLayer) {
        // Create and add new tile layer
        tileLayerRef.current = L.tileLayer(selectedLayer.url, {
          attribution: selectedLayer.attribution,
        }).addTo(mapRef.current);
      }
    }
  }, [currentLayer, availableLayers]);

  // Handle routing updates separately
  useEffect(() => {
    if (mapRef.current) {
      // Remove existing routing control if it exists
      if (routingControlRef.current) {
        mapRef.current.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }

      // Create new routing control with updated waypoints
      routingControlRef.current = L.Routing.control({
        waypoints: [L.latLng(start[0], start[1]), L.latLng(end[0], end[1])],
        routeWhileDragging: true,
        addWaypoints: false, // Disable adding waypoints
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

      // Create Google Maps-style weather card popup
      const popupContent = `
        <div style="font-family: 'Roboto', sans-serif; min-width: 280px; max-width: 320px;">
          <!-- Header -->
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <div style="flex: 1;">
              <h3 style="margin: 0; font-size: 18px; font-weight: 500; color: #202124;">${weatherData.city}</h3>
              <p style="margin: 2px 0 0 0; font-size: 14px; color: #5f6368;">${weatherData.description}</p>
            </div>
            <img src="https:${weatherData.icon}" alt="${weatherData.description}" style="width: 48px; height: 48px; margin-left: 8px;"/>
          </div>

          <!-- Temperature -->
          <div style="display: flex; align-items: baseline; margin-bottom: 16px;">
            <span style="font-size: 32px; font-weight: 300; color: #202124;">${weatherData.temperature.toFixed(0)}°</span>
            <span style="font-size: 16px; color: #5f6368; margin-left: 4px;">C</span>
          </div>

          <!-- Weather Details -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
            <div style="display: flex; align-items: center;">
              <svg width="20" height="20" viewBox="0 0 24 24" style="margin-right: 8px; color: #5f6368;">
                <path fill="currentColor" d="M12 2L13.09 8.26L19 9L13.09 9.74L12 16L10.91 9.74L5 9L10.91 8.26L12 2Z"/>
              </svg>
              <div>
                <div style="font-size: 12px; color: #5f6368; text-transform: uppercase; letter-spacing: 0.5px;">Wind</div>
                <div style="font-size: 14px; font-weight: 500; color: #202124;">${weatherData.windSpeed.toFixed(1)} km/h</div>
              </div>
            </div>
            <div style="display: flex; align-items: center;">
              <svg width="20" height="20" viewBox="0 0 24 24" style="margin-right: 8px; color: #5f6368;">
                <path fill="currentColor" d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L19 6.6C18.8 6 18.5 5.4 18.1 4.9L19 3L17 1L15.4 1.9C14.9 1.5 14.3 1.2 13.7 1L13.3 0H11.3L10.9 1C10.3 1.2 9.7 1.5 9.2 1.9L7.6 1L5.6 3L6.5 4.9C6.1 5.4 5.8 6 5.6 6.6L4 7V9L5.6 9.4C5.8 10 6.1 10.6 6.5 11.1L5.6 13L7.6 15L9.2 14.1C9.7 14.5 10.3 14.8 10.9 15L11.3 16H13.3L13.7 15C14.3 14.8 14.9 14.5 15.4 14.1L17 15L19 13L18.1 11.1C18.5 10.6 18.8 10 19 9.4L21 9ZM12 8C13.66 8 15 9.34 15 11C15 12.66 13.66 14 12 14C10.34 14 9 12.66 9 11C9 9.34 10.34 8 12 8Z"/>
              </svg>
              <div>
                <div style="font-size: 12px; color: #5f6368; text-transform: uppercase; letter-spacing: 0.5px;">Humidity</div>
                <div style="font-size: 14px; font-weight: 500; color: #202124;">${weatherData.humidity}%</div>
              </div>
            </div>
          </div>

          ${weatherData.airQuality ? `
          <!-- Air Quality -->
          <div style="display: flex; align-items: center; padding: 8px 12px; background-color: #f8f9fa; border-radius: 8px; margin-bottom: 16px;">
            <svg width="20" height="20" viewBox="0 0 24 24" style="margin-right: 8px; color: #5f6368;">
              <path fill="currentColor" d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L19 6.6C18.8 6 18.5 5.4 18.1 4.9L19 3L17 1L15.4 1.9C14.9 1.5 14.3 1.2 13.7 1L13.3 0H11.3L10.9 1C10.3 1.2 9.7 1.5 9.2 1.9L7.6 1L5.6 3L6.5 4.9C6.1 5.4 5.8 6 5.6 6.6L4 7V9L5.6 9.4C5.8 10 6.1 10.6 6.5 11.1L5.6 13L7.6 15L9.2 14.1C9.7 14.5 10.3 14.8 10.9 15L11.3 16H13.3L13.7 15C14.3 14.8 14.9 14.5 15.4 14.1L17 15L19 13L18.1 11.1C18.5 10.6 18.8 10 19 9.4L21 9ZM12 8C13.66 8 15 9.34 15 11C15 12.66 13.66 14 12 14C10.34 14 9 12.66 9 11C9 9.34 10.34 8 12 8Z"/>
            </svg>
            <div style="flex: 1;">
              <div style="font-size: 12px; color: #5f6368; text-transform: uppercase; letter-spacing: 0.5px;">Air Quality</div>
              <div style="font-size: 14px; font-weight: 500; color: #202124;">${weatherData.airQuality.description}</div>
            </div>
            <div style="font-size: 16px; font-weight: 500; color: #4285F4;">${weatherData.airQuality.index}</div>
          </div>
          ` : ''}

          <!-- Refresh Button -->
          <button id="refresh-weather" style="
            width: 100%;
            padding: 10px 16px;
            background-color: #4285F4;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            font-family: 'Roboto', sans-serif;
            cursor: pointer;
            transition: background-color 0.2s;
          ">
            Refresh
          </button>
        </div>
      `;

      // Add new weather marker with popup
      weatherMarkerRef.current = L.marker([weatherData.lat, weatherData.lon], {
        icon: weatherIcon
      })
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
