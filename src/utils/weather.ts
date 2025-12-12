import axios from "axios";

const API_KEY = "f9c856528fc44e0eb25214640251502";
const BASE_URL = "https://api.weatherapi.com/v1/current.json";

export const fetchWeather = async (query: string) => {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        q: query,
        key: API_KEY, // Get from https://www.weatherapi.com/
        aqi: 'yes', // Include air quality data
      },
    });

    const data = response.data;

    // Function to get air quality description
    const getAirQualityDescription = (index: number) => {
      if (index <= 50) return 'Good';
      if (index <= 100) return 'Moderate';
      if (index <= 150) return 'Unhealthy for Sensitive Groups';
      if (index <= 200) return 'Unhealthy';
      if (index <= 300) return 'Very Unhealthy';
      return 'Hazardous';
    };

    const airQualityIndex = data.current.air_quality?.['us-epa-index'] || 0;

    return {
      location: {
        name: data.location.name,
        lat: data.location.lat,
        lon: data.location.lon,
      },
      current: {
        temp_c: data.current.temp_c,
        condition: {
          text: data.current.condition.text,
          icon: data.current.condition.icon, // Weather icon URL
        },
        wind_kph: data.current.wind_kph,
        humidity: data.current.humidity,
        air_quality: airQualityIndex,
        air_quality_description: getAirQualityDescription(airQualityIndex),
      },
    };
  } catch (error) {
    console.error("Weather API Error:", error);
    return null;
  }
};

export const fetchWeatherByCoords = async (lat: number, lon: number) => {
  return fetchWeather(`${lat},${lon}`);
};
