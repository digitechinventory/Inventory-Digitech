import { Router } from 'express';
import { supabase } from '../services/supabase.js';
import { validateCoordinatesAgainstSites } from '../services/geofence.js';
import { sendSuccess } from '../middlewares/responseHandler.js';
import { AppError } from '../middlewares/errorHandler.js';

const router = Router();

// Fallback sites if DB query fails
const FALLBACK_SITES = [
  { id: 'site-vgt-office', name: 'Office VGT', lat: -3.74211, lng: 115.58912, radius: 200, area_name: 'Kantor Operasional VGT Pit 2' },
  { id: 'site-bib-ws', name: 'Workshop Main BIB', lat: -3.73100, lng: 115.60500, radius: 350, area_name: 'Workshop Sentral Tambang BIB' },
  { id: 'site-bib-02', name: 'Pit South Site BIB-02', lat: -3.7389, lng: 115.6120, radius: 200, area_name: 'Pit South Area' },
  { id: 'site-bib-port', name: 'Pelabuhan Khusus Sebamban Port', lat: -3.6950, lng: 115.6800, radius: 300, area_name: 'Terminal Batubara Sebamban' }
];

// GET /api/geo/sites — List all registered sites
router.get('/sites', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('sites').select('*').order('name');
    const sites = (!error && data && data.length > 0) ? data : FALLBACK_SITES;
    return sendSuccess(res, sites, 'Daftar site resmi berhasil diambil');
  } catch (err) {
    return sendSuccess(res, FALLBACK_SITES, 'Daftar site resmi fallback');
  }
});

// POST /api/geo/validate — Validate coordinates using Haversine
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
