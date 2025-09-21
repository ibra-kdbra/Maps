import { create } from 'zustand';
import { MapState, MapActions } from '../types';

export const useMapStore = create<MapState & MapActions>((set) => ({
  route: {
    start: [48.8566, 2.3522], // Paris
    end: [45.7640, 4.8357], // Lyon
  },
  weatherData: null,
  zoomTo: null,

  setRoute: (start, end) => set({ route: { start, end } }),
  setWeatherData: (data) => set({ weatherData: data }),
  setZoomTo: (coords) => set({ zoomTo: coords }),
  setInitialStart: (coords: [number, number]) => set((state) => ({
    route: { start: coords, end: state.route.end },
    zoomTo: coords, // Also zoom to current location
  })),
}));
