import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import styles
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Map from "./components/Map";
import { Box } from "@mui/material";
import { fetchWeather } from "./utils/weather";
import { getUserLocation } from "./utils/location";

const App = () => {
  const [route, setRoute] = useState<{ start: [number, number]; end: [number, number] }>({
    start: [48.8566, 2.3522], // Paris
    end: [45.7640, 4.8357], // Lyon
  });

  const [weatherData, setWeatherData] = useState<any>(null);
  const [zoomTo, setZoomTo] = useState<[number, number] | null>(null);

  const handleRouteCalculate = (start: [number, number], end: [number, number]) => {
    setRoute({ start, end });
  };

  const handleWeatherSearch = async (city: string) => {
    try {
      const data = await fetchWeather(city);
      if (data) {
        setWeatherData({
          city: data.location.name,
          lat: data.location.lat,
          lon: data.location.lon,
          temperature: data.current.temp_c,
          description: data.current.condition.text,
          icon: data.current.condition.icon,
        });
        setZoomTo([data.location.lat, data.location.lon]); 
        // toast.success(`Weather for ${data.location.name} found!`);
      }
    } catch (error) {
      toast.error("Failed to fetch weather data. Please try again.");
    }
  };

  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const userLocation = await getUserLocation();
        setRoute((prev) => ({ ...prev, start: userLocation }));
      } catch (error) {
        console.error("Failed to fetch user location:", error);
      }
    };

    fetchUserLocation();
  }, []);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <ToastContainer position="top-right" autoClose={3000} />
      <Navbar onSearch={handleWeatherSearch} />
      <Box sx={{ display: "flex", flexGrow: 1 }}>
        <Sidebar onRouteCalculate={handleRouteCalculate} />
        <Box sx={{ flexGrow: 1, position: "relative" }}>
          <Map start={route.start} end={route.end} zoomTo={zoomTo || undefined} weatherData={weatherData} />
        </Box>
      </Box>
    </Box>
  );
};

export default App;
