import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from '../services/supabase.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { sendSuccess, sendCreated } from '../middlewares/responseHandler.js';
import { AppError } from '../middlewares/errorHandler.js';
import { FALLBACK_MOS, generateUniqueDocNumber } from './mos.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Real FAMOUS Dataset (9,416 real items & 825 fleet trucks)
let FAMOUS_ITEMS = [];
let FAMOUS_FLEET_MATRIX = [];
let FAMOUS_SUMMARY = {
  total_items: 0,
  by_category: {},
  by_status: {},
  by_mitra: {},
  fleet_summary: { total_units: 0, optimal_units: 0, partial_units: 0, critical_units: 0 }
};

try {
  const famousItemsPath = path.join(__dirname, '..', 'data', 'famous', 'famous_items.json');
  const famousFleetPath = path.join(__dirname, '..', 'data', 'famous', 'famous_fleet_matrix.json');
  const famousSummaryPath = path.join(__dirname, '..', 'data', 'famous', 'famous_summary.json');

  if (fs.existsSync(famousItemsPath)) {
    FAMOUS_ITEMS = JSON.parse(fs.readFileSync(famousItemsPath, 'utf-8'));
  }
  if (fs.existsSync(famousFleetPath)) {
    FAMOUS_FLEET_MATRIX = JSON.parse(fs.readFileSync(famousFleetPath, 'utf-8'));
  }
  if (fs.existsSync(famousSummaryPath)) {
    FAMOUS_SUMMARY = JSON.parse(fs.readFileSync(famousSummaryPath, 'utf-8'));
  }
  console.log(`[Project Inventory] Loaded real FAMOUS dataset: ${FAMOUS_ITEMS.length} items, ${FAMOUS_FLEET_MATRIX.length} fleet units.`);
} catch (err) {
  console.error('[Project Inventory] Failed loading FAMOUS dataset:', err);
}

// In-memory fallback if Supabase is offline
let FALLBACK_PROJECTS = [
  {
    id: 'proj-wim',
    code: 'WIM',
    name: 'WIM (Weigh-In-Motion Scale System)',
    description: 'Sistem timbangan dinamis jembatan timbang hauling batubara, sensor load cell, telemetry link, dan kamera ANPR.',
    site_location: 'BIB Pit Sebamban KM-14 & KM-28',
    color_theme: 'emerald',
    status: 'active',
    created_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'proj-famous',
    code: 'FAMOUS',
    name: 'FAMOUS (Fleet Asset Management & Operations Unified System)',
    description: 'Telematika alat berat tambang, GPS tracker presisi tinggi, fuel level sensors, MDVR fatigue camera, dan OBD CAN-Bus interface.',
    site_location: 'Pit South BIB & Workshop Utama',
    color_theme: 'blue',
    status: 'active',
    created_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'proj-ccm',
    code: 'CCM',
    name: 'CCM (Coal Crushing & Materials Processing)',
    description: 'Sistem peremukan batubara, crusher jaw & cone, vibratory screen, motor conveyor drive, sensor temperatur bearing, dan belt weigher.',
    site_location: 'Port Terminal Sebamban & ROM Stockpile',
    color_theme: 'amber',
    status: 'active',
    created_at: '2026-09-01T08:00:00Z'
  }
];

let FALLBACK_PROJECT_WAREHOUSES = [
  {
    id: 'pwh-wim-01',
    project_id: 'proj-wim',
    name: 'Gudang Central WIM Workshop',
    code: 'WH-WIM-01',
    location: 'Sebamban KM 14 Workshop',
    pic_name: 'Ahmad Fadillah',
    pic_contact: '0812-3456-7890 (Ch 12)',
    capacity_shelves: 150,
    description: 'Penyimpanan cadangan sensor load cell, kabel kedap air, dan PC server bridge.'
  },
  {
    id: 'pwh-wim-02',
    project_id: 'proj-wim',
    name: 'Pos Logistik Kontainer KM-28',
    code: 'WH-WIM-02',
    location: 'Checkpoint KM 28 Hauling Road',
    pic_name: 'Budi Santoso',
    pic_contact: '0813-8877-6655 (Ch 12)',
    capacity_shelves: 80,
    description: 'Depot cepat pergantian sensor jembatan timbang titik tengah.'
  },
  {
    id: 'pwh-fam-01',
    project_id: 'proj-famous',
    name: 'Gudang Elektronika & GPS Fleet',
    code: 'WH-FAM-01',
    location: 'Main Office VGT Lantai 2',
    pic_name: 'Hendri Saputra',
    pic_contact: '0811-9988-1122 (Ch 08)',
    capacity_shelves: 200,
    description: 'Penyimpanan modul GPS telematika, modem satelit, kartu SIM IoT, dan harness.'
  },
  {
    id: 'pwh-fam-02',
    project_id: 'proj-famous',
    name: 'Container Tool & Spare Pit South',
    code: 'WH-FAM-02',
    location: 'Pit South Workshop Area',
    pic_name: 'Rizal Fahmi',
    pic_contact: '0852-7744-1199 (Ch 08)',
    capacity_shelves: 100,
    description: 'Mobile container untuk instalasi langsung pada unit alat berat breakdown.'
  },
  {
    id: 'pwh-ccm-01',
    project_id: 'proj-ccm',
    name: 'Gudang Sparepart Crusher ROM',
    code: 'WH-CCM-01',
    location: 'Stockpile ROM Sebamban KM 06',
    pic_name: 'Dedi Kurniawan',
    pic_contact: '0821-5566-3322 (Ch 04)',
    capacity_shelves: 120,
    description: 'Gudang komponen berat mechanical crusher, toggle plate, wedge, dan bearing.'
  },
  {
    id: 'pwh-ccm-02',
    project_id: 'proj-ccm',
    name: 'Workshop Port Terminal Sebamban',
    code: 'WH-CCM-02',
    location: 'Port Coal Terminal Sebamban',
    pic_name: 'Faisal Akbar',
    pic_contact: '0819-2233-4411 (Ch 04)',
    capacity_shelves: 160,
    description: 'Stok conveyor roller, belt weigher, motor listrik, dan pelumas heavy duty.'
  }
];

// Cleaned: All dummy placeholder items removed!
let FALLBACK_PROJECT_ITEMS = [];
let FALLBACK_PROJECT_LOGS = [];

// Helper: update warranty status based on current date
const computeWarrantyStatus = (expiryDate) => {
  if (!expiryDate) return 'void';
  const now = new Date();
  const exp = new Date(expiryDate);
  const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'expired';
  if (diffDays <= 30) return 'expiring_soon';
  return 'active';
};

// ==========================================
// 1. PROJECTS (WORKSPACES)
// ==========================================

// GET /api/project-inventory/projects
router.get('/projects', optionalAuth, async (req, res, next) => {
  try {
    let projects = FALLBACK_PROJECTS;
    try {
      const { data, error } = await supabase
        .from('project_workspaces')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        projects = data;
      }
    } catch (e) {
      console.warn('[Project Inventory] Supabase projects error, using fallback:', e.message);
    }

    // Fetch items & warehouses counts to enrich projects summary
    let items = FALLBACK_PROJECT_ITEMS;
    let warehouses = FALLBACK_PROJECT_WAREHOUSES;
    try {
      const [{ data: itemData }, { data: whData }] = await Promise.all([
        supabase.from('project_inventory_items').select('id, project_id, status, is_damaged, warranty_status, warranty_expiry_date'),
        supabase.from('project_warehouses').select('id, project_id')
      ]);
      if (itemData) items = itemData;
      if (whData) warehouses = whData;
    } catch (e) {}

    const enriched = projects.map(proj => {
      // If FAMOUS, use real dataset statistics!
      if (proj.id === 'proj-famous' || proj.code === 'FAMOUS') {
        const totalItems = FAMOUS_SUMMARY.total_items || FAMOUS_ITEMS.length || 9416;
        const installedCount = FAMOUS_SUMMARY.by_status?.['Terinstall'] || 6513;
        const warehouseStock = FAMOUS_SUMMARY.by_status?.['Onsite'] || 2028;
        const damagedCount = (FAMOUS_SUMMARY.by_status?.['Rusak'] || 646) + (FAMOUS_SUMMARY.by_status?.['Return'] || 193);
        const fleetUnitsCount = FAMOUS_SUMMARY.fleet_summary?.total_units || 825;

        return {
          ...proj,
          stats: {
            total_items: totalItems,
            installed_count: installedCount,
            warehouse_stock: warehouseStock,
            damaged_count: damagedCount,
            fleet_units_count: fleetUnitsCount,
            warehouses_count: 2,
            active_warranty: installedCount,
            expiring_warranty: 0
          }
        };
      }

      const projItems = items.filter(i => i.project_id === proj.id);
      const projWh = warehouses.filter(w => w.project_id === proj.id);

      const installedCount = projItems.filter(i => i.status === 'installed').length;
      const warehouseCount = projItems.filter(i => i.status === 'in_warehouse').length;
      const damagedCount = projItems.filter(i => i.is_damaged || i.status === 'under_repair').length;

      const activeWarranty = projItems.filter(i => {
        const st = computeWarrantyStatus(i.warranty_expiry_date);
        return st === 'active';
      }).length;

      const expiringWarranty = projItems.filter(i => {
        const st = computeWarrantyStatus(i.warranty_expiry_date);
        return st === 'expiring_soon';
      }).length;

      return {
        ...proj,
        stats: {
          total_items: projItems.length,
          installed_count: installedCount,
          warehouse_stock: warehouseCount,
          damaged_count: damagedCount,
          warehouses_count: projWh.length,
          active_warranty: activeWarranty,
          expiring_warranty: expiringWarranty
        }
      };
    });

    return sendSuccess(res, enriched, 'Daftar Project Workspace Mining berhasil diambil.');
  } catch (err) {
    next(err);
  }
});

// POST /api/project-inventory/projects
router.post('/projects', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { code, name, description, site_location, color_theme } = req.body;
    if (!name || !code) {
      throw new AppError('Kode project dan nama project wajib diisi.', 400, 'VALIDATION_FAILED');
    }

    const cleanCode = code.trim().toUpperCase();
    const id = `proj-${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    const newProject = {
      id,
      code: cleanCode,
      name: name.trim(),
      description: description || '',
      site_location: site_location || 'Site Tambang Digitech',
      color_theme: color_theme || 'emerald',
      status: 'active',
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('project_workspaces')
        .insert(newProject)
        .select()
        .single();
      if (!error && data) {
        return sendCreated(res, data, 'Project baru berhasil didaftarkan.');
      }
    } catch (e) {
      console.warn('[Project Inventory] Insert project Supabase failed:', e.message);
    }

    FALLBACK_PROJECTS.push(newProject);
    return sendCreated(res, newProject, 'Project baru berhasil didaftarkan (local).');
  } catch (err) {
    next(err);
  }
});

// PUT /api/project-inventory/projects/:id
router.put('/projects/:id', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, name, description, site_location, color_theme, status } = req.body;

    const updates = {};
    if (code) updates.code = code.trim().toUpperCase();
    if (name) updates.name = name.trim();
    if (description !== undefined) updates.description = description;
    if (site_location !== undefined) updates.site_location = site_location;
    if (color_theme) updates.color_theme = color_theme;
    if (status) updates.status = status;
    updates.updated_at = new Date().toISOString();

    try {
      const { data, error } = await supabase
        .from('project_workspaces')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        return sendSuccess(res, data, 'Workspace berhasil diperbarui.');
      }
    } catch (e) {
      console.warn('[Project Inventory] Update project Supabase failed:', e.message);
    }

    const idx = FALLBACK_PROJECTS.findIndex(p => p.id === id);
    if (idx !== -1) {
      FALLBACK_PROJECTS[idx] = { ...FALLBACK_PROJECTS[idx], ...updates };
      return sendSuccess(res, FALLBACK_PROJECTS[idx], 'Workspace berhasil diperbarui (local).');
    }

    throw new AppError('Workspace tidak ditemukan.', 404, 'NOT_FOUND');
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 2. PROJECT WAREHOUSES (GUDANG PROJECT)
// ==========================================

// GET /api/project-inventory/warehouses
router.get('/warehouses', optionalAuth, async (req, res, next) => {
  try {
    const { project_id } = req.query;
    let warehouses = FALLBACK_PROJECT_WAREHOUSES;

    try {
      let query = supabase.from('project_warehouses').select('*').order('created_at', { ascending: true });
      if (project_id) query = query.eq('project_id', project_id);
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        warehouses = data;
      }
    } catch (e) {
      console.warn('[Project Inventory] Warehouses Supabase error:', e.message);
    }

    if (project_id) {
      warehouses = warehouses.filter(w => w.project_id === project_id);
    }

    return sendSuccess(res, warehouses, 'Daftar Gudang Project.');
  } catch (err) {
    next(err);
  }
});

// POST /api/project-inventory/warehouses — Opsi Tambah Gudang Project
router.post('/warehouses', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { project_id, name, code, location, pic_name, pic_contact, capacity_shelves, description } = req.body;
    if (!project_id || !name || !code) {
      throw new AppError('Project ID, Nama Gudang, dan Kode Gudang wajib diisi.', 400, 'VALIDATION_FAILED');
    }

    const cleanCode = code.trim().toUpperCase();
    const id = `pwh-${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

    const newWarehouse = {
      id,
      project_id,
      name: name.trim(),
      code: cleanCode,
      location: location || 'Area Pit Site',
      pic_name: pic_name || 'Staff Logistik',
      pic_contact: pic_contact || '-',
      capacity_shelves: Number(capacity_shelves) || 100,
      description: description || '',
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('project_warehouses')
        .insert(newWarehouse)
        .select()
        .single();
      if (!error && data) {
        return sendCreated(res, data, 'Gudang Project baru berhasil ditambahkan.');
      }
    } catch (e) {
      console.warn('[Project Inventory] Insert warehouse Supabase failed:', e.message);
    }

    FALLBACK_PROJECT_WAREHOUSES.push(newWarehouse);
    return sendCreated(res, newWarehouse, 'Gudang Project baru berhasil ditambahkan (local).');
  } catch (err) {
    next(err);
  }
});

// DELETE /api/project-inventory/warehouses/:id
router.delete('/warehouses/:id', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    try {
      await supabase.from('project_warehouses').delete().eq('id', id);
    } catch (e) {
      console.warn('[Project Inventory] Delete warehouse Supabase failed:', e.message);
    }
    FALLBACK_PROJECT_WAREHOUSES = FALLBACK_PROJECT_WAREHOUSES.filter(w => w.id !== id);
    return sendSuccess(res, { id }, 'Gudang Project berhasil dihapus.');
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 2.5 REAL FAMOUS PROJECT DEDICATED APIS
// ==========================================

// GET /api/project-inventory/famous/summary
router.get('/famous/summary', optionalAuth, (req, res) => {
  return sendSuccess(res, FAMOUS_SUMMARY, 'Ringkasan data real project FAMOUS.');
});

// GET /api/project-inventory/famous/fleet-matrix
router.get('/famous/fleet-matrix', optionalAuth, (req, res) => {
  let { search, mitra, health, page = 1, limit = 50 } = req.query;
  page = parseInt(page) || 1;
  const isAll = limit === 'all';
  const pageLimit = isAll ? FAMOUS_FLEET_MATRIX.length : (parseInt(limit) || 50);

  let filtered = FAMOUS_FLEET_MATRIX;

  if (search) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(u =>
      (u.unit_number && u.unit_number.toLowerCase().includes(q)) ||
      (u.bastm_number && u.bastm_number.toLowerCase().includes(q)) ||
      (u.mitra && u.mitra.toLowerCase().includes(q))
    );
  }

  if (mitra && mitra.toUpperCase() !== 'ALL') {
    filtered = filtered.filter(u => u.mitra && u.mitra.toUpperCase() === mitra.toUpperCase());
  }

  if (health && health.toUpperCase() !== 'ALL') {
    filtered = filtered.filter(u => u.health_status && u.health_status.toLowerCase() === health.toLowerCase());
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageLimit) || 1;
  const startIndex = (page - 1) * pageLimit;
  const pagedUnits = isAll ? filtered : filtered.slice(startIndex, startIndex + pageLimit);

  return sendSuccess(res, {
    units: pagedUnits,
    pagination: {
      page,
      limit: pageLimit,
      total,
      total_pages: totalPages
    }
  }, 'Daftar armada truk hauling FAMOUS berhasil diambil.');
});

// GET /api/project-inventory/famous/items
router.get('/famous/items', optionalAuth, (req, res) => {
  let { search, category, status, mitra, page = 1, limit = 50 } = req.query;
  page = parseInt(page) || 1;
  const isAll = limit === 'all';
  const pageLimit = isAll ? FAMOUS_ITEMS.length : (parseInt(limit) || 50);

  let filtered = FAMOUS_ITEMS;

  if (search) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(item =>
      (item.serial_number && item.serial_number.toLowerCase().includes(q)) ||
      (item.imei && item.imei.toLowerCase().includes(q)) ||
      (item.unit_number && item.unit_number.toLowerCase().includes(q)) ||
      (item.bastm_number && item.bastm_number.toLowerCase().includes(q)) ||
      (item.notes && item.notes.toLowerCase().includes(q)) ||
      (item.previous_notes && item.previous_notes.toLowerCase().includes(q))
    );
  }

  if (category && category.toUpperCase() !== 'ALL') {
    filtered = filtered.filter(i => i.category && i.category.toLowerCase() === category.toLowerCase());
  }

  if (status && status.toUpperCase() !== 'ALL') {
    if (status.toLowerCase() === 'rma') {
      filtered = filtered.filter(i => i.status === 'Rusak' || i.status === 'Return');
    } else {
      filtered = filtered.filter(i => i.status && i.status.toLowerCase() === status.toLowerCase());
    }
  }

  if (mitra && mitra.toUpperCase() !== 'ALL') {
    filtered = filtered.filter(i => i.mitra && i.mitra.toUpperCase() === mitra.toUpperCase());
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageLimit) || 1;
  const startIndex = (page - 1) * pageLimit;
  const pagedItems = isAll ? filtered : filtered.slice(startIndex, startIndex + pageLimit);

  return sendSuccess(res, {
    items: pagedItems,
    pagination: {
      page,
      limit: pageLimit,
      total,
      total_pages: totalPages
    }
  }, 'Daftar item real FAMOUS berhasil diambil.');
});

// ==========================================
// 3. PROJECT INVENTORY ITEMS & ASSETS
// ==========================================

// GET /api/project-inventory/items
router.get('/items', optionalAuth, async (req, res, next) => {
  try {
    const { project_id, warehouse_id, status, condition, is_damaged, search, limit = 100 } = req.query;

    // If FAMOUS, dynamically adapt from real FAMOUS items!
    if (project_id === 'proj-famous') {
      let filtered = FAMOUS_ITEMS;
      if (status) {
        if (status === 'installed') filtered = filtered.filter(i => i.status === 'Terinstall');
        else if (status === 'in_warehouse') filtered = filtered.filter(i => i.status === 'Onsite');
        else if (status === 'under_repair') filtered = filtered.filter(i => i.status === 'Rusak' || i.status === 'Return');
      }
      if (search) {
        const q = search.trim().toLowerCase();
        filtered = filtered.filter(i =>
          (i.serial_number && i.serial_number.toLowerCase().includes(q)) ||
          (i.unit_number && i.unit_number.toLowerCase().includes(q)) ||
          (i.bastm_number && i.bastm_number.toLowerCase().includes(q)) ||
          (i.category && i.category.toLowerCase().includes(q))
        );
      }

      const mapped = filtered.slice(0, parseInt(limit) || 100).map(item => ({
        id: item.id,
        project_id: 'proj-famous',
        warehouse_id: 'pwh-fam-01',
        item_code: item.id,
        serial_number: item.serial_number,
        name: `${item.category_name} (${item.serial_number})`,
        category: item.category,
        brand: 'FAMOUS Fleet System',
        quantity: 1,
        unit: 'PCS',
        condition: item.condition || 'Baru',
        status: item.status === 'Terinstall' ? 'installed' : (item.status === 'Onsite' ? 'in_warehouse' : 'under_repair'),
        price: 0,
        installed_unit: item.unit_number || null,
        installation_location_detail: item.unit_number ? `Armada Hauling ${item.mitra}` : null,
        installed_date: item.install_date,
        installed_by: 'Teknisi Fleet FAMOUS',
        warranty_status: 'active',
        warranty_expiry_date: '2027-12-31',
        is_damaged: item.condition === 'Rusak',
        notes: `BASTM: ${item.bastm_number || '-'}. ${item.notes || ''}`
      }));

      return sendSuccess(res, mapped, 'Daftar item real project FAMOUS.');
    }

    let items = FALLBACK_PROJECT_ITEMS;
    try {
      let query = supabase.from('project_inventory_items').select('*').order('created_at', { ascending: false });
      if (project_id) query = query.eq('project_id', project_id);
      if (warehouse_id) query = query.eq('warehouse_id', warehouse_id);
      if (status) query = query.eq('status', status);
      if (condition) query = query.eq('condition', condition);
      if (is_damaged !== undefined) query = query.eq('is_damaged', is_damaged === 'true');
      if (search) {
        query = query.or(`name.ilike.%${search}%,item_code.ilike.%${search}%,serial_number.ilike.%${search}%,installed_unit.ilike.%${search}%`);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        items = data;
      }
    } catch (e) {
      console.warn('[Project Inventory] Items Supabase error, using fallback:', e.message);
    }

    if (project_id && items === FALLBACK_PROJECT_ITEMS) {
      items = items.filter(i => i.project_id === project_id);
    }

    // Dynamically calculate warranty status
    const computedItems = items.map(item => {
      const dynWarrantyStatus = computeWarrantyStatus(item.warranty_expiry_date);
      return {
        ...item,
        warranty_status: item.warranty_status === 'void' ? 'void' : dynWarrantyStatus
      };
    });

    return sendSuccess(res, computedItems, 'Daftar item dan asset project.');
  } catch (err) {
    next(err);
  }
});

// POST /api/project-inventory/items — Masuknya Barang (Stock In / Receiving)
router.post('/items', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const {
      project_id,
      warehouse_id,
      item_code,
      serial_number,
      name,
      category,
      brand,
      quantity,
      unit,
      condition,
      price,
      notes,
      document_number,
      technician_name,
      // Optional initial installation
      installed_unit,
      installation_location_detail,
      installed_date,
      unit_hm_at_install,
      // Optional warranty info
      warranty_start_date,
      warranty_duration_months,
      warranty_provider,
      warranty_claim_notes,
      expected_lifetime_hours
    } = req.body;

    if (!project_id || !name || !item_code) {
      throw new AppError('Project ID, Nama Barang, dan Kode Barang wajib diisi.', 400, 'VALIDATION_FAILED');
    }

    const itemId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const isInstalled = !!installed_unit;

    // Calculate warranty expiry date if duration provided
    let calculatedExpiry = null;
    const durMonths = Number(warranty_duration_months) || 12;
    if (warranty_start_date) {
      const d = new Date(warranty_start_date);
      d.setMonth(d.getMonth() + durMonths);
      calculatedExpiry = d.toISOString().split('T')[0];
    }

    const newItem = {
      id: itemId,
      project_id,
      warehouse_id: warehouse_id || null,
      item_code: item_code.trim().toUpperCase(),
      serial_number: serial_number ? serial_number.trim() : null,
      name: name.trim(),
      category: category || 'Umum',
      brand: brand || '-',
      quantity: Number(quantity) || 1,
      unit: unit || 'PCS',
      condition: condition || 'Baru',
      status: isInstalled ? 'installed' : 'in_warehouse',
      price: Number(price) || 0,
      installed_unit: installed_unit || null,
      installation_location_detail: installation_location_detail || null,
      installed_date: installed_date || (isInstalled ? new Date().toISOString().split('T')[0] : null),
      installed_by: technician_name || 'Staff Teknisi',
      unit_hm_at_install: unit_hm_at_install ? Number(unit_hm_at_install) : null,
      warranty_start_date: warranty_start_date || (isInstalled ? installed_date || new Date().toISOString().split('T')[0] : null),
      warranty_duration_months: durMonths,
      warranty_expiry_date: calculatedExpiry,
      warranty_status: calculatedExpiry ? computeWarrantyStatus(calculatedExpiry) : 'active',
      warranty_provider: warranty_provider || '-',
      warranty_claim_notes: warranty_claim_notes || null,
      origin_unit: null,
      transfer_date: null,
      transfer_reason: null,
      is_damaged: false,
      damage_type: null,
      damage_date: null,
      damage_notes: null,
      replacement_due_date: calculatedExpiry || null,
      replacement_due_hm: null,
      expected_lifetime_hours: expected_lifetime_hours ? Number(expected_lifetime_hours) : null,
      notes: notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Audit log
    const logId = `log-${Date.now()}`;
    const newLog = {
      id: logId,
      project_id,
      item_id: itemId,
      action_type: isInstalled ? 'PASANG' : 'MASUK',
      source_location: 'Vendor / Receiving PO',
      destination_location: isInstalled ? installed_unit : (warehouse_id || 'Gudang Project'),
      technician_name: technician_name || 'Staff Logistik',
      document_number: document_number || `DOC-IN-${Date.now().toString().slice(-4)}`,
      notes: isInstalled
        ? `Barang masuk dan langsung dipasang pada ${installed_unit}`
        : `Penerimaan barang masuk ke gudang project (${condition || 'Baru'})`,
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('project_inventory_items').insert(newItem);
      await supabase.from('project_inventory_logs').insert(newLog);
    } catch (e) {
      console.warn('[Project Inventory] Insert item Supabase error:', e.message);
    }

    FALLBACK_PROJECT_ITEMS.unshift(newItem);
    FALLBACK_PROJECT_LOGS.unshift(newLog);

    return sendCreated(res, newItem, 'Barang inventaris project berhasil didaftarkan ke sistem.');
  } catch (err) {
    next(err);
  }
});

// PUT /api/project-inventory/items/:id — Update general info
router.put('/items/:id', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('project_inventory_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        return sendSuccess(res, data, 'Data item project berhasil diperbarui.');
      }
    } catch (e) {
      console.warn('[Project Inventory] Update item Supabase error:', e.message);
    }

    const idx = FALLBACK_PROJECT_ITEMS.findIndex(i => i.id === id);
    if (idx !== -1) {
      FALLBACK_PROJECT_ITEMS[idx] = { ...FALLBACK_PROJECT_ITEMS[idx], ...updates };
      return sendSuccess(res, FALLBACK_PROJECT_ITEMS[idx], 'Data item project berhasil diperbarui (local).');
    }

    return sendSuccess(res, { id, ...updates }, 'Data item project diperbarui.');
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 4. MINING LIFECYCLE WORKFLOWS
// ==========================================

// POST /api/project-inventory/items/:id/install
// Barang Keluar Dipasang Dimana? (Installation to heavy equipment / plant / location)
router.post('/items/:id/install', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      installed_unit,
      installation_location_detail,
      installed_date,
      installed_by,
      unit_hm_at_install,
      warranty_duration_months,
      warranty_provider,
      notes,
      document_number
    } = req.body;

    if (!installed_unit) {
      throw new AppError('Unit / Lokasi pemasangan wajib diisi (Contoh: DT-777D #08, Excavator PC2000, Jembatan Timbang WIM KM-14).', 400, 'VALIDATION_FAILED');
    }

    const instDate = installed_date || new Date().toISOString().split('T')[0];
    const durMonths = Number(warranty_duration_months) || 12;

    const d = new Date(instDate);
    d.setMonth(d.getMonth() + durMonths);
    const calculatedExpiry = d.toISOString().split('T')[0];

    const updates = {
      status: 'installed',
      installed_unit: installed_unit.trim(),
      installation_location_detail: installation_location_detail || null,
      installed_date: instDate,
      installed_by: installed_by || 'Teknisi Lapangan',
      unit_hm_at_install: unit_hm_at_install ? Number(unit_hm_at_install) : null,
      warranty_start_date: instDate,
      warranty_duration_months: durMonths,
      warranty_expiry_date: calculatedExpiry,
      warranty_status: computeWarrantyStatus(calculatedExpiry),
      warranty_provider: warranty_provider || 'Distributor Resmi',
      notes: notes || '',
      updated_at: new Date().toISOString()
    };

    let itemProject = 'proj-wim';
    try {
      const { data } = await supabase.from('project_inventory_items').select('project_id, warehouse_id').eq('id', id).single();
      if (data?.project_id) itemProject = data.project_id;
    } catch {}

    const logEntry = {
      id: `log-${Date.now()}`,
      project_id: itemProject,
      item_id: id,
      action_type: 'PASANG',
      source_location: 'Gudang Project',
      destination_location: `${installed_unit} ${installation_location_detail ? '(' + installation_location_detail + ')' : ''}`,
      technician_name: installed_by || 'Teknisi Lapangan',
      document_number: document_number || `WO-INST-${Date.now().toString().slice(-4)}`,
      notes: `Pemasangan pada unit ${installed_unit}. HM: ${unit_hm_at_install || '-'} hrs. Garansi aktif hingga ${calculatedExpiry}. ${notes || ''}`,
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('project_inventory_items').update(updates).eq('id', id);
      await supabase.from('project_inventory_logs').insert(logEntry);
    } catch (e) {
      console.warn('[Project Inventory] Install action Supabase error:', e.message);
    }

    const idx = FALLBACK_PROJECT_ITEMS.findIndex(i => i.id === id);
    if (idx !== -1) {
      FALLBACK_PROJECT_ITEMS[idx] = { ...FALLBACK_PROJECT_ITEMS[idx], ...updates };
    }
    FALLBACK_PROJECT_LOGS.unshift(logEntry);

    return sendSuccess(res, { id, ...updates, log: logEntry }, `Asset berhasil dipasang pada unit ${installed_unit} dengan garansi ${durMonths} bulan.`);
  } catch (err) {
    next(err);
  }
});

// POST /api/project-inventory/items/:id/transfer
// Barang Dipindah dari Unit Lain (Cannibalization / Relocation)
router.post('/items/:id/transfer', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      origin_unit,
      target_unit,
      target_location_detail,
      transfer_date,
      technician_name,
      transfer_reason,
      document_number
    } = req.body;

    if (!target_unit) {
      throw new AppError('Unit / Lokasi tujuan transfer wajib diisi.', 400, 'VALIDATION_FAILED');
    }

    const transDate = transfer_date || new Date().toISOString().split('T')[0];

    const updates = {
      origin_unit: origin_unit || 'Unit Sebelumnya',
      installed_unit: target_unit.trim(),
      installation_location_detail: target_location_detail || null,
      transfer_date: transDate,
      transfer_reason: transfer_reason || 'Kanibalisasi darurat antar-unit',
      installed_by: technician_name || 'Teknisi Fleet',
      status: 'installed',
      updated_at: new Date().toISOString()
    };

    let itemProject = 'proj-wim';
    try {
      const { data } = await supabase.from('project_inventory_items').select('project_id, installed_unit').eq('id', id).single();
      if (data?.project_id) itemProject = data.project_id;
      if (!origin_unit && data?.installed_unit) {
        updates.origin_unit = data.installed_unit;
      }
    } catch {}

    const logEntry = {
      id: `log-${Date.now()}`,
      project_id: itemProject,
      item_id: id,
      action_type: 'PINDAH_UNIT',
      source_location: updates.origin_unit,
      destination_location: target_unit,
      technician_name: technician_name || 'Teknisi Fleet',
      document_number: document_number || `KANIBAL-${Date.now().toString().slice(-4)}`,
      notes: `Perpindahan/kanibal aset dari ${updates.origin_unit} ke ${target_unit}. Alasan: ${transfer_reason || 'Kebutuhan operasional mendesak'}`,
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('project_inventory_items').update(updates).eq('id', id);
      await supabase.from('project_inventory_logs').insert(logEntry);
    } catch (e) {
      console.warn('[Project Inventory] Transfer action Supabase error:', e.message);
    }

    const idx = FALLBACK_PROJECT_ITEMS.findIndex(i => i.id === id);
    if (idx !== -1) {
      FALLBACK_PROJECT_ITEMS[idx] = { ...FALLBACK_PROJECT_ITEMS[idx], ...updates };
    }
    FALLBACK_PROJECT_LOGS.unshift(logEntry);

    return sendSuccess(res, { id, ...updates, log: logEntry }, `Asset berhasil dipindahkan dari ${updates.origin_unit} ke ${target_unit}.`);
  } catch (err) {
    next(err);
  }
});

// POST /api/project-inventory/items/:id/damage-report
// Barang Rusak dan Waktunya Pergantian
router.post('/items/:id/damage-report', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      damage_type,
      damage_date,
      damage_notes,
      replacement_due_date,
      replacement_due_hm,
      technician_name,
      document_number,
      set_status_repair
    } = req.body;

    if (!damage_type) {
      throw new AppError('Jenis kerusakan / diagnosa wajib disertakan (contoh: Wear & Tear, Korsleting, Retak Fisik, Overheating).', 400, 'VALIDATION_FAILED');
    }

    const dmgDate = damage_date || new Date().toISOString().split('T')[0];

    const updates = {
      is_damaged: true,
      damage_type,
      damage_date: dmgDate,
      damage_notes: damage_notes || '',
      replacement_due_date: replacement_due_date || null,
      replacement_due_hm: replacement_due_hm ? Number(replacement_due_hm) : null,
      status: set_status_repair ? 'under_repair' : 'installed', // bisa tetap installed jika degradasi operasional
      condition: 'Rusak Ringan',
      updated_at: new Date().toISOString()
    };

    let itemProject = 'proj-wim';
    let currentUnit = 'Unit Lapangan';
    try {
      const { data } = await supabase.from('project_inventory_items').select('project_id, installed_unit').eq('id', id).single();
      if (data?.project_id) itemProject = data.project_id;
      if (data?.installed_unit) currentUnit = data.installed_unit;
    } catch {}

    const logEntry = {
      id: `log-${Date.now()}`,
      project_id: itemProject,
      item_id: id,
      action_type: 'RUSAK',
      source_location: currentUnit,
      destination_location: set_status_repair ? 'Workshop Perbaikan' : currentUnit,
      technician_name: technician_name || 'Teknisi Inspeksi',
      document_number: document_number || `DMG-${Date.now().toString().slice(-4)}`,
      notes: `Laporan Kerusakan: ${damage_type}. Catatan: ${damage_notes || '-'}. Target pergantian: ${replacement_due_date || 'Segera'} (HM Target: ${replacement_due_hm || '-'})`,
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('project_inventory_items').update(updates).eq('id', id);
      await supabase.from('project_inventory_logs').insert(logEntry);
    } catch (e) {
      console.warn('[Project Inventory] Damage report Supabase error:', e.message);
    }

    const idx = FALLBACK_PROJECT_ITEMS.findIndex(i => i.id === id);
    if (idx !== -1) {
      FALLBACK_PROJECT_ITEMS[idx] = { ...FALLBACK_PROJECT_ITEMS[idx], ...updates };
    }
    FALLBACK_PROJECT_LOGS.unshift(logEntry);

    return sendSuccess(res, { id, ...updates, log: logEntry }, 'Laporan kerusakan dan jadwal pergantian berhasil dicatat.');
  } catch (err) {
    next(err);
  }
});

// POST /api/project-inventory/items/:id/replace
// Eksekusi Pergantian Komponen Rusak
router.post('/items/:id/replace', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      technician_name,
      document_number,
      disposition, // 'scrapped' | 'under_repair' | 'in_warehouse'
      new_item_code,
      new_serial_number,
      notes
    } = req.body;

    const updates = {
      is_damaged: false,
      status: disposition || 'scrapped',
      condition: disposition === 'scrapped' ? 'Afkir / Scrap' : 'Refurbished',
      notes: `Telah diganti pada ${new Date().toISOString().split('T')[0]}. ${notes || ''}`,
      updated_at: new Date().toISOString()
    };

    let itemProject = 'proj-wim';
    let currentUnit = 'Unit Tambang';
    try {
      const { data } = await supabase.from('project_inventory_items').select('project_id, installed_unit').eq('id', id).single();
      if (data?.project_id) itemProject = data.project_id;
      if (data?.installed_unit) currentUnit = data.installed_unit;
    } catch {}

    const logEntry = {
      id: `log-${Date.now()}`,
      project_id: itemProject,
      item_id: id,
      action_type: 'GANTI',
      source_location: currentUnit,
      destination_location: disposition === 'scrapped' ? 'Gudang Afkir / Scrap' : 'Workshop Repair',
      technician_name: technician_name || 'Teknisi Pergantian',
      document_number: document_number || `REP-${Date.now().toString().slice(-4)}`,
      notes: `Pergantian part aus/rusak pada ${currentUnit}. Part lama dialokasikan ke ${disposition || 'Scrap'}. Pengganti S/N: ${new_serial_number || '-'}. ${notes || ''}`,
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('project_inventory_items').update(updates).eq('id', id);
      await supabase.from('project_inventory_logs').insert(logEntry);
    } catch (e) {
      console.warn('[Project Inventory] Replace action Supabase error:', e.message);
    }

    const idx = FALLBACK_PROJECT_ITEMS.findIndex(i => i.id === id);
    if (idx !== -1) {
      FALLBACK_PROJECT_ITEMS[idx] = { ...FALLBACK_PROJECT_ITEMS[idx], ...updates };
    }
    FALLBACK_PROJECT_LOGS.unshift(logEntry);

    return sendSuccess(res, { id, ...updates, log: logEntry }, 'Pergantian komponen berhasil dieksekusi.');
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 5. AUDIT TIMELINE & MUTATION LOGS
// ==========================================

// POST /api/project-inventory/request — Permohonan Komponen / Material Lengkap (Official Material Request)
router.post('/request', requireAuth, async (req, res, next) => {
  try {
    const {
      project_id,
      item_id,
      item_name,
      part_number,
      requested_unit,
      quantity,
      unit,
      urgency,
      justification,
      requester_name,
      requester_role,
      department,
      destination_receiver,
      document_number,
      doc_date,
      required_date,
      work_order_number,
      source_location,
      destination_location,
      material_condition,
      approval_maker_name,
      approval_maker_role,
      approval_checker_name,
      approval_checker_role,
      approval_approver_name,
      approval_approver_role,
      items
    } = req.body;

    if (!project_id) {
      throw new AppError('Project ID wajib disertakan.', 400, 'VALIDATION_FAILED');
    }

    // Parse multi-item material list or fallback to single item fields
    const parsedItems = Array.isArray(items) && items.length > 0 ? items : [
      {
        id: 'item-1',
        name: item_name || 'Material Permohonan',
        spec: part_number || '-',
        sn: req.body.serial_number || '-',
        qty_received: Number(quantity || 1),
        qty_do: Number(quantity || 1),
        unit: unit || 'PCS',
        condition: material_condition || 'Baru',
        notes: justification || '-'
      }
    ];

    const finalDocNumber = document_number || generateUniqueDocNumber('MR');
    const itemsSummary = parsedItems.map(it => `${it.qty_received || it.quantity || 1} ${it.unit || 'PCS'} ${it.name || it.item_name} (${it.spec || it.part_number || '-'})`).join(', ');

    const logEntry = {
      id: `req-${Date.now()}`,
      project_id,
      item_id: item_id || null,
      action_type: 'REQUEST_USER',
      source_location: source_location || 'Gudang Project',
      destination_location: destination_location || requested_unit || 'Unit Lapangan',
      technician_name: requester_name || req.user?.full_name || 'Teknisi Requester',
      document_number: finalDocNumber,
      notes: `[Permohonan Material ${urgency || 'Normal'}] ${itemsSummary}. Alokasi Unit: ${requested_unit || destination_location || 'Gudang/Site'}. SPK/WO: ${work_order_number || '-'}. Alasan: ${justification || 'Kebutuhan pemeliharaan'}`,
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('project_inventory_logs').insert(logEntry);
    } catch (e) {
      console.warn('[Project Inventory] Insert request log Supabase error:', e.message);
    }

    FALLBACK_PROJECT_LOGS.unshift(logEntry);

    // Create an official approval document in MOS waiting list (Template: MR)
    const officialDoc = {
      id: `doc-mr-${Date.now()}`,
      doc_number: finalDocNumber,
      template_type: 'MR',
      title: 'MATERIAL REQUEST',
      subtitle: `SURAT PERMOHONAN MATERIAL - ${department || 'MAINTENANCE & INSTRUMENTATION'}`,
      site_location: destination_location || requested_unit || 'Site Tambang BIB',
      site_id: `site-${project_id}`,
      origin_location: source_location || 'Gudang Project',
      destination_location: destination_location || requested_unit || 'Site Tambang BIB',
      sender_name: requester_name || req.user?.full_name || 'Teknisi Lapangan',
      sender_role: requester_role || 'Teknisi Lapangan',
      destination_receiver: destination_receiver || 'Admin Logistik',
      received_date: doc_date || new Date().toISOString().split('T')[0],
      required_date: required_date || '',
      po_do_number: work_order_number || '-',
      package_condition: material_condition || 'Baru & Segel',
      purpose: justification || `Alokasi untuk ${requested_unit || 'Unit Operasional'}`,
      intended_for: requested_unit || 'Unit Operasional',
      orientation: 'landscape',
      status: 'waiting_user',
      created_at: new Date().toISOString(),
      items: parsedItems.map((item, idx) => ({
        id: `mri-${idx + 1}`,
        name: item.name || item.item_name || 'Komponen Suku Cadang',
        spec: item.spec || item.part_number || '-',
        sn: item.sn || item.serial_number || '-',
        qty_received: Number(item.qty_received || item.quantity || 1),
        qty_do: Number(item.qty_do || item.quantity || 1),
        unit: item.unit || 'PCS',
        condition: item.condition || material_condition || 'Baru',
        notes: item.notes || '-'
      })),
      approval_maker_name: approval_maker_name || requester_name || req.user?.full_name || 'Teknisi Lapangan',
      approval_maker_role: approval_maker_role || requester_role || 'Teknisi Lapangan',
      approval_checker_name: approval_checker_name || 'Supervisor Logistik VGT',
      approval_checker_role: approval_checker_role || 'Supervisor Logistik',
      approval_approver_name: approval_approver_name || 'Head of Digitech',
      approval_approver_role: approval_approver_role || 'Management / Superadmin',
      signatures_placed: []
    };

    FALLBACK_MOS.unshift(officialDoc);

    try {
      await supabase.from('approval_documents').insert({
        id: officialDoc.id,
        doc_number: officialDoc.doc_number,
        title: officialDoc.title,
        template_type: officialDoc.template_type,
        site_location: officialDoc.site_location,
        origin_location: officialDoc.origin_location,
        destination_location: officialDoc.destination_location,
        pic_receiver_name: officialDoc.destination_receiver,
        sender_name: officialDoc.sender_name,
        sender_role: officialDoc.sender_role,
        received_date: officialDoc.received_date,
        po_do_number: officialDoc.po_do_number,
        package_condition: officialDoc.package_condition,
        purpose: officialDoc.purpose,
        orientation: officialDoc.orientation,
        status: officialDoc.status,
        signatures: {
          slot1: { name: officialDoc.approval_maker_name, role: officialDoc.approval_maker_role },
          slot2: { name: officialDoc.approval_checker_name, role: officialDoc.approval_checker_role },
          slot3: { name: officialDoc.approval_approver_name, role: officialDoc.approval_approver_role }
        },
        items: officialDoc.items
      });
    } catch (e) {
      console.warn('[Project Inventory] Insert approval document Supabase error:', e.message);
    }

    return sendCreated(res, { logEntry, officialDoc }, 'Permohonan material resmi berhasil diajukan dan diterbitkan ke antrean approval.');
  } catch (err) {
    next(err);
  }
});

// GET /api/project-inventory/logs
router.get('/logs', optionalAuth, async (req, res, next) => {
  try {
    const { project_id, item_id } = req.query;

    let logs = FALLBACK_PROJECT_LOGS;
    try {
      let query = supabase.from('project_inventory_logs').select('*').order('created_at', { ascending: false });
      if (project_id) query = query.eq('project_id', project_id);
      if (item_id) query = query.eq('item_id', item_id);
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        logs = data;
      }
    } catch (e) {
      console.warn('[Project Inventory] Logs Supabase error:', e.message);
    }

    if (project_id && logs === FALLBACK_PROJECT_LOGS) {
      logs = logs.filter(l => l.project_id === project_id);
    }

    return sendSuccess(res, logs, 'Riwayat mutasi dan audit trail project.');
  } catch (err) {
    next(err);
  }
});

// DELETE /api/project-inventory/items/:id
router.delete('/items/:id', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    try {
      await supabase.from('project_inventory_items').delete().eq('id', id);
    } catch (e) {
      console.warn('[Project Inventory] Delete item Supabase failed:', e.message);
    }
    FALLBACK_PROJECT_ITEMS = FALLBACK_PROJECT_ITEMS.filter(i => i.id !== id);
    return sendSuccess(res, { id }, 'Asset item project berhasil dihapus.');
  } catch (err) {
    next(err);
  }
});

export default router;
