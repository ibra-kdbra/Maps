import axios from "axios";

export const geocodeLocation = async (location: string) => {
  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: {
        q: location,
        format: 'json',
        limit: 1
      }
    });
    return response.data[0];
  } catch (error) {
    console.error("Error geocoding location:", error);
    return null;
  }
};