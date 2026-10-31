// Haversine Distance Utility (returns distance in meters)
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(Number(lat2 || 0) - Number(lat1 || 0));
  const dLon = toRad(Number(lon2 || 0) - Number(lon1 || 0));

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(Number(lat1 || 0))) *
      Math.cos(toRad(Number(lat2 || 0))) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

