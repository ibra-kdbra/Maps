import { Card, CardContent, Typography, Box } from "@mui/material";

interface WeatherCardProps {
  city: string;
  temperature: number;
  description: string;
  icon: string;
}

const WeatherCard = ({ city, temperature, description, icon }: WeatherCardProps) => {
  return (
    <Card 
      sx={{
        minWidth: 275, 
        margin: "16px",
        backdropFilter: "blur(10px)",
        background: "rgba(255, 255, 255, 0.6)",
        borderRadius: "12px",
        padding: "10px",
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
      }}
    >
      <CardContent>
        <Typography variant="h5" component="div">
          {city || "Unknown City"}
        </Typography>
        <Typography sx={{ mb: 1.5 }} color="text.secondary">
          Weather Information
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <img src={icon} alt={description} width="50" height="50" />
          <Typography variant="body2">
            {description || "No data"}
          </Typography>
        </Box>
        <Typography variant="body2">
          Temperature: {temperature?.toFixed(1) ?? "N/A"}°C
        </Typography>
      </CardContent>
    </Card>
  );
};

export default WeatherCard;
