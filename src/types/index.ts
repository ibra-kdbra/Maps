export interface WeatherData {
  city: string;
  lat: number;
  lon: number;
  temperature: number;
  description: string;
  icon: string;
  windSpeed: number;
  humidity: number;
  airQuality?: {
    index: number;
    description: string;
  };
}

export interface Route {
  waypoints: [number, number][]; // Array of Lat/Lon coordinates
}

export interface MapLayer {
  id: string;
  name: string;
  attribution: string;
  url: string;
}

export interface MapState {
  route: Route;
  weatherData: WeatherData | null;
  zoomTo: [number, number] | null;
  currentLayer: string;
  availableLayers: MapLayer[];
}

export interface MapActions {
  addWaypoint: (coord: [number, number]) => void;
  clearWaypoints: () => void;
  setWeatherData: (data: WeatherData | null) => void;
  setZoomTo: (coords: [number, number] | null) => void;
  setInitialStart: (coords: [number, number]) => void;
  setCurrentLayer: (layerId: string) => void;
}
