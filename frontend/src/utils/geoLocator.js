/**
 * Multi-layer geolocation utility that reliably resolves user coordinates.
 * 
 * Strategy:
 * 1. navigator.geolocation with high accuracy (GPS / fine Wi-Fi)
 * 2. navigator.geolocation with low accuracy (fast network / cell / cached)
 * 3. IP-based geolocation fallback (ipwho.is -> freeipapi.com)
 * 
 * This ensures the map always successfully locates the user, even on desktop
 * machines without GPS, when Windows location services are off, or when GPS times out.
 */

export const resolveUserLocation = async () => {
  let browserLocationIssue = '';

  // Step 1 & 2: Try browser geolocation
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      browserLocationIssue = 'Precise browser location requires HTTPS (or localhost).';
    } else {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            (err) => {
              // If high accuracy times out or is unavailable, try low accuracy
              if (err.code === 3 || err.code === 2) {
                navigator.geolocation.getCurrentPosition(
                  resolve,
                  reject,
                  { enableHighAccuracy: false, timeout: 7000, maximumAge: 300000 }
                );
              } else {
                reject(err);
              }
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
          );
        });

        return {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy || 20,
          source: 'browser',
          message: 'Your precise location is shown on the map.',
        };
      } catch (browserError) {
        if (browserError.code === 1) {
          browserLocationIssue = 'Browser location permission was denied. Allow location in this site’s browser settings.';
        } else if (browserError.code === 3) {
          browserLocationIssue = 'The browser could not get a precise location fix.';
        } else {
          browserLocationIssue = 'Browser location is unavailable.';
        }
        console.warn('Browser geolocation failed, attempting IP fallback:', browserError);
      }
    }
  } else {
    browserLocationIssue = 'This browser does not provide location services.';
  }

  // Step 3: IP Geolocation Fallback
  try {
    const res = await fetch('https://ipwho.is/');
    const data = await res.json();
    if (data && data.success && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
      return {
        lat: data.latitude,
        lng: data.longitude,
        accuracy: 2500, // approximate city-level
        source: 'ip',
        city: data.city,
        message: `Approximate location found (${data.city || 'local network'}). ${browserLocationIssue} This network-based estimate is not your precise location.`,
      };
    }
  } catch (ipError) {
    console.warn('ipwho.is failed, trying secondary IP provider:', ipError);
  }

  // Step 4: Secondary IP Fallback
  try {
    const res2 = await fetch('https://freeipapi.com/api/json');
    const data2 = await res2.json();
    if (data2 && typeof data2.latitude === 'number' && typeof data2.longitude === 'number') {
      return {
        lat: data2.latitude,
        lng: data2.longitude,
        accuracy: 5000,
        source: 'ip',
        city: data2.cityName,
        message: `Approximate location found (${data2.cityName || 'local network'}). ${browserLocationIssue} This network-based estimate is not your precise location.`,
      };
    }
  } catch (secondaryError) {
    console.warn('Secondary IP fallback failed:', secondaryError);
  }

  throw new Error(browserLocationIssue || 'Unable to determine location. Please allow browser location access or search your city.');
};
