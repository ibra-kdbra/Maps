import { useState } from "react";
import { Paper, InputBase, IconButton, Snackbar, Alert } from "@mui/material";
import { Search } from "@mui/icons-material";

const Navbar = ({ onSearch }: { onSearch: (city: string) => void }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
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
      <Paper
        component="form"
        onSubmit={handleSearch}
        sx={{
          p: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          borderRadius: '24px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          bgcolor: 'white',
        }}
      >
        <IconButton sx={{ p: '10px' }} aria-label="menu">
          <Search />
        </IconButton>
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder="Search for places"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          inputProps={{ 'aria-label': 'search for places' }}
        />
        <IconButton
          type="submit"
          sx={{
            p: '10px',
            bgcolor: '#4285F4',
            color: 'white',
            borderRadius: '50%',
            '&:hover': { bgcolor: '#3367D6' }
          }}
          aria-label="search"
        >
          <Search />
        </IconButton>
      </Paper>

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
