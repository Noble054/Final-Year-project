import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Zap, CarFront, Building2, Navigation, Search, Loader2, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getMapTileConfig } from '../utils/mapTileLayer';
import { resolveUserLocation } from '../utils/geoLocator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const ChangeView = ({ center }) => {
  const map = useMap();
  if (center) {
    map.flyTo(center, 13, { duration: 1.2 });
  }
  return null;
};

// Fix Leaflet's default marker icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return <Marker position={position}></Marker>;
};

const registerSchema = z.object({
  name: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must not exceed 50 characters'),
  email: z.string().email('Enter a valid email address'),
  phone_number: z.string().regex(/^\+?[0-9\s()-]{7,30}$/, 'Enter a valid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password must not exceed 100 characters').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, 'Use uppercase, lowercase, number, and special character'),
  confirmPassword: z.string(),
  role: z.enum(['EV Driver', 'Station Operator']),
  stationName: z.string().optional(),
  contactNumber: z.string().optional(),
  services: z.object({
    charge: z.boolean(),
    swap: z.boolean()
  }).optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
}).refine((data) => {
  if (data.role === 'Station Operator') {
    if (!data.stationName || data.stationName.length < 3) {
      return false;
    }
    if (data.contactNumber && !/^[+]?[\d\s-()]+$/.test(data.contactNumber)) {
      return false;
    }
    return data.services && (data.services.charge || data.services.swap);
  }
  return true;
}, {
  message: 'Please select at least one service (Charging or Battery Swap)',
  path: ['services']
}).refine((data) => {
  if (data.role === 'Station Operator') {
    return data.stationName && data.stationName.length >= 3;
  }
  return true;
}, {
  message: 'Station name must be at least 3 characters',
  path: ['stationName']
}).refine((data) => {
  if (data.role === 'Station Operator' && data.contactNumber) {
    return /^[+]?[\d\s-()]+$/.test(data.contactNumber);
  }
  return true;
}, {
  message: 'Invalid contact number',
  path: ['contactNumber']
});

const Register = () => {
  console.log('Register component mounted');
  const [position, setPosition] = useState([7.9465, -1.0232]); // Ghana default
  const [mapCenter, setMapCenter] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { register: registerUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone_number: '',
      password: '',
      confirmPassword: '',
      role: 'EV Driver',
      stationName: '',
      contactNumber: '',
      services: { charge: true, swap: false }
    }
  });

  console.log('Form hook initialized, errors:', errors);

  const selectedRole = watch('role');

  const handleGetLocation = async () => {
    setIsLocating(true);
    setLocationMessage('Detecting your location...');
    try {
      const loc = await resolveUserLocation();
      const newPos = [loc.lat, loc.lng];
      setPosition(newPos);
      setMapCenter(newPos);
      setLocationMessage(loc.message);
    } catch (err) {
      console.error('Location error:', err);
      setLocationMessage(err.message || 'Could not determine location.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleMapSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const newPos = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        setPosition(newPos);
        setMapCenter(newPos);
        setLocationMessage(`Centered on ${data[0].display_name.split(',')[0]}`);
      } else {
        setLocationMessage('Location not found. Try another city or area.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setLocationMessage('Error searching location.');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (selectedRole === 'Station Operator' && !mapCenter) {
      handleGetLocation();
    }
  }, [selectedRole, mapCenter]);

  const onSubmit = async (data) => {
    console.log('Form submitted with data:', data);
    setError('');
    try {
      let stationData = null;
      if (data.role === 'Station Operator') {
        stationData = {
          stationName: data.stationName,
          contactNumber: data.contactNumber,
          services: data.services,
          lat: position[0],
          lng: position[1]
        };
      }

      console.log('Calling registerUser with:', data.name, data.password, data.role, stationData);
      const registrationData = {
        name: data.name,
        email: data.email,
        phone_number: data.phone_number,
        password: data.password,
        role: data.role,
        stationData
      };
      const userData = await registerUser(registrationData);
      console.log('Registration successful:', userData);
      navigate('/login', { state: { registrationMessage: userData.message } });
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden animate-fade-in mt-16">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neonCyan/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className={`w-full space-y-8 glass-panel p-10 relative z-10 animate-slide-up ${selectedRole === 'Station Operator' ? 'max-w-4xl' : 'max-w-md'}`}>
        <div>
          <div className="flex justify-center text-electricPurple animate-pulse-glow w-16 h-16 mx-auto rounded-full items-center bg-white/5 border border-white/10">
            <Zap size={32} />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Join ChargeMate
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Create an account to get started
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div className={`grid gap-8 ${selectedRole === 'Station Operator' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">User Details</h3>
              <div>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Username"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
                )}
              </div>
              <div>
                <input type="email" className="input-field" placeholder="Email address" autoComplete="email" {...register('email')} />
                {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
              </div>
              <div>
                <input type="tel" className="input-field" placeholder="Phone number" autoComplete="tel" {...register('phone_number')} />
                {errors.phone_number && <p className="mt-1 text-sm text-red-400">{errors.phone_number.message}</p>}
              </div>
              <div>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Password"
                  autoComplete="new-password"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
                )}
              </div>
              <div>
                <input type="password" className="input-field" placeholder="Confirm password" autoComplete="new-password" {...register('confirmPassword')} />
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>}
              </div>
              <div>
                <input type="hidden" {...register('role')} />
                <p className="text-sm font-medium text-gray-300 mb-3">Choose your account type</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setValue('role', 'EV Driver', { shouldValidate: true })}
                    className={`text-left rounded-xl border p-4 transition-all ${selectedRole === 'EV Driver' ? 'border-neonCyan bg-neonCyan/10 shadow-[0_0_18px_rgba(0,242,254,0.14)]' : 'border-white/10 bg-black/20 hover:bg-white/5'}`}
                  >
                    <CarFront size={22} className={selectedRole === 'EV Driver' ? 'text-neonCyan' : 'text-gray-400'} />
                    <span className="mt-3 block font-semibold text-white">EV User</span>
                    <span className="mt-1 block text-xs text-gray-500">Find stations and manage your charging.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('role', 'Station Operator', { shouldValidate: true })}
                    className={`text-left rounded-xl border p-4 transition-all ${selectedRole === 'Station Operator' ? 'border-electricPurple bg-electricPurple/10 shadow-[0_0_18px_rgba(79,172,254,0.14)]' : 'border-white/10 bg-black/20 hover:bg-white/5'}`}
                  >
                    <Building2 size={22} className={selectedRole === 'Station Operator' ? 'text-electricPurple' : 'text-gray-400'} />
                    <span className="mt-3 block font-semibold text-white">Station Operator</span>
                    <span className="mt-1 block text-xs text-gray-500">Manage charging and swap services.</span>
                  </button>
                </div>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-400">{errors.role.message}</p>
                )}
              </div>
            </div>

            {selectedRole === 'Station Operator' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">Station Details</h3>
                <div>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Station Name"
                    {...register('stationName')}
                  />
                  {errors.stationName && (
                    <p className="mt-1 text-sm text-red-400">{errors.stationName.message}</p>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Contact Number"
                    {...register('contactNumber')}
                  />
                  {errors.contactNumber && (
                    <p className="mt-1 text-sm text-red-400">{errors.contactNumber.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-gray-300">Services Offered</p>
                  <div className="flex gap-4">
                    <label className="flex items-center space-x-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        className="form-checkbox text-electricPurple rounded bg-obsidian border-white/20"
                        {...register('services.charge')}
                      />
                      <span>Charging</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        className="form-checkbox text-neonCyan rounded bg-obsidian border-white/20"
                        {...register('services.swap')}
                      />
                      <span>Battery Swap</span>
                    </label>
                  </div>
                  {errors.services && (
                    <p className="mt-1 text-sm text-red-400">{errors.services.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-300 font-medium">Station Location (Click map to pin)</p>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={isLocating}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-neonCyan/10 border border-neonCyan/30 text-neonCyan hover:bg-neonCyan/20 transition-all disabled:opacity-50"
                    >
                      {isLocating ? <Loader2 size={13} className="animate-spin" /> : <Navigation size={13} />}
                      {isLocating ? 'Locating...' : 'Locate Me'}
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Search city or area..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleMapSearch(); } }}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-9 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-neonCyan"
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                    </div>
                    <button
                      type="button"
                      onClick={handleMapSearch}
                      disabled={isSearching}
                      className="px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs text-neonCyan flex items-center justify-center transition-colors disabled:opacity-50"
                    >
                      {isSearching ? <Loader2 size={14} className="animate-spin" /> : 'Search'}
                    </button>
                  </div>

                  {locationMessage && (
                    <p className="text-xs text-neonCyan/80">{locationMessage}</p>
                  )}

                  <div className="h-[250px] w-full rounded-lg overflow-hidden border border-white/10 relative z-0">
                    <MapContainer center={mapCenter || position} zoom={7} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                      {mapCenter && <ChangeView center={mapCenter} />}
                      <TileLayer {...getMapTileConfig()} />
                      <LocationMarker position={position} setPosition={setPosition} />
                    </MapContainer>
                  </div>

                  <p className="text-xs text-gray-400 font-mono flex items-center gap-1">
                    <MapPin size={12} className="text-neonCyan" />
                    Coordinates: {position[0].toFixed(5)}, {position[1].toFixed(5)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating account...' : `Create Account ${selectedRole === 'Station Operator' ? '& Setup Station' : ''}`}
            </button>
          </div>
        </form>
        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-electricPurple hover:text-white transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
