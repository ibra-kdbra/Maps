import axios from "axios";

export interface AutocompleteSuggestion {
  label: string;
  coordinates: [number, number]; // [lat, lon]
}

/**
 * Perform a forward geocode query using Pelias /v1/search endpoint.
 * Returns an object with lat/lon strings to maintain compatibility.
 */
export const geocodeLocation = async (location: string) => {
  try {
    const response = await axios.get(`/geocoder/v1/autocomplete`, {
      params: {
        text: location,
        size: 1
      }
    });
    if (response.data && response.data.features && response.data.features.length > 0) {
      const feature = response.data.features[0];
      const [lon, lat] = feature.geometry.coordinates;
      return {
        lat: lat.toString(),
        lon: lon.toString(),
        display_name: feature.properties.label || feature.properties.name
      };
    }
    return null;
  } catch (error) {
    console.error("Error geocoding location:", error);
    return null;
  }
};

/**
 * Fetch autocomplete suggestions as the user types using Pelias /v1/autocomplete.
 */
export const autocompleteLocation = async (text: string): Promise<AutocompleteSuggestion[]> => {
  if (!text.trim()) return [];
  try {
    const response = await axios.get(`/geocoder/v1/autocomplete`, {
      params: {
        text,
        size: 5
      }
    });
    if (response.data && response.data.features) {
      return response.data.features.map((feature: any) => {
        const [lon, lat] = feature.geometry.coordinates;
        return {
          label: feature.properties.label || feature.properties.name,
          coordinates: [lat, lon]
        };
      });
    }
    return [];
  } catch (error) {
    console.error("Error fetching autocomplete suggestions:", error);
    return [];
  }
};

/**
 * Reverse geocode a set of coordinates using Pelias /v1/reverse.
 * Returns a human-readable street or place name.
 */
export const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
  try {
    const response = await axios.get(`/geocoder/v1/reverse`, {
      params: {
        "point.lat": lat,
        "point.lon": lon,
        size: 1
      }
    });
    if (response.data && response.data.features && response.data.features.length > 0) {
      const feature = response.data.features[0];
      return feature.properties.label || feature.properties.name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  } catch (error) {
    console.error("Error reverse geocoding location:", error);
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }
};