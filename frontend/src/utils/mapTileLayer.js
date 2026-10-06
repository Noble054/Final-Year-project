const cartoKey = import.meta.env.VITE_CARTO_API_KEY;

/**
 * Returns tile layer configuration for Leaflet maps.
 * Uses CARTO Dark Matter if an API key is configured,
 * otherwise falls back to OpenStreetMap with dark-mode CSS filtering
 * so no 'API Key required' watermarks ever appear.
 */
export const getMapTileConfig = () => {
  if (cartoKey) {
    return {
      url: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${cartoKey}`,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      className: '',
    };
  }

  return {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    className: 'dark-map-tiles',
  };
};
