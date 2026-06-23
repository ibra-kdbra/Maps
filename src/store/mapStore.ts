import { create } from 'zustand';
import { MapState, MapActions, MapLayer } from '../types';

// Define available map layer styles for MapLibre (Vector)
const availableLayers: MapLayer[] = [
  {
    id: 'local-syria-minimal',
    name: 'Syria Minimalist Engine (Offline)',
    attribution: '&copy; Your Maps, OSM contributors',
    url: '/data/syria-style.json'
  },
  {
    id: 'voyager',
    name: 'Day Mode (Vector)',
    attribution: '&copy; CARTO, OpenStreetMap contributors',
    url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
  },
  {
    id: 'positron',
    name: 'Day Mode Light (Vector)',
    attribution: '&copy; CARTO, OpenStreetMap contributors',
    url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
  },
  {
    id: 'dark-matter',
    name: 'Night Mode (Vector)',
    attribution: '&copy; CARTO, OpenStreetMap contributors',
    url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
  }
];

export const useMapStore = create<MapState & MapActions>((set) => ({
  route: {
    waypoints: [] // Starts empty so user can click to map
  },
  weatherData: null,
  zoomTo: null,
  currentLayer: 'local-syria-minimal', // Default layer back to stable
  availableLayers,

  addWaypoint: (coord) => set((state) => ({ 
    route: { waypoints: [...state.route.waypoints, coord] }
  })),
  clearWaypoints: () => set({ route: { waypoints: [] } }),
  setWeatherData: (data) => set({ weatherData: data }),
  setZoomTo: (coords) => set({ zoomTo: coords }),
  setInitialStart: (coords: [number, number]) => set((state) => ({
    route: { waypoints: state.route.waypoints }, // Unchanged
    zoomTo: coords, // Also zoom to current location
  })),
  setCurrentLayer: (layerId: string) => set({ currentLayer: layerId }),
}));
