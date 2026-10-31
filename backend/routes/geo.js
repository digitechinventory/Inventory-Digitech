import { Router } from 'express';
import { supabase } from '../services/supabase.js';
import { validateCoordinatesAgainstSites } from '../services/geofence.js';
import { sendSuccess } from '../middleware/responseHandler.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
const FALLBACK_SITES = [];

// GET /api/geo/sites â€” List all registered sites
router.get('/sites', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('sites').select('*').order('name');
    const sites = (!error && data && data.length > 0) ? data : FALLBACK_SITES;
    return sendSuccess(res, sites, 'Daftar site resmi berhasil diambil');
  } catch (err) {
    return sendSuccess(res, FALLBACK_SITES, 'Daftar site resmi fallback');
  }
});

// POST /api/geo/validate â€” Validate coordinates using Haversine
router.post('/validate', async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (latitude === undefined || longitude === undefined || isNaN(Number(latitude)) || isNaN(Number(longitude))) {
      throw new AppError('Koordinat latitude dan longitude wajib diisi berupa angka', 400, 'VALIDATION_FAILED');
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    // Fetch registered sites
    let sites = FALLBACK_SITES;
    try {
      const { data, error } = await supabase.from('sites').select('*');
      if (!error && data && data.length > 0) {
        sites = data;
      }
    } catch {}

    const result = validateCoordinatesAgainstSites(lat, lng, sites);

    if (result.isWithinRadius) {
      return sendSuccess(res, result, 'Koordinat berada dalam area operasional resmi site.', 200);
    } else {
      const err = new AppError('Posisi Anda berada di luar area site operasional resmi.', 422, 'GEO_OUT_OF_BOUNDS', {
        currentLatitude: lat,
        currentLongitude: lng,
        nearestSite: result.nearestSite,
        distanceMeters: result.distanceMeters,
        maxAllowedRadiusMeters: result.maxAllowedRadiusMeters
      });
      return next(err);
    }
  } catch (err) {
    next(err);
  }
});

export default router;
