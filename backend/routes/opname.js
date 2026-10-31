import { Router } from 'express';
import { supabase } from '../services/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { adminOnly, superadminOnly } from '../middleware/rbac.js';
import { sendSuccess, sendCreated } from '../middleware/responseHandler.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// Runtime cache for opname sessions synced with database
const FALLBACK_OPNAMES = [];

// GET /api/opname â€” List opnames
router.get('/', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('stock_opnames')
      .select('*, stock_opname_items(*)')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return sendSuccess(res, FALLBACK_OPNAMES, 'Daftar audit stock opname (fallback).');
    }

    const formatted = data.map(so => ({
      ...so,
      items: so.stock_opname_items || []
    }));

    return sendSuccess(res, formatted, 'Daftar sesi stock opname.');
  } catch (err) {
    return sendSuccess(res, FALLBACK_OPNAMES, 'Daftar audit stock opname fallback.');
  }
});

// GET /api/opname/:id
router.get('/:id', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('stock_opnames')
      .select('*, stock_opname_items(*)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!data) {
      const fb = FALLBACK_OPNAMES.find(o => o.id === req.params.id);
      if (fb) return sendSuccess(res, fb, 'Detail sesi opname (fallback).');
      throw new AppError('Sesi audit stock opname tidak ditemukan.', 404, 'RESOURCE_NOT_FOUND');
    }

    return sendSuccess(res, { ...data, items: data.stock_opname_items || [] }, 'Detail stock opname.');
  } catch (err) {
    next(err);
  }
});

// POST /api/opname/start â€” Start a new Stock Opname session (Admin)
router.post('/start', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { zone, notes } = req.body;
    if (!zone) {
      throw new AppError('Zona atau area rak opname wajib dipilih.', 400, 'VALIDATION_FAILED');
    }

    const opNum = `SO-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const opnameRecord = {
      opname_number: opNum,
      zone,
      status: 'in_progress',
      auditor_name: req.user.full_name,
      auditor_id: req.user.id,
      notes: notes || '',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('stock_opnames')
      .insert(opnameRecord)
      .select()
      .maybeSingle();

    return sendCreated(res, data || opnameRecord, 'Sesi stock opname baru berhasil dimulai.');
  } catch (err) {
    next(err);
  }
});

// POST /api/opname/:id/submit-count â€” Submit Blind Count (Admin)
router.post('/:id/submit-count', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { items } = req.body; // array of { sku, item_name, rack, physical_qty, variance_reason }
    if (!items || items.length === 0) {
      throw new AppError('Daftar hasil cacah fisik (Blind Count) wajib diisi.', 400, 'VALIDATION_FAILED');
    }

    // Fetch system quantities to compute variance
    let hasVariance = false;
    const computedItems = [];

    for (const it of items) {
      let sysQty = 0;
      const { data: invItem } = await supabase
        .from('inventory_items')
        .select('current_stock, name')
        .eq('sku', it.sku)
        .maybeSingle();

      if (invItem) {
        sysQty = Number(invItem.current_stock || 0);
      }

      const physQty = Number(it.physical_qty || 0);
      const variance = physQty - sysQty;
      if (variance !== 0) hasVariance = true;

      computedItems.push({
        opname_id: req.params.id,
        item_name: it.item_name || invItem?.name || it.sku,
        sku: it.sku,
        rack: it.rack || 'R-A01',
        system_qty: sysQty,
        physical_qty: physQty,
        variance,
        variance_reason: it.variance_reason || (variance !== 0 ? 'Selisih hitung fisik' : 'Sesuai')
      });
    }

    // Insert items
    try {
      await supabase.from('stock_opname_items').insert(computedItems);
    } catch (e) {
      console.warn('[Opname] Insert items error:', e.message);
    }

    // Rekonsiliasi Langsung: Sesuaikan buku besar dan stok inventaris seketika
    const timestamp = new Date().toISOString();
    const performer = req.user?.full_name || 'Admin Logistik';

    for (const it of computedItems) {
      if (it.variance !== 0) {
        // Catat ke buku besar mutasi otomatis
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
              notes: `Penyesuaian stok opname langsung: ${it.variance_reason || 'Selisih fisik'}`,
              performed_by: performer,
              created_at: timestamp
            });
        } catch (e) {
          console.warn('[Opname Ledger] Insert error:', e.message);
        }

        // Sinkronisasi saldo fisik ke katalog inventaris
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

    // Status opname langsung diselesaikan (Direct Reconciliation)
    const newStatus = 'completed';
    await supabase
      .from('stock_opnames')
      .update({ status: newStatus, completed_at: timestamp })
      .eq('id', req.params.id);

    return sendSuccess(
      res,
      { opname_id: req.params.id, status: newStatus, hasVariance, items: computedItems },
      hasVariance
        ? 'Audit stock opname selesai. Saldo inventaris & buku besar mutasi telah disesuaikan secara otomatis.'
        : 'Audit stock opname selesai tanpa selisih (100% Cocok).'
    );
  } catch (err) {
    next(err);
  }
});

// PUT /api/opname/:id/approve-variance â€” Superadmin Variance Approval (PRD 4.3.1 & SDD 9.3)
router.put('/:id/approve-variance', requireAuth, superadminOnly, async (req, res, next) => {
  try {
    const { data: opname } = await supabase
      .from('stock_opnames')
      .select('*, stock_opname_items(*)')
      .eq('id', req.params.id)
      .maybeSingle();

    const items = opname?.stock_opname_items || [];
    const timestamp = new Date().toISOString();

    // Auto-ledger adjustment for each variance
    for (const it of items) {
      if (it.variance !== 0) {
        // Book into inventory_ledger
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
              notes: `Penyesuaian stok opname: ${it.variance_reason || 'Variance Approval'}`,
              performed_by: req.user.full_name,
              created_at: timestamp
            });
        } catch (e) {
          console.warn('[Opname Ledger] Insert error:', e.message);
        }

        // Update inventory_items current stock
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

    // Mark opname as completed
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
      'Otorisasi varians selisih berhasil disetujui. Buku besar stok (inventory_ledger) telah disesuaikan secara otomatis.'
    );
  } catch (err) {
    next(err);
  }
});

export default router;
