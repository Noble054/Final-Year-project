import { useState, useEffect, useContext, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Circle, useMap } from 'react-leaflet';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Map as MapIcon, BatteryCharging, Zap, ArrowLeft, Navigation, Search, Loader2 } from 'lucide-react';
import L from 'leaflet';
import { getMapTileConfig } from '../utils/mapTileLayer';
import { resolveUserLocation } from '../utils/geoLocator';

const ChangeView = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 14, { duration: 1.5 });
  }, [center, map]);
  return null;
};

const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: '<span class="user-location-marker__pulse"></span><span class="user-location-marker__dot"></span>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const getDistanceInKilometers = (origin, destination) => {
  const earthRadius = 6371;
  const latitudeDifference = (destination[0] - origin[0]) * Math.PI / 180;
  const longitudeDifference = (destination[1] - origin[1]) * Math.PI / 180;
  const latitudeOne = origin[0] * Math.PI / 180;
  const latitudeTwo = destination[0] * Math.PI / 180;
  const haversine = Math.sin(latitudeDifference / 2) ** 2
    + Math.sin(longitudeDifference / 2) ** 2 * Math.cos(latitudeOne) * Math.cos(latitudeTwo);
  return earthRadius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

// Fix for default Leaflet markers in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const StationMap = () => {
  const { user } = useContext(AuthContext);
  const [chargingStations, setChargingStations] = useState([]);
  const [swapStations, setSwapStations] = useState([]);
  const [filter, setFilter] = useState('all');
  const [userLocation, setUserLocation] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(0);
  const [locationSource, setLocationSource] = useState(null);
  const [mapCenter, setMapCenter] = useState(null); 
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const navigate = useNavigate();
 
  const getUserLocation = useCallback(async () => {
    setIsLocating(true);
    setLocationMessage('Detecting your location...');
    try {
      const loc = await resolveUserLocation();
      const newLoc = [loc.lat, loc.lng];
      setUserLocation(newLoc);
      setLocationAccuracy(loc.accuracy);
      setLocationSource(loc.source);
      setMapCenter(newLoc);
      setLocationMessage(loc.message);
    } catch (error) {
      console.error("Error getting location:", error);
      setLocationSource(null);
      setLocationMessage(error.message || 'Could not determine your location.');
    } finally {
      setIsLocating(false);
    }
  }, []);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const [chargeRes, swapRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/stations/charging`, config),
          axios.get(`${import.meta.env.VITE_API_URL}/stations/battery-swap`, config)
        ]);
        setChargingStations(chargeRes.data);
        setSwapStations(swapRes.data);
      } catch (error) {
        console.error('Error fetching stations', error);
      }
    };

    fetchStations();
    const locationTimer = window.setTimeout(getUserLocation, 0);
    return () => window.clearTimeout(locationTimer);
  }, [user.token, getUserLocation]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      if (response.data && response.data.length > 0) {
        const { lat, lon } = response.data[0];
        setMapCenter([parseFloat(lat), parseFloat(lon)]);
      } else {
        alert("Location not found. Please try a different search term.");
      }
    } catch (error) {
      console.error("Search error:", error);
      alert("Error searching for location.");
    } finally {
      setIsSearching(false);
    }
  };

  const nearestChargingStation = userLocation && chargingStations.length > 0
    ? chargingStations
      .map((station) => ({
        ...station,
        distance: getDistanceInKilometers(userLocation, [Number(station.latitude), Number(station.longitude)])
      }))
      .sort((first, second) => first.distance - second.distance)[0]
    : null;
  const nearestSwapStation = userLocation && swapStations.length > 0
    ? swapStations
      .map((station) => ({
        ...station,
        distance: getDistanceInKilometers(userLocation, [Number(station.latitude), Number(station.longitude)])
      }))
      .sort((first, second) => first.distance - second.distance)[0]
    : null;

  const focusStation = (station, type) => {
    setMapCenter([Number(station.latitude), Number(station.longitude)]);
    navigate(type === 'charging' ? `/stations/${station.station_id}` : `/battery-swap/${station.swap_id}`);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="glass-panel rounded-none border-t-0 border-x-0 p-4 flex flex-col xl:flex-row justify-between items-center gap-4 z-[100] sticky top-0">
        <div className="flex items-center justify-between w-full xl:w-auto gap-4">
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-white flex items-center gap-2">
            <MapIcon className="text-neonCyan" />
            <span>Discovery</span>
          </h1>

          <button 
            onClick={getUserLocation}
            disabled={isLocating}
            aria-label="Locate me on the map"
            className="lg:hidden p-2 bg-white/5 border border-white/10 rounded-xl text-neonCyan transition-all duration-200 flex items-center gap-2 text-xs font-medium hover:bg-neonCyan/15 hover:border-neonCyan/50 hover:text-white hover:shadow-[0_0_16px_rgba(0,242,254,0.3)] hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:bg-white/5 disabled:hover:border-white/10"
          >
            {isLocating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
            {isLocating ? 'Locating...' : 'Locate'}
          </button>
        </div>

        <form onSubmit={handleSearch} className="w-full lg:max-w-md xl:flex-1 relative">
          <input
            type="text"
            placeholder="Search location..."
            className="w-full bg-black/20 border border-white/10 rounded-xl px-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neonCyan/50 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <button 
            type="submit"
            disabled={isSearching}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-neonCyan/10 hover:bg-neonCyan/20 text-neonCyan rounded-lg transition-colors"
          >
            {isSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          </button>
        </form>
        
        <div className="flex items-center gap-3 w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0 scrollbar-hide justify-center">
          <button 
            onClick={getUserLocation}
            disabled={isLocating}
            aria-label="Locate me on the map"
            className="hidden lg:flex p-2 bg-white/5 border border-white/10 rounded-xl text-neonCyan transition-all duration-200 items-center gap-2 text-sm font-medium whitespace-nowrap hover:bg-neonCyan/15 hover:border-neonCyan/50 hover:text-white hover:shadow-[0_0_16px_rgba(0,242,254,0.3)] hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:bg-white/5 disabled:hover:border-white/10"
          >
            {isLocating ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={18} />}
            {isLocating ? 'Locating...' : 'Locate Me'}
          </button>
          
          <div className="flex bg-black/40 rounded-xl p-1 border border-white/10 shrink-0">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 lg:px-6 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${filter === 'all' ? 'bg-gradient-to-r from-neonCyan to-electricPurple text-obsidian shadow-[0_0_10px_rgba(0,242,254,0.3)]' : 'text-gray-400 hover:text-white'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('charging')}
              className={`px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all flex items-center gap-1.5 ${filter === 'charging' ? 'bg-gradient-to-r from-neonCyan to-electricPurple text-obsidian shadow-[0_0_10px_rgba(0,242,254,0.3)]' : 'text-gray-400 hover:text-white'}`}
            >
              <Zap size={14} /> <span className="hidden sm:inline">Charging</span>
            </button>
            <button
              onClick={() => setFilter('swap')}
              className={`px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all flex items-center gap-1.5 ${filter === 'swap' ? 'bg-gradient-to-r from-neonCyan to-electricPurple text-obsidian shadow-[0_0_10px_rgba(0,242,254,0.3)]' : 'text-gray-400 hover:text-white'}`}
            >
              <BatteryCharging size={14} /> <span className="hidden sm:inline">Swap</span>
            </button>
          </div>
        </div>
      </div>
      {locationMessage && (
        <div className={`absolute bottom-4 left-4 z-[1000] max-w-sm rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur-xl ${locationSource === 'browser' ? 'border-emerald-400/30 bg-emerald-950/90 text-emerald-300' : locationSource === 'ip' ? 'border-amber-400/30 bg-amber-950/90 text-amber-200' : locationMessage.includes('Detecting') ? 'border-neonCyan/30 bg-obsidian/95 text-neonCyan' : 'border-red-400/30 bg-red-950/90 text-red-300'}`}>
          {locationMessage}
        </div>
      )}
 
      <div className="flex-1 relative z-0">
        {userLocation && (nearestChargingStation || nearestSwapStation) && (
          <div className="pointer-events-auto absolute left-4 top-4 z-[1000] w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-white/10 bg-obsidian/95 p-4 shadow-2xl backdrop-blur-xl">
            <div className="mb-3 flex items-center gap-2">
              <Navigation size={17} className="text-neonCyan" />
              <div>
                <p className="text-sm font-semibold text-white">Nearby from your location</p>
                <p className="text-xs text-gray-500">Recommended stations based on distance</p>
              </div>
            </div>
            <div className="space-y-2">
              {nearestChargingStation && (
                <button type="button" onClick={() => focusStation(nearestChargingStation, 'charging')} className="flex w-full items-center justify-between gap-3 rounded-xl border border-neonCyan/15 bg-neonCyan/5 p-3 text-left transition-colors hover:bg-neonCyan/10">
                  <span className="flex min-w-0 items-center gap-3"><Zap size={17} className="shrink-0 text-neonCyan" /><span className="min-w-0"><span className="block truncate text-sm font-medium text-white">{nearestChargingStation.name}</span><span className="block text-xs text-gray-500">Nearest charging station · {nearestChargingStation.available_slots} slots available</span></span></span>
                  <span className="shrink-0 text-xs font-semibold text-neonCyan">{nearestChargingStation.distance.toFixed(1)} km</span>
                </button>
              )}
              {nearestSwapStation && (
                <button type="button" onClick={() => focusStation(nearestSwapStation, 'swap')} className="flex w-full items-center justify-between gap-3 rounded-xl border border-electricPurple/15 bg-electricPurple/5 p-3 text-left transition-colors hover:bg-electricPurple/10">
                  <span className="flex min-w-0 items-center gap-3"><BatteryCharging size={17} className="shrink-0 text-electricPurple" /><span className="min-w-0"><span className="block truncate text-sm font-medium text-white">{nearestSwapStation.name}</span><span className="block text-xs text-gray-500">Nearest battery swap · {nearestSwapStation.battery_stock} batteries ready</span></span></span>
                  <span className="shrink-0 text-xs font-semibold text-electricPurple">{nearestSwapStation.distance.toFixed(1)} km</span>
                </button>
              )}
            </div>
          </div>
        )}
        <MapContainer center={mapCenter || [7.9465, -1.0232]} zoom={7} style={{ height: '100%', width: '100%', background: '#0a0a0a' }}>
          {mapCenter && <ChangeView center={mapCenter} />}
          <TileLayer {...getMapTileConfig()} />
          
          {userLocation && (
            <>
            {locationAccuracy > 0 && (
              <Circle
                center={userLocation}
                radius={locationAccuracy}
                pathOptions={{ color: '#00F2FE', fillColor: '#00F2FE', fillOpacity: 0.1, weight: 1 }}
              />
            )}
            <Marker position={userLocation} icon={userLocationIcon}>
              <Tooltip direction="top" offset={[0, -18]} permanent className="user-location-tooltip">
                {locationSource === 'browser' ? 'You are here' : 'Approximate location'}
              </Tooltip>
              <Popup>
                <div className="text-obsidian font-bold">{locationSource === 'browser' ? 'You are here' : 'Approximate location'}</div>
                {locationAccuracy > 0 && <div className="text-xs text-gray-600 mt-1">Accuracy: about {Math.round(locationAccuracy)} m</div>}
              </Popup>
            </Marker>
            </>
          )}
          
          {(filter === 'all' || filter === 'charging') && chargingStations.map(station => (
            <Marker key={`c-${station.station_id}`} position={[station.latitude, station.longitude]}>
              <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent className="font-bold bg-obsidian text-white border-white/20 rounded-md shadow-lg">
                {station.name}
              </Tooltip>
              <Popup className="custom-popup">
                <div className="p-2 font-sans">
                  <h3 className="font-heading font-bold text-lg text-obsidian mb-1">{station.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 flex items-center gap-1"><Zap size={14}/> {station.charger_type} Charger</p>
                  <div className="flex justify-between items-center mb-4 bg-gray-100 p-2 rounded-lg">
                    <span className="text-obsidian font-bold text-sm">{station.available_slots} / {station.total_slots} Slots</span>
                    <span className="font-bold text-electricPurple text-sm">${station.price_per_kwh}/kWh</span>
                  </div>
                  <button 
                    onClick={() => navigate(`/stations/${station.station_id}`)}
                    className="w-full bg-obsidian hover:bg-gray-800 text-neonCyan font-bold py-2 rounded-lg transition-colors border border-obsidian"
                  >
                    Book Slot
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {(filter === 'all' || filter === 'swap') && swapStations.map(station => (
            <Marker key={`s-${station.swap_id}`} position={[station.latitude, station.longitude]}>
              <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent className="font-bold bg-obsidian text-white border-white/20 rounded-md shadow-lg">
                {station.name}
              </Tooltip>
              <Popup>
                <div className="p-2 font-sans">
                  <h3 className="font-heading font-bold text-lg text-obsidian mb-1">{station.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 flex items-center gap-1"><BatteryCharging size={14}/> Swap Station</p>
                  <div className="mb-4 bg-gray-100 p-2 rounded-lg text-center">
                    <span className="text-electricPurple font-bold text-sm">{station.battery_stock} Batteries Ready</span>
                  </div>
                  <button 
                    onClick={() => navigate(`/battery-swap/${station.swap_id}`)}
                    className="w-full bg-obsidian hover:bg-gray-800 text-electricPurple font-bold py-2 rounded-lg transition-colors border border-obsidian"
                  >
                    Request Swap
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default StationMap;
