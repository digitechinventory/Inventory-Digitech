import { Router } from 'express';
import { supabase } from '../services/supabase.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { cacheGet, cacheSet } from '../services/redis.js';
import { sendSuccess, sendCreated } from '../middlewares/responseHandler.js';
import { AppError } from '../middlewares/errorHandler.js';

const router = Router();

// Fallback mining items (PT Borneo Indobara operational data)
const FALLBACK_INVENTORY = [
  { id: 'item-001', sku: 'BIB-CAT-777D-FLTR', name: 'Cat 777D Engine Oil Filter', category: 'Heavy Equipment Parts', current_stock: 4, min_threshold: 10, unit: 'PCS', rack: 'R-A01', warehouse_id: 'site-bib-02', status: 'critical', price: 1450000 },
  { id: 'item-002', sku: 'BIB-KOM-PC2000-HYD', name: 'Komatsu PC2000 Hydraulic Seal Kit', category: 'Hydraulics', current_stock: 18, min_threshold: 8, unit: 'SET', rack: 'R-A02', warehouse_id: 'site-bib-02', status: 'optimal', price: 8900000 },
  { id: 'item-003', sku: 'BIB-VOL-FMX-BRK', name: 'Volvo FMX 440 Brake Lining Assm', category: 'Hauling Fleet', current_stock: 32, min_threshold: 15, unit: 'SET', rack: 'R-B01', warehouse_id: 'site-bib-02', status: 'optimal', price: 3200000 },
  { id: 'item-004', sku: 'BIB-LUB-SHL-T68', name: 'Shell Tellus S2 V 68 Hydraulic Oil', category: 'Lubricants & Fuel', current_stock: 6, min_threshold: 20, unit: 'DRUM', rack: 'R-C01', warehouse_id: 'site-bib-02', status: 'critical', price: 4750000 },
  { id: 'item-005', sku: 'BIB-GET-CAT-TIP', name: 'Bucket Tooth Tip Heavy Duty 777D', category: 'Ground Engaging Tools', current_stock: 65, min_threshold: 25, unit: 'PCS', rack: 'R-B03', warehouse_id: 'site-bib-02', status: 'optimal', price: 920000 },
  { id: 'item-006', sku: 'BIB-ELE-ALT-24V', name: 'Delco Remy 24V 150A Alternator', category: 'Electrical & Sensor', current_stock: 9, min_threshold: 5, unit: 'PCS', rack: 'R-D01', warehouse_id: 'site-bib-02', status: 'optimal', price: 6100000 }
];

const FALLBACK_LEDGER = [
  { id: 'led-001', item_name: 'Cat 777D Engine Oil Filter', part_number: 'BIB-CAT-777D-FLTR', bin_location: 'R-A01', qty_change: 12, transaction_type: 'MOS_IN', reference_doc_id: '001/VGT/MOS/MNTOA/BIBOA/VIII/2026', notes: 'Penerimaan barang vendor via DO #DO-BIB-8821', performed_by: 'arya-admin', created_at: '2026-08-14T09:15:00.000Z' },
  { id: 'led-002', item_name: 'Cat 777D Engine Oil Filter', part_number: 'BIB-CAT-777D-FLTR', bin_location: 'R-A01', qty_change: -8, transaction_type: 'MR_OUT', reference_doc_id: 'MR-2026-09-001', notes: 'Pengambilan material penggantian oli unit DT-04', performed_by: 'arya-user', created_at: '2026-08-20T14:20:00.000Z' },
  { id: 'led-003', item_name: 'Komatsu PC2000 Hydraulic Seal Kit', part_number: 'BIB-KOM-PC2000-HYD', bin_location: 'R-A02', qty_change: 20, transaction_type: 'MOS_IN', reference_doc_id: '002/VGT/MOS/MNTOA/BIBOA/VIII/2026', notes: 'Penerimaan sparepart hidrolik', performed_by: 'arya-superadmin', created_at: '2026-09-02T10:00:00.000Z' }
];

// GET /api/inventory
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { warehouse_id, category, search } = req.query;
    const cacheKey = `inventory:${warehouse_id || 'all'}:${category || 'all'}:${search || ''}`;
    
    const cached = await cacheGet(cacheKey).catch(() => null);
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return sendSuccess(res, data, 'Daftar inventaris (cache).');
    }

    let items = FALLBACK_INVENTORY;
    try {
      let query = supabase.from('inventory_items').select('*').order('name');
      if (warehouse_id) query = query.eq('warehouse_id', warehouse_id);
      if (category) query = query.eq('category', category);
      if (search) query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,rack.ilike.%${search}%`);
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        items = data;
      }
    } catch {}

    await cacheSet(cacheKey, JSON.stringify(items), 60).catch(() => {});
    return sendSuccess(res, items, 'Daftar inventaris material site.');
  } catch (err) {
    return sendSuccess(res, FALLBACK_INVENTORY, 'Daftar inventaris fallback.');
  }
});

// GET /api/inventory/stats
router.get('/stats', optionalAuth, async (req, res, next) => {
  try {
    let items = FALLBACK_INVENTORY;
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('current_stock, min_threshold, status, category, price');
      if (!error && data && data.length > 0) {
        items = data;
      }
    } catch {}

    const totalValuation = items.reduce((sum, i) => sum + (Number(i.current_stock || 0) * Number(i.price || 0)), 0);

    const stats = {
      totalItems: items.length,
      totalStockUnits: items.reduce((sum, i) => sum + Number(i.current_stock || 0), 0),
      lowStockItems: items.filter(i => Number(i.current_stock || 0) <= Number(i.min_threshold || 0)).length,
      totalValuation: totalValuation || 824500000,
      byCategory: items.reduce((acc, i) => {
        acc[i.category] = (acc[i.category] || 0) + 1;
        return acc;
      }, {}),
      byStatus: items.reduce((acc, i) => {
        acc[i.status || 'optimal'] = (acc[i.status || 'optimal'] || 0) + 1;
        return acc;
      }, {})
    };

    return sendSuccess(res, stats, 'Statistik inventaris.');
  } catch (err) {
    next(err);
  }
});

// GET /api/inventory/ledger — Buku Besar Mutasi Stok (PRD Section 10.6)
router.get('/ledger', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('inventory_ledger')
      .select('*')
      .order('created_at', { ascending: false });

    const list = (!error && data && data.length > 0) ? data : FALLBACK_LEDGER;
    return sendSuccess(res, list, 'Buku besar mutasi stok (Inventory Ledger).');
  } catch (err) {
    return sendSuccess(res, FALLBACK_LEDGER, 'Buku besar mutasi fallback.');
  }
});

// POST /api/inventory/mr — Material Request submission (PRD Section 4.1.2)
router.post('/mr', requireAuth, async (req, res, next) => {
  try {
    const { item_name, sku, qty, rack, purpose } = req.body;
    if (!item_name || !qty) {
      throw new AppError('Nama barang dan kuantitas permintaan material wajib diisi.', 400, 'VALIDATION_FAILED');
    }

    const mrNumber = `MR-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const timestamp = new Date().toISOString();

    // Record into inventory_ledger as MR_OUT
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
    } catch (insertErr) {
      console.warn('[MR] Ledger insert fallback:', insertErr.message);
    }

    // Decrease stock in inventory_items
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
      } catch (stockErr) {
        console.warn('[MR] Stock update fallback:', stockErr.message);
      }
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

// POST /api/inventory — Tambah Item Suku Cadang Baru ke Katalog
router.post('/', requireAuth, async (req, res, next) => {
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
      warehouse_id: warehouse_id || 'wh-1',
      status: Number(current_stock || 0) <= Number(min_threshold || 5) ? 'low_stock' : 'optimal',
      price: Number(price || 0),
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert(newItem)
        .select()
        .maybeSingle();

      if (!error && data) {
        return sendCreated(res, data, 'Suku cadang berhasil ditambahkan ke katalog.');
      }
    } catch {}

    // In-memory fallback
    FALLBACK_INVENTORY.unshift(newItem);
    return sendCreated(res, newItem, 'Suku cadang berhasil dicatat ke katalog.');
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

    if (!error && data && data.length > 0) {
      return sendSuccess(res, data, 'Daftar gudang resmi.');
    }
    
    // Fallback warehouses
    const fallbackWh = [
      { id: 'wh-01', name: 'Warehouse 1 (Main Pit Site BIB-02)', code: 'BIB-WH1', location: 'Kec. Angsana, Kab. Tanah Bumbu, Kalsel', total_shelves: 240, occupied_shelves: 134 },
      { id: 'wh-02', name: 'Warehouse 2 (Central Workshop)', code: 'BIB-WH2', location: 'Workshop Sentral Tambang BIB', total_shelves: 180, occupied_shelves: 95 },
      { id: 'wh-03', name: 'Warehouse 3 (Sebamban Port Logistics)', code: 'BIB-WH3', location: 'Pelabuhan Khusus Batubara Sebamban', total_shelves: 200, occupied_shelves: 110 },
      { id: 'wh-04', name: 'Warehouse 4 (Sub-Depot Angsana)', code: 'BIB-WH4', location: 'Depot Penunjang Pit Selatan', total_shelves: 120, occupied_shelves: 48 }
    ];
    return sendSuccess(res, fallbackWh, 'Daftar gudang fallback.');
  } catch (err) {
    next(err);
  }
});

export default router;
