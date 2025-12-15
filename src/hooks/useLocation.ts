import { getUserLocation } from '../utils/location';
import { useMapStore } from '../store/mapStore';

export const useLocation = () => {
  const { setInitialStart } = useMapStore();

  const fetchCurrentLocation = async () => {
    try {
      const userLocation = await getUserLocation();
      setInitialStart(userLocation);
    } catch (error) {
      console.error('Failed to fetch user location:', error);
    }
  };

  return { fetchCurrentLocation };
};
