import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  IconButton,
  InputAdornment
} from "@mui/material";
import {
  Place,
  Close
} from "@mui/icons-material";
import { geocodeLocation } from "../utils/geocode";

interface SidebarProps {
  onRouteCalculate: (start: [number, number], end: [number, number]) => void;
}

const Sidebar = ({ onRouteCalculate }: SidebarProps) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [startName, setStartName] = useState("");
  const [endName, setEndName] = useState("");
  const [startCoords, setStartCoords] = useState<[number, number]>([48.8566, 2.3522]);
  const [endCoords, setEndCoords] = useState<[number, number]>([45.7640, 4.8357]);

  const handleCalculateRoute = async () => {
    let start: [number, number];
    let end: [number, number];

    if (tabIndex === 0) {
      // Use place names
      const startData = await geocodeLocation(startName);
      const endData = await geocodeLocation(endName);
      if (!startData || !endData) {
        alert("Invalid start or end location.");
        return;
      }
      start = [parseFloat(startData.lat), parseFloat(startData.lon)];
      end = [parseFloat(endData.lat), parseFloat(endData.lon)];
    } else {
      // Use coordinates
      start = startCoords;
      end = endCoords;
    }

    onRouteCalculate(start, end);
  };

  const handleSwapLocations = () => {
    if (tabIndex === 0) {
      const temp = startName;
      setStartName(endName);
      setEndName(temp);
    } else {
      setStartCoords(endCoords);
      setEndCoords(startCoords);
    }
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: "white" }}>
      {/* Header */}
      <Box sx={{
        p: 2,
        borderBottom: "1px solid #e8eaed",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <Typography variant="h6" sx={{ fontWeight: 500, color: "#202124" }}>
          Directions
        </Typography>
        <IconButton size="small" sx={{ color: "#5f6368" }}>
          <Close />
        </IconButton>
      </Box>

      {/* Tab Selector */}
      <Box sx={{ p: 2, borderBottom: "1px solid #e8eaed" }}>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant={tabIndex === 0 ? "contained" : "outlined"}
            onClick={() => setTabIndex(0)}
            sx={{
              flex: 1,
              borderRadius: "8px",
              textTransform: "none",
              bgcolor: tabIndex === 0 ? "#4285F4" : "transparent",
              color: tabIndex === 0 ? "white" : "#5f6368",
              border: tabIndex === 0 ? "none" : "1px solid #dadce0",
              "&:hover": {
                bgcolor: tabIndex === 0 ? "#3367D6" : "#f8f9fa"
              }
            }}
          >
            Search
          </Button>
          <Button
            variant={tabIndex === 1 ? "contained" : "outlined"}
            onClick={() => setTabIndex(1)}
            sx={{
              flex: 1,
              borderRadius: "8px",
              textTransform: "none",
              bgcolor: tabIndex === 1 ? "#4285F4" : "transparent",
              color: tabIndex === 1 ? "white" : "#5f6368",
              border: tabIndex === 1 ? "none" : "1px solid #dadce0",
              "&:hover": {
                bgcolor: tabIndex === 1 ? "#3367D6" : "#f8f9fa"
              }
            }}
          >
            Coordinates
          </Button>
        </Box>
      </Box>

      {/* Location Inputs */}
      <Box sx={{ p: 2, flex: 1, overflow: "auto" }}>
        {tabIndex === 0 ? (
          // Search by name
          <Box>
            <Paper
              sx={{
                p: 2,
                mb: 1,
                borderRadius: "12px",
                border: "1px solid #dadce0",
                "&:hover": { borderColor: "#4285F4" }
              }}
            >
              <TextField
                placeholder="Choose starting point"
                value={startName}
                onChange={(e) => setStartName(e.target.value)}
                fullWidth
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <Place sx={{ color: "#4285F4" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ "& .MuiInput-root": { fontSize: "14px" } }}
              />
            </Paper>

            <Box sx={{ display: "flex", justifyContent: "center", my: 1 }}>
              <IconButton
                onClick={handleSwapLocations}
                sx={{
                  bgcolor: "#f8f9fa",
                  border: "1px solid #dadce0",
                  borderRadius: "50%",
                  "&:hover": { bgcolor: "#e8eaed" }
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M8 7h2v6h6v2H8V7zm6-5l-2 2 4 4H0v3h16l-4 4 2 2 8-8z" fill="#5f6368"/>
                </svg>
              </IconButton>
            </Box>

            <Paper
              sx={{
                p: 2,
                borderRadius: "12px",
                border: "1px solid #dadce0",
                "&:hover": { borderColor: "#4285F4" }
              }}
            >
              <TextField
                placeholder="Choose destination"
                value={endName}
                onChange={(e) => setEndName(e.target.value)}
                fullWidth
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <Place sx={{ color: "#ea4335" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ "& .MuiInput-root": { fontSize: "14px" } }}
              />
            </Paper>
          </Box>
        ) : (
          // Coordinates input
          <Box>
            <Typography variant="body2" sx={{ mb: 2, color: "#5f6368", fontWeight: 500 }}>
              Enter coordinates
            </Typography>

            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <TextField
                label="Start Lat"
                value={startCoords[0]}
                onChange={(e) => setStartCoords([parseFloat(e.target.value) || 0, startCoords[1]])}
                size="small"
                sx={{ flex: 1 }}
              />
              <TextField
                label="Start Lng"
                value={startCoords[1]}
                onChange={(e) => setStartCoords([startCoords[0], parseFloat(e.target.value) || 0])}
                size="small"
                sx={{ flex: 1 }}
              />
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                label="End Lat"
                value={endCoords[0]}
                onChange={(e) => setEndCoords([parseFloat(e.target.value) || 0, endCoords[1]])}
                size="small"
                sx={{ flex: 1 }}
              />
              <TextField
                label="End Lng"
                value={endCoords[1]}
                onChange={(e) => setEndCoords([endCoords[0], parseFloat(e.target.value) || 0])}
                size="small"
                sx={{ flex: 1 }}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Action Button */}
      <Box sx={{ p: 2, borderTop: "1px solid #e8eaed" }}>
        <Button
          variant="contained"
          onClick={handleCalculateRoute}
          fullWidth
          sx={{
            bgcolor: "#4285F4",
            borderRadius: "8px",
            textTransform: "none",
            py: 1.5,
            fontSize: "16px",
            fontWeight: 500,
            "&:hover": { bgcolor: "#3367D6" }
          }}
        >
          Directions
        </Button>
      </Box>
    </Box>
  );
};

export default Sidebar;
