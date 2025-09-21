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

  return { searchWeather };
};
