import { create } from 'zustand';
import { MapState, MapActions, MapLayer } from '../types';

// Define available map layers
const availableLayers: MapLayer[] = [
  {
    id: 'openstreetmap',
    name: 'Default',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  },
  {
    id: 'satellite',
    name: 'Satellite',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  },
  {
    id: 'terrain',
    name: 'Terrain',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}'
  },
  {
    id: 'streets',
    name: 'Streets',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
  }
];

export const useMapStore = create<MapState & MapActions>((set) => ({
  route: {
    start: [48.8566, 2.3522], // Paris
    end: [45.7640, 4.8357], // Lyon
  },
  weatherData: null,
  zoomTo: null,
  currentLayer: 'openstreetmap', // Default layer
  availableLayers,

  setRoute: (start, end) => set({ route: { start, end } }),
  setWeatherData: (data) => set({ weatherData: data }),
  setZoomTo: (coords) => set({ zoomTo: coords }),
  setInitialStart: (coords: [number, number]) => set((state) => ({
    route: { start: coords, end: state.route.end },
    zoomTo: coords, // Also zoom to current location
  })),
  setCurrentLayer: (layerId: string) => set({ currentLayer: layerId }),
}));
