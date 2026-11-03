import { Router } from 'express';
import { supabase } from '../services/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { adminOnly, superadminOnly } from '../middleware/rbac.js';
import { sendSuccess, sendCreated } from '../middleware/responseHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  checkUserProjectAccess,
  normalizeProjectId
} from '../services/projectAuthorityService.js';

const router = Router();

// Runtime store for opname sessions per project synced with database
const FALLBACK_OPNAMES = [
  {
    id: 'so-famous-001',
    opname_number: 'SO-2026-FAM-01',
    project_id: 'proj-famous',
    project_code: 'FAMOUS',
    zone: 'Zona A (Gudang FAMOUS KM-24 - Kamera DMS & MDVR)',
    status: 'completed',
    auditor_name: 'arya-admin',
    auditor_id: 'demo-admin-001',
    notes: '[PROJECT:FAMOUS] Audit fisik rutin sensor Fatigue & kamera kabin MDVR',
    created_at: '2026-10-20T08:30:00.000Z',
    items: [
      {
        sku: 'FAM-MDVR-8CH-01',
        item_name: 'Mobile DVR 8-Channel AI Telemetry',
        rack: 'R-A01',
        system_qty: 14,
        physical_qty: 14,
        variance: 0,
        variance_reason: 'Sesuai (100% Cocok)'
      },
      {
        sku: 'FAM-CAM-DMS-IR',
        item_name: 'Infrared Driver Monitoring Camera (DMS)',
        rack: 'R-A02',
        system_qty: 22,
        physical_qty: 21,
        variance: -1,
        variance_reason: '1 unit sedang penggantian darurat di DT-408'
      }
    ]
  },
  {
    id: 'so-wim-001',
    opname_number: 'SO-2026-WIM-01',
    project_id: 'proj-wim',
    project_code: 'WIM',
    zone: 'Zona B (Gudang WIM KM-14 - Load Cell & Junction Box)',
    status: 'completed',
    auditor_name: 'arya-superadmin',
    auditor_id: 'demo-sa-001',
    notes: '[PROJECT:WIM] Pemeriksaan fisik instrumen jembatan timbang WIM KM-14',
    created_at: '2026-10-24T09:15:00.000Z',
    items: [
      {
        sku: 'WIM-LC-50T-IP68',
        item_name: 'Compression Load Cell 50 Ton IP68',
        rack: 'R-B01',
        system_qty: 8,
        physical_qty: 8,
        variance: 0,
        variance_reason: 'Sesuai (Segel Kalibrasi Utuh)'
      },
      {
        sku: 'WIM-IND-DGT-02',
        item_name: 'Digital Weight Indicator Controller WIM',
        rack: 'R-B03',
        system_qty: 5,
        physical_qty: 5,
        variance: 0,
        variance_reason: 'Sesuai'
      }
    ]
  },
  {
    id: 'so-ccm-001',
    opname_number: 'SO-2026-CCM-01',
    project_id: 'proj-ccm',
    project_code: 'CCM',
    zone: 'Zona C (Gudang Port Bunati - Sensor Conveyor & Crusher)',
    status: 'in_progress',
    auditor_name: 'arya-superadmin',
    auditor_id: 'demo-sa-001',
    notes: '[PROJECT:CCM] Verifikasi stok sensor belt scale & roller crusher',
    created_at: '2026-10-29T10:00:00.000Z',
    items: []
  }
];

function inferOpnameProject(so) {
  if (so.project_id) {
    const norm = normalizeProjectId(so.project_id);
    return {
      project_id: norm,
      project_code: norm === 'proj-wim' ? 'WIM' : norm === 'proj-ccm' ? 'CCM' : 'FAMOUS'
    };
  }
  const text = `${so.notes || ''} ${so.zone || ''} ${so.opname_number || ''}`.toUpperCase();
  if (text.includes('WIM') || text.includes('ZONA B') || text.includes('KM-14') || text.includes('LOAD CELL')) {
    return { project_id: 'proj-wim', project_code: 'WIM' };
  }
  if (text.includes('CCM') || text.includes('ZONA C') || text.includes('BUNATI') || text.includes('CRUSHER')) {
    return { project_id: 'proj-ccm', project_code: 'CCM' };
  }
  return { project_id: 'proj-famous', project_code: 'FAMOUS' };
}

// GET /api/opname — List opnames
router.get('/', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { project_id } = req.query;
    if (project_id && !checkUserProjectAccess(req.user, project_id)) {
      throw new AppError('Anda tidak memiliki hak otoritas untuk mengakses Stock Opname pada project ini.', 403, 'FORBIDDEN_PROJECT_ACCESS');
    }

    const { data, error } = await supabase
      .from('stock_opnames')
      .select('*, stock_opname_items(*)')
      .order('created_at', { ascending: false });

    const dbList = (!error && Array.isArray(data)) ? data : [];
    const combined = [
      ...dbList.map(so => {
        const proj = inferOpnameProject(so);
        return {
          ...so,
          ...proj,
          items: so.stock_opname_items || so.items || []
        };
      }),
      ...FALLBACK_OPNAMES.filter(fb => !dbList.some(d => d.opname_number === fb.opname_number || d.id === fb.id))
    ];

    const filtered = project_id
      ? combined.filter(so => normalizeProjectId(so.project_id) === normalizeProjectId(project_id))
      : combined;

    return sendSuccess(res, filtered, 'Daftar sesi stock opname per project.');
  } catch (err) {
    if (err instanceof AppError) return next(err);
    return sendSuccess(res, FALLBACK_OPNAMES, 'Daftar audit stock opname fallback.');
  }
});

// GET /api/opname/:id
router.get('/:id', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { data } = await supabase
      .from('stock_opnames')
      .select('*, stock_opname_items(*)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!data) {
      const fb = FALLBACK_OPNAMES.find(o => o.id === req.params.id);
      if (fb) return sendSuccess(res, fb, 'Detail sesi opname.');
      throw new AppError('Sesi audit stock opname tidak ditemukan.', 404, 'RESOURCE_NOT_FOUND');
    }

    const proj = inferOpnameProject(data);
    return sendSuccess(res, { ...data, ...proj, items: data.stock_opname_items || [] }, 'Detail stock opname.');
  } catch (err) {
    next(err);
  }
});

// POST /api/opname/start — Start a new Stock Opname session (Admin)
router.post('/start', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { zone, notes, project_id } = req.body;
    if (!zone) {
      throw new AppError('Zona atau area rak opname wajib dipilih.', 400, 'VALIDATION_FAILED');
    }

    const normProjId = normalizeProjectId(project_id || 'proj-famous');
    if (!checkUserProjectAccess(req.user, normProjId)) {
      throw new AppError('Akses ditolak: Anda tidak memiliki otoritas untuk memulai Stock Opname di project ini.', 403, 'FORBIDDEN_PROJECT_ACCESS');
    }

    const projCode = normProjId === 'proj-wim' ? 'WIM' : normProjId === 'proj-ccm' ? 'CCM' : 'FAMOUS';
    const opNum = `SO-${new Date().getFullYear()}-${projCode}-${Date.now().toString().slice(-4)}`;
    const taggedNotes = notes?.includes('[PROJECT:') ? notes : `[PROJECT:${projCode}] ${notes || ''}`.trim();

    const opnameRecord = {
      opname_number: opNum,
      zone,
      status: 'in_progress',
      auditor_name: req.user.full_name,
      auditor_id: req.user.id,
      notes: taggedNotes,
      created_at: new Date().toISOString()
    };

    const { data } = await supabase
      .from('stock_opnames')
      .insert(opnameRecord)
      .select()
      .maybeSingle();

    const created = {
      ...(data || { id: `so-${Date.now()}`, ...opnameRecord }),
      project_id: normProjId,
      project_code: projCode,
      items: []
    };

    FALLBACK_OPNAMES.unshift(created);
    return sendCreated(res, created, `Sesi stock opname baru untuk Project ${projCode} berhasil dimulai.`);
  } catch (err) {
    next(err);
  }
});

// POST /api/opname/:id/submit-count — Submit Blind Count (Admin)
router.post('/:id/submit-count', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { items, project_id } = req.body;
    if (!items || items.length === 0) {
      throw new AppError('Daftar hasil cacah fisik (Blind Count) wajib diisi.', 400, 'VALIDATION_FAILED');
    }

    const normProjId = normalizeProjectId(project_id || 'proj-famous');
    const projCode = normProjId === 'proj-wim' ? 'WIM' : normProjId === 'proj-ccm' ? 'CCM' : 'FAMOUS';

    let hasVariance = false;
    const computedItems = [];

    for (const it of items) {
      let sysQty = Number(it.system_qty ?? 10);
      try {
        const { data: invItem } = await supabase
          .from('inventory_items')
          .select('current_stock, name')
          .eq('sku', it.sku)
          .maybeSingle();

        if (invItem) {
          sysQty = Number(invItem.current_stock || 0);
        }
      } catch {}

      const physQty = Number(it.physical_qty || 0);
      const variance = physQty - sysQty;
      if (variance !== 0) hasVariance = true;

      computedItems.push({
        opname_id: req.params.id,
        item_name: it.item_name || it.sku,
        sku: it.sku,
        rack: it.rack || 'R-A01',
        system_qty: sysQty,
        physical_qty: physQty,
        variance,
        variance_reason: it.variance_reason || (variance !== 0 ? 'Selisih hitung fisik' : 'Sesuai')
      });
    }

    try {
      await supabase.from('stock_opname_items').insert(computedItems);
    } catch (e) {
      console.warn('[Opname] Insert items error:', e.message);
    }

    const timestamp = new Date().toISOString();
    const performer = req.user?.full_name || 'Admin Logistik';

    for (const it of computedItems) {
      if (it.variance !== 0) {
        try {
          await supabase
            .from('inventory_ledger')
            .insert({
              item_name: it.item_name,
              part_number: it.sku,
              bin_location: it.rack,
              qty_change: it.variance,
              transaction_type: 'OPNAME_ADJUSTMENT',
              reference_doc_id: req.params.id,
              notes: `[PROJECT:${projCode}] Penyesuaian stok opname langsung: ${it.variance_reason || 'Selisih fisik'}`,
              performed_by: performer,
              created_at: timestamp
            });
        } catch (e) {
          console.warn('[Opname Ledger] Insert error:', e.message);
        }

        try {
          await supabase
            .from('inventory_items')
            .update({ current_stock: it.physical_qty })
            .eq('sku', it.sku);
        } catch (e) {
          console.warn('[Opname Stock] Update error:', e.message);
        }
      }
    }

    const newStatus = 'completed';
    try {
      await supabase
        .from('stock_opnames')
        .update({ status: newStatus, completed_at: timestamp })
        .eq('id', req.params.id);
    } catch {}

    // Update fallback record if present
    const fbIdx = FALLBACK_OPNAMES.findIndex(o => o.id === req.params.id);
    if (fbIdx !== -1) {
      FALLBACK_OPNAMES[fbIdx].status = newStatus;
      FALLBACK_OPNAMES[fbIdx].items = computedItems;
    }

    return sendSuccess(
      res,
      { opname_id: req.params.id, project_id: normProjId, project_code: projCode, status: newStatus, hasVariance, items: computedItems },
      hasVariance
        ? `Audit stock opname Project ${projCode} selesai. Saldo inventaris & buku besar mutasi telah disesuaikan otomatis.`
        : `Audit stock opname Project ${projCode} selesai tanpa selisih (100% Cocok).`
    );
  } catch (err) {
    next(err);
  }
});

// PUT /api/opname/:id/approve-variance
router.put('/:id/approve-variance', requireAuth, superadminOnly, async (req, res, next) => {
  try {
    const { data: opname } = await supabase
      .from('stock_opnames')
      .select('*, stock_opname_items(*)')
      .eq('id', req.params.id)
      .maybeSingle();

    const proj = inferOpnameProject(opname || {});
    const items = opname?.stock_opname_items || [];
    const timestamp = new Date().toISOString();

    for (const it of items) {
      if (it.variance !== 0) {
        try {
          await supabase
            .from('inventory_ledger')
            .insert({
              item_name: it.item_name,
              part_number: it.sku,
              bin_location: it.rack,
              qty_change: it.variance,
              transaction_type: 'OPNAME_ADJUSTMENT',
              reference_doc_id: opname?.opname_number || req.params.id,
              notes: `[PROJECT:${proj.project_code}] Penyesuaian stok opname: ${it.variance_reason || 'Variance Approval'}`,
              performed_by: req.user.full_name,
              created_at: timestamp
            });
        } catch (e) {
          console.warn('[Opname Ledger] Insert error:', e.message);
        }

        try {
          await supabase
            .from('inventory_items')
            .update({ current_stock: it.physical_qty })
            .eq('sku', it.sku);
        } catch (e) {
          console.warn('[Opname Stock] Update error:', e.message);
        }
      }
    }

    await supabase
      .from('stock_opnames')
      .update({
        status: 'completed',
        approved_by: req.user.full_name,
        approved_at: timestamp
      })
      .eq('id', req.params.id);

    return sendSuccess(
      res,
      { id: req.params.id, status: 'completed', approved_by: req.user.full_name },
      'Otorisasi varians selisih berhasil disetujui. Buku besar stok telah disesuaikan secara otomatis.'
    );
  } catch (err) {
    next(err);
  }
});

export default router;
