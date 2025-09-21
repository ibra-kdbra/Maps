import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import styles
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Map from "./components/Map";
import { Box } from "@mui/material";
import { useMapStore } from "./store/mapStore";
import { useWeather } from "./hooks/useWeather";
import { useLocation } from "./hooks/useLocation";

const App = () => {
  const { route, setRoute, weatherData, zoomTo } = useMapStore();
  const { searchWeather } = useWeather();
  const { fetchCurrentLocation } = useLocation();

  useEffect(() => {
    fetchCurrentLocation();
  }, [fetchCurrentLocation]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <ToastContainer position="top-right" autoClose={3000} />
      <Navbar onSearch={searchWeather} />
      <Box sx={{ display: "flex", flexGrow: 1 }}>
        <Sidebar onRouteCalculate={setRoute} />
        <Box sx={{ flexGrow: 1, position: "relative" }}>
          <Map start={route.start} end={route.end} zoomTo={zoomTo} weatherData={weatherData} />
        </Box>
      </Box>
    </Box>
  );
};

export default App;
