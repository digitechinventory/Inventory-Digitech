/**
 * Geofencing & Haversine Distance Calculation Service
 * PRD Section 6.1 & SDD Section 4
 */

export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Radius of Earth in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
};

/**
 * Validate user coordinate against a list of registered sites
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {Array} sites 
 * @returns {Object} result with matchedSite or closest site details
 */
export const validateCoordinatesAgainstSites = (latitude, longitude, sites = []) => {
  if (!latitude || !longitude || !sites || sites.length === 0) {
    return {
      isWithinRadius: false,
      nearestSite: null,
      distanceMeters: null,
      maxAllowedRadiusMeters: 200
    };
  }

  let matchedSite = null;
  let minDistance = Infinity;
  let closestSite = null;

  for (const site of sites) {
    const siteLat = Number(site.lat || site.latitude);
    const siteLng = Number(site.lng || site.longitude);
    const radius = Number(site.radius || site.radius_meters || 200);

    if (isNaN(siteLat) || isNaN(siteLng)) continue;

    const distance = calculateHaversineDistance(siteLat, siteLng, latitude, longitude);

    if (distance < minDistance) {
      minDistance = distance;
      closestSite = site;
    }

    if (distance <= radius) {
      matchedSite = {
        ...site,
        calculatedDistance: distance,
        maxRadius: radius
      };
      break; // Found within tolerance!
    }
  }

  if (matchedSite) {
    return {
      isWithinRadius: true,
      siteId: matchedSite.id,
      canonicalSiteName: matchedSite.name || matchedSite.site_name,
      distanceMeters: Math.round(matchedSite.calculatedDistance * 10) / 10,
      maxAllowedRadiusMeters: matchedSite.maxRadius
    };
  }

  return {
    isWithinRadius: false,
    siteId: closestSite?.id || null,
    nearestSite: closestSite?.name || closestSite?.site_name || 'Tidak diketahui',
    distanceMeters: Math.round(minDistance * 10) / 10,
    maxAllowedRadiusMeters: closestSite?.radius || 200
  };
};
