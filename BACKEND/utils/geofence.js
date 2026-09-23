/**
 * Geofencing Utilities for Alausa Secretariat, Ikeja, Lagos State
 * Center Coordinates: 6.6190° N, 3.3582° E
 * Maximum Allowed Radius: 250 meters
 */

const ALAUSA_CENTER = {
  latitude: 6.6190,
  longitude: 3.3582
};

const DEFAULT_MAX_RADIUS_METERS = 250;

/**
 * Calculates the great-circle distance between two coordinates using the Haversine formula.
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's mean radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((R * c) * 100) / 100;
}

/**
 * Validates whether given coordinates fall within the Alausa Secretariat geofence perimeter.
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {number} [maxRadius] 
 * @returns {{ inside: boolean, distance: number, maxRadius: number }}
 */
function checkAlausaGeofence(latitude, longitude, maxRadius = DEFAULT_MAX_RADIUS_METERS) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return { inside: false, distance: null, maxRadius };
  }

  const distance = calculateDistance(
    latitude,
    longitude,
    ALAUSA_CENTER.latitude,
    ALAUSA_CENTER.longitude
  );

  return {
    inside: distance <= maxRadius,
    distance,
    maxRadius
  };
}

module.exports = {
  ALAUSA_CENTER,
  DEFAULT_MAX_RADIUS_METERS,
  calculateDistance,
  checkAlausaGeofence
};
