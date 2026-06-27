import { useState, useEffect } from 'react';
import axios from 'axios';
import { useMapStore } from '../store/mapStore';

const getGatewayUrl = (path: string) => {
  const hostname = window.location.hostname;
  return `http://${hostname}:8000${path}`;
};

export const useRouting = (waypoints: [number, number][]) => {
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  
  const routingProfile = useMapStore(state => state.routingProfile);
  const setPricing = useMapStore(state => state.setPricing);

  useEffect(() => {
    const fetchRoute = async () => {
      // Need at least 2 points to route
      if (waypoints.length < 2) {
        setRouteGeoJSON(null);
        setDistance(null);
        setDuration(null);
        setPricing(null);
        return;
      }

      try {
        // Construct string: lon,lat;lon,lat;...
        const coordString = waypoints.map(pt => `${pt[1]},${pt[0]}`).join(';');
        // Request directly from gateway on port 8000
        const url = getGatewayUrl(`/route/v1/${routingProfile}/${coordString}?overview=full&geometries=geojson`);
        
        const response = await axios.get(url, {
          headers: {
            Authorization: 'Bearer zahi123'
          }
        });

        if (response.data.code === 'Ok' && response.data.routes.length > 0) {
          const route = response.data.routes[0];
          setDistance(route.distance);
          setDuration(route.duration);
          
          setRouteGeoJSON({
            type: 'Feature',
            properties: {},
            geometry: route.geometry
          });

          // Fetch geofencing and spatial pricing for the destination and origin
          try {
            const startPt = waypoints[0];
            const endPt = waypoints[waypoints.length - 1];
            
            // Try destination geofence first
            const geofenceRes = await axios.get(getGatewayUrl(`/geofence/api/v1/zone`), {
              params: { lat: endPt[0], lng: endPt[1] },
              headers: { Authorization: 'Bearer zahi123' }
            });
            
            if (geofenceRes.data && geofenceRes.data.zone_id !== 'default') {
              setPricing({
                zoneId: geofenceRes.data.zone_id,
                baseFareMultiplier: geofenceRes.data.base_fare_multiplier,
                surgeMultiplier: geofenceRes.data.surge_multiplier,
                surgeActive: geofenceRes.data.surge_active,
              });
            } else {
              // Try origin geofence
              const geofenceResStart = await axios.get(getGatewayUrl(`/geofence/api/v1/zone`), {
                params: { lat: startPt[0], lng: startPt[1] },
                headers: { Authorization: 'Bearer zahi123' }
              });
              if (geofenceResStart.data) {
                setPricing({
                  zoneId: geofenceResStart.data.zone_id,
                  baseFareMultiplier: geofenceResStart.data.base_fare_multiplier,
                  surgeMultiplier: geofenceResStart.data.surge_multiplier,
                  surgeActive: geofenceResStart.data.surge_active,
                });
              }
            }
          } catch (geofenceErr) {
            console.error("Failed to query geofence spatial pricing:", geofenceErr);
          }
        } else {
          setRouteGeoJSON(null);
          setPricing(null);
        }
      } catch (error) {
        console.error("Failed to fetch custom route from backend API:", error);
        setRouteGeoJSON(null);
        setPricing(null);
      }
    };

    fetchRoute();
  }, [waypoints, routingProfile, setPricing]);

  return { routeGeoJSON, distance, duration };
};
