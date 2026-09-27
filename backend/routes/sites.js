import { Router } from 'express';
import { supabase } from '../services/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { superadminOnly } from '../middleware/rbac.js';
import { sendSuccess, sendCreated } from '../middlewares/responseHandler.js';
import { AppError } from '../middlewares/errorHandler.js';

const router = Router();

const FALLBACK_SITES = [
  { id: 'site-vgt-office', name: 'Office VGT', code: 'VGT-OFFICE', lat: -3.74211, lng: 115.58912, radius: 200, area_name: 'Kantor Operasional VGT Pit 2', status: 'active' },
  { id: 'site-bib-ws', name: 'Workshop Main BIB', code: 'BIB-WS', lat: -3.73100, lng: 115.60500, radius: 350, area_name: 'Workshop Sentral Tambang BIB', status: 'active' },
  { id: 'site-bib-02', name: 'Pit South Site BIB-02', code: 'BIB-02', lat: -3.7389, lng: 115.6120, radius: 200, area_name: 'Pit South Area', status: 'active' },
  { id: 'site-bib-port', name: 'Pelabuhan Khusus Sebamban Port', code: 'BIB-PORT', lat: -3.6950, lng: 115.6800, radius: 300, area_name: 'Terminal Batubara Sebamban', status: 'active' }
];

// GET /api/sites — all authenticated users can read
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .order('name');

    if (error || !data || data.length === 0) {
      return sendSuccess(res, FALLBACK_SITES, 'Daftar site resmi fallback.');
    }
    return sendSuccess(res, data, 'Daftar master site resmi.');
  } catch (err) {
    return sendSuccess(res, FALLBACK_SITES, 'Daftar master site fallback.');
  }
});

// GET /api/sites/:id
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!data) {
      const fb = FALLBACK_SITES.find(s => s.id === req.params.id);
      if (fb) return sendSuccess(res, fb, 'Detail site resmi.');
      throw new AppError('Site tidak ditemukan.', 404, 'RESOURCE_NOT_FOUND');
    }
    return sendSuccess(res, data, 'Detail site resmi.');
  } catch (err) {
    next(err);
  }
});

// POST /api/sites — Superadmin only
router.post('/', requireAuth, superadminOnly, async (req, res, next) => {
  try {
    const { name, code, lat, lng, radius, area_name } = req.body;
    if (!name || lat === undefined || lng === undefined) {
      throw new AppError('Nama site, latitude, dan longitude wajib diisi.', 400, 'VALIDATION_FAILED');
    }

    const siteId = `site-${code?.toLowerCase().replace(/[^a-z0-9]/g, '-') || Date.now()}`;
    const newSite = {
      id: siteId,
      name,
      code: code || `SITE-${Date.now().toString().slice(-4)}`,
      lat: Number(lat),
      lng: Number(lng),
      radius: Number(radius) || 200,
      area_name: area_name || '',
      status: 'active'
    };

    const { data, error } = await supabase
      .from('sites')
      .insert(newSite)
      .select()
      .maybeSingle();

    return sendCreated(res, data || newSite, 'Master lokasi resmi site berhasil ditambahkan.');
  } catch (err) {
    next(err);
  }
});

// PUT /api/sites/:id — Superadmin only
router.put('/:id', requireAuth, superadminOnly, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('sites')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return sendSuccess(res, data || { id: req.params.id, ...req.body }, 'Master lokasi site berhasil diperbarui.');
  } catch (err) {
    next(err);
  }
});

// DELETE /api/sites/:id — Superadmin only
router.delete('/:id', requireAuth, superadminOnly, async (req, res, next) => {
  try {
    const { error } = await supabase.from('sites').delete().eq('id', req.params.id);
    if (error) throw error;
    return sendSuccess(res, { id: req.params.id }, 'Master lokasi site berhasil dihapus.');
  } catch (err) {
    next(err);
  }
});

export default router;
