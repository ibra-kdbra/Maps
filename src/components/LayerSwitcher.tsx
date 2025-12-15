import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  Avatar,
} from "@mui/material";
import {
  Layers,
  Close,
  Map,
  Satellite,
  Terrain,
  Streetview
} from "@mui/icons-material";
import { useMapStore } from "../store/mapStore";

const LayerSwitcher = ({ onClose }: { onClose: () => void }) => {
  const { currentLayer, availableLayers, setCurrentLayer } = useMapStore();
  const [isOpen, setIsOpen] = useState(false);

  const getLayerIcon = (layerId: string) => {
    switch (layerId) {
      case 'satellite':
        return <Satellite sx={{ fontSize: 20 }} />;
      case 'terrain':
        return <Terrain sx={{ fontSize: 20 }} />;
      case 'streets':
        return <Streetview sx={{ fontSize: 20 }} />;
      default:
        return <Map sx={{ fontSize: 20 }} />;
    }
  };

  const handleLayerSelect = (layerId: string) => {
    setCurrentLayer(layerId);
    onClose();
  };

  if (!isOpen) {
    return (
      <IconButton
        onClick={() => setIsOpen(true)}
        sx={{
          position: "absolute",
          bottom: 140,
          right: 16,
          zIndex: 1000,
          bgcolor: "white",
          boxShadow: 2,
          "&:hover": { bgcolor: "#f5f5f5" }
        }}
      >
        <Layers />
      </IconButton>
    );
  }

  return (
    <Paper
      sx={{
        position: "absolute",
        bottom: 140,
        right: 16,
        zIndex: 1000,
        width: 280,
        maxHeight: 400,
        overflow: "hidden",
        boxShadow: "0 4px 6px rgba(32,33,36,.28)"
      }}
    >
      {/* Header */}
      <Box sx={{
        p: 2,
        borderBottom: "1px solid #e8eaed",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 500 }}>
          Map Type
        </Typography>
        <IconButton size="small" onClick={() => setIsOpen(false)}>
          <Close />
        </IconButton>
      </Box>

      {/* Layer Options */}
      <Box sx={{ p: 1 }}>
        {availableLayers.map((layer) => (
          <Button
            key={layer.id}
            onClick={() => handleLayerSelect(layer.id)}
            fullWidth
            sx={{
              justifyContent: "flex-start",
              p: 1.5,
              mb: 0.5,
              borderRadius: "8px",
              bgcolor: currentLayer === layer.id ? "#e3f2fd" : "transparent",
              color: currentLayer === layer.id ? "#1976d2" : "#5f6368",
              "&:hover": {
                bgcolor: currentLayer === layer.id ? "#bbdefb" : "#f5f5f5"
              }
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  mr: 2,
                  bgcolor: currentLayer === layer.id ? "#1976d2" : "#f5f5f5",
                  color: currentLayer === layer.id ? "white" : "#5f6368"
                }}
              >
                {getLayerIcon(layer.id)}
              </Avatar>
              <Box sx={{ textAlign: "left" }}>
                <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2 }}>
                  {layer.name}
                </Typography>
                {currentLayer === layer.id && (
                  <Typography variant="caption" sx={{ color: "#1976d2", fontSize: "11px" }}>
                    Selected
                  </Typography>
                )}
              </Box>
            </Box>
          </Button>
        ))}
      </Box>
    </Paper>
  );
};

export default LayerSwitcher;
