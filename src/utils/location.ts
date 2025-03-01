import { toast } from "react-toastify";

export const getUserLocation = (): Promise<[number, number]> => {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          toast.success(`Location detected: ${latitude}, ${longitude}`);
          resolve([latitude, longitude]);
        },
        (error) => {
          console.error("Error getting user location:", error);
          toast.error("Failed to fetch location. Please allow location access.");
          reject(error);
        }
      );
    } else {
      toast.error("Geolocation is not supported by this browser.");
      reject(new Error("Geolocation is not supported by this browser."));
    }
  });
};
