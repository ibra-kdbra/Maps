import axios from "axios";

const API_KEY = "f9c856528fc44e0eb25214640251502";
const BASE_URL = "https://api.weatherapi.com/v1/current.json";

export const fetchWeather = async (city: string) => {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        q: city,
        key: API_KEY, // Get from https://www.weatherapi.com/
      },
    });

    return {
      location: {
        name: response.data.location.name,
        lat: response.data.location.lat,
        lon: response.data.location.lon,
      },
      current: {
        temp_c: response.data.current.temp_c,
        condition: {
          text: response.data.current.condition.text,
          icon: response.data.current.condition.icon, // Weather icon URL
        },
      },
    };
  } catch (error) {
    console.error("Weather API Error:", error);
    return null;
  }
};
