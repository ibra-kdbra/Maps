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
  start: [number, number];
  end: [number, number];
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
  setRoute: (start: [number, number], end: [number, number]) => void;
  setWeatherData: (data: WeatherData | null) => void;
  setZoomTo: (coords: [number, number] | null) => void;
  setInitialStart: (coords: [number, number]) => void;
  setCurrentLayer: (layerId: string) => void;
}
