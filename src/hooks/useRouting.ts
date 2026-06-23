import { useState, useEffect } from 'react';
import axios from 'axios';

export const useRouting = (waypoints: [number, number][]) => {
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);

  useEffect(() => {
    const fetchRoute = async () => {
      // Need at least 2 points to route
      if (waypoints.length < 2) {
        setRouteGeoJSON(null);
        setDistance(null);
        setDuration(null);
        return;
      }

      try {
        // Construct string: lon,lat;lon,lat;...
        const coordString = waypoints.map(pt => `${pt[1]},${pt[0]}`).join(';');
        const url = `http://localhost:5000/route/v1/driving/${coordString}?overview=full&geometries=geojson`;
        const response = await axios.get(url);

        if (response.data.code === 'Ok' && response.data.routes.length > 0) {
          const route = response.data.routes[0];
          setDistance(route.distance);
          setDuration(route.duration);
          
          setRouteGeoJSON({
            type: 'Feature',
            properties: {},
            geometry: route.geometry
          });
        } else {
          setRouteGeoJSON(null);
        }
      } catch (error) {
        console.error("Failed to fetch custom route from backend API:", error);
        setRouteGeoJSON(null);
      }
    };

    fetchRoute();
  }, [waypoints]);

  return { routeGeoJSON, distance, duration };
};
