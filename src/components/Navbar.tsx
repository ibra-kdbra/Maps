import { useState } from "react";
import { AppBar, Toolbar, Typography, TextField, Button, Snackbar, Alert } from "@mui/material";

const Navbar = ({ onSearch }: { onSearch: (city: string) => void }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  const handleSearch = () => {
    const trimmedSearchTerm = searchTerm.trim();
    if (!trimmedSearchTerm) {
      setError("Please enter a city name.");
      return;
    }
    setError("");
    onSearch(trimmedSearchTerm);
  };
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Interactive Map
          </Typography>
          <TextField
            label="Search City"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ marginRight: "16px" }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            aria-label="Search for city weather"
          >
            Search
          </Button>
        </Toolbar>
      </AppBar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError("")}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setError("")} severity="error" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Navbar;