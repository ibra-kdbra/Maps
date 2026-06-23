export const useLocation = () => {
  const fetchCurrentLocation = async () => {
    try {
      // User requested to disable Geolocation prompt
      console.log('Geolocation fetch disabled by admin settings.');
      // setInitialStart([33.5138, 36.2765]); // Defaulting to Damascus handled by store
    } catch (error) {
      console.error('Failed to fetch user location:', error);
    }
  };

  return { fetchCurrentLocation };
};
