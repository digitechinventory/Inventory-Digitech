import { Router } from 'express';
import { supabase } from '../services/supabase.js';
import localDb from '../services/localDb.js';
import { ensureProjectDatasetsLoaded } from '../services/projectDataService.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';
import { cacheGet, cacheSet, cacheDel } from '../services/redis.js';
import { sendSuccess, sendCreated } from '../middleware/responseHandler.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/inventory
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { warehouse_id, category, search } = req.query;
    let normalizedWh = warehouse_id;
    if (normalizedWh && /^wh-\d$/i.test(normalizedWh)) {
      normalizedWh = normalizedWh.replace(/wh-/i, 'wh-0');
    }
    const cacheKey = `inventory:${normalizedWh || 'all'}:${category || 'all'}:${search || ''}`;

    const cached = await cacheGet(cacheKey).catch(() => null);
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      if (Array.isArray(data) && data.length > 0) {
        return sendSuccess(res, data, 'Daftar inventaris (cache).');
      }
    }

    let items = [];
    try {
      let query = supabase.from('inventory_items').select('*').order('name');
      if (normalizedWh && normalizedWh !== 'ALL') query = query.eq('warehouse_id', normalizedWh);
      if (category) query = query.eq('category', category);
      if (search) query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,rack.ilike.%${search}%`);
      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        items = data;
      } else if (normalizedWh) {
        // Fallback: if warehouse_id filter matches 0 rows (e.g. UUID warehouse_id vs wh-01), return all matching items
        let fallbackQuery = supabase.from('inventory_items').select('*').order('name');
        if (category) fallbackQuery = fallbackQuery.eq('category', category);
        if (search) fallbackQuery = fallbackQuery.or(`name.ilike.%${search}%,sku.ilike.%${search}%,rack.ilike.%${search}%`);
        const { data: fbData, error: fbErr } = await fallbackQuery;
        if (!fbErr && Array.isArray(fbData) && fbData.length > 0) {
          items = fbData;
        }
      }
    } catch {}

    if (items.length === 0 && localDb.isConnected()) {
      try {
        const { rows } = await localDb.query('SELECT * FROM inventory_items ORDER BY name');
        items = rows || [];
      } catch {}
    }

    await cacheSet(cacheKey, JSON.stringify(items), 60).catch(() => {});
    return sendSuccess(res, items, 'Daftar inventaris material site.');
  } catch (err) {
    next(err);
  }
});

// GET /api/inventory/stats
router.get('/stats', optionalAuth, async (req, res, next) => {
  try {
    const ds = await ensureProjectDatasetsLoaded();
    const famousSummary = ds.famous_summary || {};
    const famousTotal = Number(famousSummary.total_items || ds.famous_items?.length || 0);
    const famousFleetUnits = Number(famousSummary.fleet_summary?.total_units || ds.famous_fleet_matrix?.length || 0);
    const famousInstalled = Number(famousSummary.by_status?.['Terinstall'] || 0);
    const famousDamaged = Number(famousSummary.by_status?.['Rusak'] || 0) + Number(famousSummary.by_status?.['Return'] || 0);

    let items = [];
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('current_stock, min_threshold, status, category, price');
      if (!error && Array.isArray(data) && data.length > 0) {
        items = data;
      }
    } catch {}

    if (items.length === 0 && localDb.isConnected()) {
      try {
        const { rows } = await localDb.query('SELECT current_stock, min_threshold, status, category, price FROM inventory_items');
        items = rows || [];
      } catch {}
    }

    const catalogUnits = items.reduce((sum, i) => sum + Number(i.current_stock || 0), 0);
    const totalEnterprise = catalogUnits + famousTotal;
    const totalValuation = items.reduce((sum, i) => sum + (Number(i.current_stock || 0) * Number(i.price || 0)), 0);

    let opnamePendingCount = 0;
    try {
      const { data: opData } = await supabase.from('stock_opname_sessions').select('id, status').eq('status', 'pending_approval');
      if (opData) opnamePendingCount = opData.length;
    } catch {}

    let mosTotal = 0;
    let mosPending = 0;
    try {
      const { data: mosData } = await supabase.from('mos_documents').select('id, status');
      if (mosData) {
        mosTotal = mosData.length;
        mosPending = mosData.filter(m => m.status === 'waiting_admin' || m.status === 'waiting_superadmin' || m.status === 'draft').length;
      }
    } catch {}

    const projectDocs = ds.project_documents || [];
    const countStage = (code) => projectDocs.filter(d => d.stage_code === code).length;

    const stats = {
      totalItems: items.length + famousTotal,
      totalEnterpriseUnits: totalEnterprise,
      totalStockUnits: catalogUnits,
      catalogStockUnits: catalogUnits,
      famousTotalItems: famousTotal,
      famousFleetUnits,
      lowStockItems: items.filter(i => Number(i.current_stock || 0) <= Number(i.min_threshold || 0)).length,
      totalValuation,
      opnamePendingCount,
      mosTotal,
      mosPending,
      lifecycle: {
        rfi: countStage('RFI'),
        pr: countStage('PR'),
        po: countStage('PO'),
        delivery: countStage('Delivery'),
        mos: mosTotal || countStage('MOS'),
        qc: countStage('QC'),
        ops: famousInstalled + catalogUnits,
        decommissioning: famousDamaged
      },
      byCategory: items.reduce((acc, i) => {
        acc[i.category] = (acc[i.category] || 0) + 1;
        return acc;
      }, {}),
      byStatus: items.reduce((acc, i) => {
        acc[i.status || 'optimal'] = (acc[i.status || 'optimal'] || 0) + 1;
        return acc;
      }, {})
    };

    return sendSuccess(res, stats, 'Statistik inventaris terintegrasi.');
  } catch (err) {
    next(err);
  }
});

// GET /api/inventory/ledger â€” Buku Besar Mutasi Stok
router.get('/ledger', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('inventory_ledger')
      .select('*')
      .neq('transaction_type', 'SYSTEM_DATASET')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      return sendSuccess(res, data, 'Buku besar mutasi stok (Inventory Ledger).');
    }

    if (localDb.isConnected()) {
      const { rows } = await localDb.query('SELECT * FROM inventory_ledger ORDER BY created_at DESC');
      return sendSuccess(res, rows || [], 'Buku besar mutasi stok (Database).');
    }

    return sendSuccess(res, [], 'Buku besar mutasi stok.');
  } catch (err) {
    next(err);
  }
});

// POST /api/inventory/ledger/bulk-delete
router.post('/ledger/bulk-delete', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError('Daftar ID mutasi yang akan dihapus wajib disertakan.', 400, 'VALIDATION_FAILED');
    }

    try {
      await supabase.from('inventory_ledger').delete().in('id', ids);
    } catch {}
    if (localDb.isConnected()) {
      await localDb.query('DELETE FROM inventory_ledger WHERE id = ANY($1::text[])', [ids]).catch(() => {});
    }

    return sendSuccess(res, { count: ids.length, ids }, `${ids.length} baris mutasi stok berhasil dihapus.`);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/inventory/ledger/:id
router.delete('/ledger/:id', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    try {
      await supabase.from('inventory_ledger').delete().eq('id', id);
    } catch {}
    if (localDb.isConnected()) {
      await localDb.query('DELETE FROM inventory_ledger WHERE id = $1', [id]).catch(() => {});
    }

    return sendSuccess(res, { id }, 'Baris mutasi stok berhasil dihapus.');
  } catch (err) {
    next(err);
  }
});

// PATCH /api/inventory/ledger/:id
router.patch('/ledger/:id', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reference_doc_id, notes, bin_location, performed_by } = req.body;

    const updatePayload = {};
    if (reference_doc_id !== undefined) updatePayload.reference_doc_id = reference_doc_id;
    if (notes !== undefined) updatePayload.notes = notes;
    if (bin_location !== undefined) updatePayload.bin_location = bin_location;
    if (performed_by !== undefined) updatePayload.performed_by = performed_by;

    try {
      await supabase.from('inventory_ledger').update(updatePayload).eq('id', id);
    } catch {}

    return sendSuccess(res, { id, ...updatePayload }, 'Data baris mutasi berhasil diperbarui.');
  } catch (err) {
    next(err);
  }
});

// POST /api/inventory/mr â€” Material Request submission
router.post('/mr', requireAuth, async (req, res, next) => {
  try {
    const { item_name, sku, qty, rack, purpose } = req.body;
    if (!item_name || !qty) {
      throw new AppError('Nama barang dan kuantitas permintaan material wajib diisi.', 400, 'VALIDATION_FAILED');
    }

    const mrNumber = `MR-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const timestamp = new Date().toISOString();

    try {
      await supabase.from('inventory_ledger').insert({
        item_name,
        part_number: sku || '-',
        bin_location: rack || 'R-A01',
        qty_change: -Math.abs(Number(qty)),
        transaction_type: 'MR_OUT',
        reference_doc_id: mrNumber,
        notes: purpose || 'Pengambilan material kerja operasional',
        performed_by: req.user?.full_name || 'Staff Lapangan',
        created_at: timestamp
      });
    } catch {}

    if (sku) {
      try {
        const { data: item } = await supabase
          .from('inventory_items')
          .select('id, current_stock')
          .eq('sku', sku)
          .maybeSingle();

        if (item) {
          await supabase
            .from('inventory_items')
            .update({
              current_stock: Math.max(0, Number(item.current_stock || 0) - Number(qty))
            })
            .eq('id', item.id);
        }
      } catch {}
    }

    return sendCreated(
      res,
      { mrNumber, item_name, sku, qty, status: 'approved', timestamp },
      'Permintaan Material (MR) berhasil diajukan dan dibukukan ke buku besar mutasi stok.'
    );
  } catch (err) {
    next(err);
  }
});

// POST /api/inventory â€” Tambah Item Suku Cadang Baru ke Katalog
router.post('/', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { name, sku, category, current_stock, min_threshold, unit, rack, warehouse_id, price } = req.body;
    if (!name || !sku) {
      throw new AppError('Nama material dan SKU wajib diisi.', 400, 'VALIDATION_FAILED');
    }

    const newItem = {
      id: `item-${Date.now()}`,
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      category: category || 'General Spareparts',
      current_stock: Number(current_stock || 0),
      min_threshold: Number(min_threshold || 5),
      unit: unit || 'PCS',
      rack: rack || 'R-A01',
      warehouse_id: warehouse_id || 'wh-01',
      status: Number(current_stock || 0) <= Number(min_threshold || 5) ? 'low_stock' : 'optimal',
      price: Number(price || 0),
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('inventory_items')
      .insert(newItem)
      .select()
      .maybeSingle();

    await cacheDel('inventory:all:all:').catch(() => {});
    return sendCreated(res, (!error && data) ? data : newItem, 'Suku cadang berhasil ditambahkan ke katalog.');
  } catch (err) {
    next(err);
  }
});

// DELETE /api/inventory/items/:sku
router.delete('/items/:sku', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { sku } = req.params;
    await supabase.from('inventory_items').delete().eq('sku', sku);
    if (localDb.isConnected()) {
      await localDb.query('DELETE FROM inventory_items WHERE sku = $1', [sku]).catch(() => {});
    }
    return sendSuccess(res, { sku }, 'Suku cadang berhasil dihapus dari katalog.');
  } catch (err) {
    next(err);
  }
});

// POST /api/inventory/items/bulk-delete
router.post('/items/bulk-delete', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { skus } = req.body;
    if (!Array.isArray(skus) || skus.length === 0) {
      throw new AppError('Daftar SKU suku cadang wajib disertakan.', 400, 'VALIDATION_FAILED');
    }
    await supabase.from('inventory_items').delete().in('sku', skus);
    if (localDb.isConnected()) {
      await localDb.query('DELETE FROM inventory_items WHERE sku = ANY($1::text[])', [skus]).catch(() => {});
    }
    return sendSuccess(res, { count: skus.length, skus }, `${skus.length} suku cadang berhasil dihapus dari katalog.`);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/inventory/items/:sku
router.patch('/items/:sku', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { sku } = req.params;
    const { name, category, current_stock, min_threshold, unit, rack, price } = req.body;

    const updatePayload = {};
    if (name !== undefined) updatePayload.name = name;
    if (category !== undefined) updatePayload.category = category;
    if (current_stock !== undefined) updatePayload.current_stock = Number(current_stock);
    if (min_threshold !== undefined) updatePayload.min_threshold = Number(min_threshold);
    if (unit !== undefined) updatePayload.unit = unit;
    if (rack !== undefined) updatePayload.rack = rack;
    if (price !== undefined) updatePayload.price = Number(price);

    await supabase.from('inventory_items').update(updatePayload).eq('sku', sku);
    return sendSuccess(res, { sku, ...updatePayload }, 'Informasi suku cadang berhasil diperbarui.');
  } catch (err) {
    next(err);
  }
});

// GET /api/inventory/warehouses
router.get('/warehouses', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .order('id');

    if (!error && Array.isArray(data) && data.length > 0) {
      return sendSuccess(res, data, 'Daftar gudang resmi.');
    }

    if (localDb.isConnected()) {
      const { rows } = await localDb.query('SELECT * FROM warehouses ORDER BY id');
      return sendSuccess(res, rows || [], 'Daftar gudang resmi (Database).');
    }

    return sendSuccess(res, [], 'Daftar gudang resmi.');
  } catch (err) {
    next(err);
  }
});

export default router;
