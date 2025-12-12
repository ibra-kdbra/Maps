import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import styles
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Map from "./components/Map";
import { Box, IconButton, Paper } from "@mui/material";
import { Menu, Directions, MyLocation } from "@mui/icons-material";
import { useMapStore } from "./store/mapStore";
import { useWeather } from "./hooks/useWeather";
import { useLocation } from "./hooks/useLocation";

const App = () => {
  const { route, setRoute, weatherData, zoomTo } = useMapStore();
  const { searchWeather } = useWeather();
  const { fetchCurrentLocation } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchCurrentLocation();
  }, []); // Empty dependency array - only run once on mount

  const handleMyLocation = () => {
    fetchCurrentLocation();
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", bgcolor: "#f5f5f5" }}>
      <ToastContainer position="top-center" autoClose={3000} />

      {/* Top Search Bar - Google Maps Style */}
      <Box sx={{
        position: "absolute",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        width: { xs: "90%", sm: "400px" }
      }}>
        <Navbar onSearch={searchWeather} />
      </Box>

      {/* Menu Button */}
      <IconButton
        onClick={() => setSidebarOpen(true)}
        sx={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 1000,
          bgcolor: "white",
          boxShadow: 2,
          "&:hover": { bgcolor: "#f5f5f5" }
        }}
      >
        <Menu />
      </IconButton>

      {/* My Location Button */}
      <IconButton
        onClick={handleMyLocation}
        sx={{
          position: "absolute",
          bottom: 24,
          right: 16,
          zIndex: 1000,
          bgcolor: "white",
          boxShadow: 2,
          "&:hover": { bgcolor: "#f5f5f5" }
        }}
      >
        <MyLocation />
      </IconButton>

      {/* Directions Button */}
      <IconButton
        onClick={() => setSidebarOpen(true)}
        sx={{
          position: "absolute",
          bottom: 80,
          right: 16,
          zIndex: 1000,
          bgcolor: "#4285F4",
          color: "white",
          boxShadow: 2,
          "&:hover": { bgcolor: "#3367D6" }
        }}
      >
        <Directions />
      </IconButton>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            bgcolor: "rgba(0,0,0,0.5)",
            zIndex: 1100,
          }}
          onClick={() => setSidebarOpen(false)}
        >
          <Paper
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: { xs: "100%", sm: "400px" },
              height: "100%",
              overflow: "auto"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar onRouteCalculate={(start, end) => {
              setRoute(start, end);
              setSidebarOpen(false);
            }} />
          </Paper>
        </Box>
      )}

      {/* Full Screen Map */}
      <Box sx={{ flexGrow: 1, position: "relative" }}>
        <Map start={route.start} end={route.end} zoomTo={zoomTo} weatherData={weatherData} />
      </Box>
    </Box>
  );
};

export default App;
