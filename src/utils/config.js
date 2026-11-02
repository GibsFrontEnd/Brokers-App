// Helper to access runtime configuration
export const getConfig = () => {
  return (
    window.APP_CONFIG || {
      API_BASE_URL: "https://gibsbrokersapi.newgibsonline.com/api",
      ROOT_URL: "http://localhost:5174",
    }
  );
};

export const getApiBaseUrl = () => getConfig().API_BASE_URL;
export const getRootUrl = () => getConfig().ROOT_URL;

// Key for the user record kept encrypted in localStorage. It is bundled into the client, so it
// only hides the data from casual viewing. Set VITE_STORAGE_KEY per environment; changing it
// signs everyone out once. The fallback keeps existing sessions working until it is set.
export const getStorageKey = () => import.meta.env.VITE_STORAGE_KEY || "your-secret-key";
