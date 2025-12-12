import { fetchWeather } from '../utils/weather';
import { useMapStore } from '../store/mapStore';
import { WeatherData } from '../types';
import { toast } from 'react-toastify';

export const useWeather = () => {
  const { setWeatherData, setZoomTo } = useMapStore();

  const searchWeather = async (city: string) => {
    try {
      const data = await fetchWeather(city);
      if (data) {
        const weatherData: WeatherData = {
          city: data.location.name,
          lat: data.location.lat,
          lon: data.location.lon,
          temperature: data.current.temp_c,
          description: data.current.condition.text,
          icon: data.current.condition.icon,
          windSpeed: data.current.wind_kph,
          humidity: data.current.humidity,
          airQuality: data.current.air_quality ? {
            index: data.current.air_quality,
            description: data.current.air_quality_description,
          } : undefined,
        };
        setWeatherData(weatherData);
        setZoomTo([data.location.lat, data.location.lon]);
      } else {
        toast.error('Weather data not found');
      }
    } catch {
      toast.error('Failed to fetch weather data. Please try again.');
    }
  };

  const fetchWeatherByCoords = async (lat: number, lon: number) => {
    try {
      const data = await fetchWeather(`${lat},${lon}`);
      if (data) {
        const weatherData: WeatherData = {
          city: data.location.name,
          lat: data.location.lat,
          lon: data.location.lon,
          temperature: data.current.temp_c,
          description: data.current.condition.text,
          icon: data.current.condition.icon,
          windSpeed: data.current.wind_kph,
          humidity: data.current.humidity,
          airQuality: data.current.air_quality ? {
            index: data.current.air_quality,
            description: data.current.air_quality_description,
          } : undefined,
        };
        setWeatherData(weatherData);
        // Don't zoom when clicking on map, just update marker
      } else {
        toast.error('Weather data not found');
      }
    } catch {
      toast.error('Failed to fetch weather data. Please try again.');
    }
  };

  return { searchWeather, fetchWeatherByCoords };
};
