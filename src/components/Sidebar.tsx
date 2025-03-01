import { useState } from "react";
import { TextField, Button, Tabs, Tab, Box } from "@mui/material";
import { geocodeLocation } from "../utils/geocode";

interface SidebarProps {
  onRouteCalculate: (start: [number, number], end: [number, number]) => void;
}

const Sidebar = ({ onRouteCalculate }: SidebarProps) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [startName, setStartName] = useState("");
  const [endName, setEndName] = useState("");
  const [startCoords, setStartCoords] = useState<[number, number]>([0, 0]);
  const [endCoords, setEndCoords] = useState<[number, number]>([0, 0]);

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

  return (
    <div className="w-64 bg-white shadow-lg p-4">
      <Tabs value={tabIndex} onChange={(_, newValue) => setTabIndex(newValue)}>
        <Tab label="By Name" />
        <Tab label="By Coordinates" />
      </Tabs>
      <Box hidden={tabIndex !== 0}>
        <TextField
          label="Start Location"
          value={startName}
          onChange={(e) => setStartName(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="End Location"
          value={endName}
          onChange={(e) => setEndName(e.target.value)}
          fullWidth
          margin="normal"
        />
      </Box>
      <Box hidden={tabIndex !== 1}>
        <TextField
          label="Start Latitude"
          value={startCoords[0]}
          onChange={(e) => setStartCoords([parseFloat(e.target.value), startCoords[1]])}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Start Longitude"
          value={startCoords[1]}
          onChange={(e) => setStartCoords([startCoords[0], parseFloat(e.target.value)])}
          fullWidth
          margin="normal"
        />
        <TextField
          label="End Latitude"
          value={endCoords[0]}
          onChange={(e) => setEndCoords([parseFloat(e.target.value), endCoords[1]])}
          fullWidth
          margin="normal"
        />
        <TextField
          label="End Longitude"
          value={endCoords[1]}
          onChange={(e) => setEndCoords([endCoords[0], parseFloat(e.target.value)])}
          fullWidth
          margin="normal"
        />
      </Box>
      <Button variant="contained" onClick={handleCalculateRoute} fullWidth>
        Calculate Route
      </Button>
    </div>
  );
};

export default Sidebar;