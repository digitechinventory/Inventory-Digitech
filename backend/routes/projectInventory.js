import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from '../services/supabase.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { adminOnly, superadminOnly } from '../middleware/rbac.js';
import { sendSuccess, sendCreated } from '../middlewares/responseHandler.js';
import { AppError } from '../middlewares/errorHandler.js';
import { FALLBACK_MOS, generateUniqueDocNumber } from './mos.js';
import {
  getUserAllowedProjects,
  setUserAllowedProjects,
  checkUserProjectAccess,
  requireProjectAccess,
  getAuthoritiesMap,
  ALL_PROJECT_IDS,
  registerProjectId
} from '../services/projectAuthorityService.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Real FAMOUS Dataset (9,415 real items & 829 fleet trucks)
let FAMOUS_ITEMS = [];
let FAMOUS_FLEET_MATRIX = [];
let FAMOUS_SUMMARY = {
  total_items: 0,
  total_pindahan: 0,
  by_category: {},
  by_status: {},
  by_mitra: {},
  fleet_summary: { total_units: 0, optimal_units: 0, partial_units: 0, critical_units: 0 }
};

// Load Real WIM Dataset (189 components, 268 transactions, 41 warranty items)
let WIM_COMPONENTS = [];
let WIM_TRANSACTIONS = [];
let WIM_WARRANTY = [];
let WIM_SUMMARY = {
  total_components: 0,
  total_transactions: 0,
  total_warranty_items: 0,
  by_category: {},
  by_status: {},
  by_lane: {},
  lanes_summary: []
};

// Project 8-Stage Documents Store
let PROJECT_DOCUMENTS = [];

function findDataFile(...subpath) {
  const candidates = [
    path.join(__dirname, '..', 'data', ...subpath),
    path.join(process.cwd(), 'backend', 'data', ...subpath),
    path.join(process.cwd(), 'data', ...subpath)
  ];
  return candidates.find(c => fs.existsSync(c)) || candidates[0];
}

try {
  const famousItemsPath = findDataFile('famous', 'famous_items.json');
  const famousFleetPath = findDataFile('famous', 'famous_fleet_matrix.json');
  const famousSummaryPath = findDataFile('famous', 'famous_summary.json');

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

try {
  const wimCompPath = findDataFile('wim', 'wim_components.json');
  const wimTxPath = findDataFile('wim', 'wim_transactions.json');
  const wimWarrPath = findDataFile('wim', 'wim_warranty.json');
  const wimSumPath = findDataFile('wim', 'wim_summary.json');

  if (fs.existsSync(wimCompPath)) {
    WIM_COMPONENTS = JSON.parse(fs.readFileSync(wimCompPath, 'utf-8'));
  }
  if (fs.existsSync(wimTxPath)) {
    WIM_TRANSACTIONS = JSON.parse(fs.readFileSync(wimTxPath, 'utf-8'));
  }
  if (fs.existsSync(wimWarrPath)) {
    WIM_WARRANTY = JSON.parse(fs.readFileSync(wimWarrPath, 'utf-8'));
  }
  if (fs.existsSync(wimSumPath)) {
    WIM_SUMMARY = JSON.parse(fs.readFileSync(wimSumPath, 'utf-8'));
  }
  console.log(`[Project Inventory] Loaded real WIM dataset: ${WIM_COMPONENTS.length} components, ${WIM_TRANSACTIONS.length} transactions, ${WIM_WARRANTY.length} warranty items.`);
} catch (err) {
  console.error('[Project Inventory] Failed loading WIM dataset:', err);
}

// Initialize Initial 8-Stage Documents for WIM and FAMOUS
PROJECT_DOCUMENTS = [
  // ── WIM 8-STAGE DOCUMENTS ──
  {
    id: 'pdoc-wim-01',
    project_id: 'proj-wim',
    project_code: 'WIM',
    stage_code: 'RFI',
    stage_number: 1,
    stage_name: 'Request for Information',
    doc_number: '012/VGT/RFI/WIM/MNTOA/BIBOA/III/2026',
    title: 'RFI Pengadaan Sensor Loadcell 50T & High Speed Strip Sensor KM 14',
    created_date: '2026-03-15',
    due_date: '2026-03-25',
    creator_name: 'Rayhans Najib Al-Faruq',
    creator_role: 'Teknisi WIM',
    status: 'Completed',
    priority: 'High',
    summary: 'Kajian teknis penggantian berkala sensor loadcell jembatan timbang Lane 1 & Lane 3 BIB Pit Sebamban KM-14.',
    items_count: 8,
    signatures_count: 1,
    required_signatures: 1,
    file_attachment: 'RFI_WIM_Loadcell_Spec_2026.pdf'
  },
  {
    id: 'pdoc-wim-02',
    project_id: 'proj-wim',
    project_code: 'WIM',
    stage_code: 'PR',
    stage_number: 2,
    stage_name: 'Purchase Requisition',
    doc_number: '008/VGT/PR/WIM/MNTOA/BIBOA/III/2026',
    title: 'PR Pengajuan Pembelian 8 Unit Loadcell Intercomp & Frame LS',
    created_date: '2026-03-28',
    due_date: '2026-04-05',
    creator_name: 'Ahmad Fadillah',
    creator_role: 'Admin Logistik Site',
    status: 'Approved',
    priority: 'Critical',
    summary: 'Purchase Requisition untuk 8 unit Loadcell Intercomp Double Ended Shear Beam dan 4 unit AX920 Mounting Platform.',
    items_count: 12,
    signatures_count: 2,
    required_signatures: 2,
    file_attachment: 'PR_WIM_Intercomp_Approval.pdf'
  },
  {
    id: 'pdoc-wim-03',
    project_id: 'proj-wim',
    project_code: 'WIM',
    stage_code: 'PO',
    stage_number: 3,
    stage_name: 'Purchase Order',
    doc_number: 'PO-4930007520',
    title: 'Purchase Order Vendor INTERCOMP Scale Co. (Kontrak Pengadaan)',
    created_date: '2026-04-01',
    due_date: '2026-04-20',
    creator_name: 'Arya Pratama',
    creator_role: 'Superadmin / Procurement',
    status: 'Active',
    priority: 'High',
    summary: 'Kontrak PO resmi pembelian material timbangan ke vendor INTERCOMP Scale Co. senilai Rp 348.500.000.',
    items_count: 12,
    signatures_count: 2,
    required_signatures: 2,
    file_attachment: 'PO_4930007520_Signed.pdf'
  },
  {
    id: 'pdoc-wim-04',
    project_id: 'proj-wim',
    project_code: 'WIM',
    stage_code: 'Delivery',
    stage_number: 4,
    stage_name: 'Ekspedisi & Surat Jalan',
    doc_number: 'DO/INT-JKT/2026/04-18',
    title: 'Surat Jalan Ekspedisi Darat/Laut PT Intercomp Indonesia ke Site KM-14',
    created_date: '2026-04-05',
    due_date: '2026-04-07',
    creator_name: 'Ekspedisi Barito Mandiri',
    creator_role: 'Logistik Vendor',
    status: 'Delivered',
    priority: 'Medium',
    summary: 'Pengiriman 2 peti kayu berisi 8 unit sensor loadcell dan aksesori pemasangan tiba di pos gerbang Sebamban.',
    items_count: 12,
    signatures_count: 1,
    required_signatures: 2,
    file_attachment: 'DO_Ekspedisi_Intercomp_KM14.pdf'
  },
  {
    id: 'pdoc-wim-05',
    project_id: 'proj-wim',
    project_code: 'WIM',
    stage_code: 'MOS',
    stage_number: 5,
    stage_name: 'Material On Site (MOS)',
    doc_number: '001/VGT/MOS/MNTOA/BIBOA/IV/2026',
    title: 'MOS Verifikasi Fisik & Penerimaan Material Site WIM (3-Slot Signature)',
    created_date: '2026-04-07',
    due_date: '2026-04-07',
    creator_name: 'Rayhans Najib Al-Faruq',
    creator_role: 'Teknisi Penerima',
    status: 'Completed',
    priority: 'Critical',
    summary: 'Pemeriksaan fisik kesesuaian serial number 8 loadcell Intercomp, uji visual, dan pembubuhan 3 tanda tangan digital legal.',
    items_count: 12,
    signatures_count: 3,
    required_signatures: 3,
    file_attachment: 'MOS_001_VGT_Sah.pdf'
  },
  {
    id: 'pdoc-wim-06',
    project_id: 'proj-wim',
    project_code: 'WIM',
    stage_code: 'QC',
    stage_number: 6,
    stage_name: 'Commissioning & QC',
    doc_number: 'QC/VGT/WIM/2026/004',
    title: 'Sertifikat Kalibrasi & Commissioning Timbangan Jembatan Dinamis Lane 1',
    created_date: '2026-04-10',
    due_date: '2026-04-12',
    creator_name: 'Zainal Fahriandy',
    creator_role: 'Commissioning Engineer',
    status: 'Certified',
    priority: 'High',
    summary: 'Uji tara dinamis truk batubara 100 Ton, deviasi margin < 0.25%, penerbitan sertifikat kelaikan operasi site.',
    items_count: 8,
    signatures_count: 2,
    required_signatures: 2,
    file_attachment: 'QC_Sertifikat_Kalibrasi_WIM_Lane1.pdf'
  },
  {
    id: 'pdoc-wim-07',
    project_id: 'proj-wim',
    project_code: 'WIM',
    stage_code: 'Operational',
    stage_number: 7,
    stage_name: 'Operasional & Mutasi / Pindahan',
    doc_number: '006/VGT/MRP/MNTOA/BIBOA/V/2026',
    title: 'Berita Acara Pemasangan & Pindahan Komponen Loadcell Lane 1 (MRP)',
    created_date: '2026-05-26',
    due_date: '2026-05-26',
    creator_name: 'Zainal Fahriandy',
    creator_role: 'Supervisor WIM',
    status: 'In-Use',
    priority: 'Medium',
    summary: 'Pencatatan pemindahan dan pemasangan Loadcell Intercomp SN: 91913187, 92309683, 92285794, 91913138 ke Lane 1.',
    items_count: 4,
    signatures_count: 2,
    required_signatures: 2,
    file_attachment: 'MRP_006_Pindahan_Lane1.pdf'
  },
  {
    id: 'pdoc-wim-08',
    project_id: 'proj-wim',
    project_code: 'WIM',
    stage_code: 'Decommissioning',
    stage_number: 8,
    stage_name: 'Afkir & Decommissioning',
    doc_number: 'BAA/WIM/2026/001',
    title: 'Berita Acara Afkir Loadcell Patah Pasca 550k Weighing Cycle',
    created_date: '2026-06-01',
    due_date: '2026-06-15',
    creator_name: 'Arya Pratama',
    creator_role: 'Superadmin / Manajemen',
    status: 'Approved',
    priority: 'Low',
    summary: 'Persetujuan pemusnahan & penghapusan aset sensor loadcell rusak permanen (SN: 91508708) dari neraca inventaris.',
    items_count: 1,
    signatures_count: 3,
    required_signatures: 3,
    file_attachment: 'BAA_Afkir_Loadcell_001.pdf'
  },

  // ── FAMOUS 8-STAGE DOCUMENTS ──
  {
    id: 'pdoc-fms-01',
    project_id: 'proj-famous',
    project_code: 'FAMOUS',
    stage_code: 'RFI',
    stage_number: 1,
    stage_name: 'Request for Information',
    doc_number: 'RFI/FMS-BIB/2024/005',
    title: 'Spesifikasi AI Fatigue DSM Camera, ADAS Safety & Dual-Band GPS Hauling',
    created_date: '2024-06-10',
    due_date: '2024-06-20',
    creator_name: 'Tim Telematika Fleet',
    creator_role: 'System Engineer',
    status: 'Completed',
    priority: 'High',
    summary: 'RFI evaluasi perangkat telematika armada 825 unit truk hauling mitra BIB: Howen MDVR, Careland DSM, Concox GPS.',
    items_count: 9415,
    signatures_count: 1,
    required_signatures: 1,
    file_attachment: 'RFI_Telematika_Hauling_2024.pdf'
  },
  {
    id: 'pdoc-fms-02',
    project_id: 'proj-famous',
    project_code: 'FAMOUS',
    stage_code: 'PR',
    stage_number: 2,
    stage_name: 'Purchase Requisition',
    doc_number: 'PR/VGT/FMS/2024/019',
    title: 'PR Pengadaan 825 Set Perangkat FAMOUS (GPS, MDVR, DSM, ADAS, SSD, OBU, PTT)',
    created_date: '2024-06-25',
    due_date: '2024-07-05',
    creator_name: 'Logistik Pusat',
    creator_role: 'Procurement Specialist',
    status: 'Approved',
    priority: 'Critical',
    summary: 'Pengajuan belanja modal instalasi telematika keselamatan kerja seluruh mitra hauling (AEK, RBT, BMT, GECL, KMB, BBS, MAV, dll).',
    items_count: 9415,
    signatures_count: 2,
    required_signatures: 2,
    file_attachment: 'PR_FMS_Batch1_Signed.pdf'
  },
  {
    id: 'pdoc-fms-03',
    project_id: 'proj-famous',
    project_code: 'FAMOUS',
    stage_code: 'PO',
    stage_number: 3,
    stage_name: 'Purchase Order',
    doc_number: 'PO/HOWEN/2024/07-001',
    title: 'Purchase Order Kontrak Resmi Howen Technologies & Concox Telematics',
    created_date: '2024-07-10',
    due_date: '2024-07-25',
    creator_name: 'Arya Pratama',
    creator_role: 'Superadmin',
    status: 'Active',
    priority: 'Critical',
    summary: 'Purchase Order vendor internasional untuk batch pertama 1,177 unit MDVR, 1,277 unit DSM, dan 1,157 unit GPS.',
    items_count: 9415,
    signatures_count: 2,
    required_signatures: 2,
    file_attachment: 'PO_Howen_Concox_2024.pdf'
  },
  {
    id: 'pdoc-fms-04',
    project_id: 'proj-famous',
    project_code: 'FAMOUS',
    stage_code: 'Delivery',
    stage_number: 4,
    stage_name: 'Ekspedisi & Surat Jalan',
    doc_number: 'DO/MVM-BIB/2024/007',
    title: 'Surat Jalan Pengiriman Batch 7 (DO 829 Set Perangkat ke Workshop Pit South)',
    created_date: '2024-07-15',
    due_date: '2024-07-18',
    creator_name: 'Ekspedisi Multi Trans',
    creator_role: 'Logistik Mitra',
    status: 'Delivered',
    priority: 'High',
    summary: 'Penerimaan 5 kontainer logistik telematika di workshop utama Pit South BIB.',
    items_count: 1147,
    signatures_count: 2,
    required_signatures: 2,
    file_attachment: 'DO_Batch7_Workshop.pdf'
  },
  {
    id: 'pdoc-fms-05',
    project_id: 'proj-famous',
    project_code: 'FAMOUS',
    stage_code: 'MOS',
    stage_number: 5,
    stage_name: 'Material On Site (MOS)',
    doc_number: '007/MVM-BIB/VII/2024',
    title: 'BASTM / MOS Penerimaan Fisik & Cek IMEI Batch 7 (1,147 Perangkat)',
    created_date: '2024-07-19',
    due_date: '2024-07-20',
    creator_name: 'Zainal Fahriandy',
    creator_role: 'Supervisor Workshop',
    status: 'Completed',
    priority: 'Critical',
    summary: 'Berita Acara Serah Terima Material (BASTM) resmi verifikasi IMEI OBU, MDVR, dan GPS sebelum instalasi armada.',
    items_count: 1147,
    signatures_count: 3,
    required_signatures: 3,
    file_attachment: 'BASTM_007_MVM_BIB_VII_2024.pdf'
  },
  {
    id: 'pdoc-fms-06',
    project_id: 'proj-famous',
    project_code: 'FAMOUS',
    stage_code: 'QC',
    stage_number: 6,
    stage_name: 'Commissioning & QC',
    doc_number: 'QC/FMS/2024/08-012',
    title: 'Sertifikat Uji Fungsional AI DSM Fatigue Alert & Stamping QR Unit Truk',
    created_date: '2024-08-05',
    due_date: '2024-08-10',
    creator_name: 'Tim QC Pit South',
    creator_role: 'QC Inspector',
    status: 'Certified',
    priority: 'High',
    summary: 'Inspeksi sensor drowsiness, yawning alert, lane departure, dan konektivitas live video streaming 4G LTE.',
    items_count: 825,
    signatures_count: 2,
    required_signatures: 2,
    file_attachment: 'QC_Certification_Fleet_825.pdf'
  },
  {
    id: 'pdoc-fms-07',
    project_id: 'proj-famous',
    project_code: 'FAMOUS',
    stage_code: 'Operational',
    stage_number: 7,
    stage_name: 'Operasional & Mutasi / Pindahan',
    doc_number: '010/MVM-BIB/VIII/2024',
    title: 'Berita Acara Pindahan Komponen Antar-Armada Truk Hauling (Relokasi / Pindahan)',
    created_date: '2024-08-03',
    due_date: '2024-08-15',
    creator_name: 'Teknisi Fleet Support',
    creator_role: 'Field Technician',
    status: 'In-Use',
    priority: 'Medium',
    summary: 'Pencatatan perpindahan unit sensor ex-KMB 5116, ex-BMT 3300, dan ex-AMM 9525 ke unit cadangan operasional aktif.',
    items_count: 3976,
    signatures_count: 2,
    required_signatures: 2,
    file_attachment: 'BA_Pindahan_Unit_010.pdf'
  },
  {
    id: 'pdoc-fms-08',
    project_id: 'proj-famous',
    project_code: 'FAMOUS',
    stage_code: 'Decommissioning',
    stage_number: 8,
    stage_name: 'Afkir & Decommissioning',
    doc_number: 'BAA/FMS/2025/002',
    title: 'Berita Acara Afkir Kamera CCTV & MDVR Rusak Insiden Unit GECL 9008',
    created_date: '2025-01-15',
    due_date: '2025-01-30',
    creator_name: 'Arya Pratama',
    creator_role: 'Superadmin',
    status: 'Approved',
    priority: 'Low',
    summary: 'Pemusnahan perangkat terbakar / hancur pasca insiden di hauling KM 22 dengan verifikasi berita acara manajemen.',
    items_count: 4,
    signatures_count: 3,
    required_signatures: 3,
    file_attachment: 'BAA_Afkir_FMS_Insiden_9008.pdf'
  }
];

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
// 0. PROJECT AUTHORITIES & ACCESS CONTROL
// ==========================================

// GET /api/project-inventory/authorities — Superadmin only: view user project authorities
router.get('/authorities', requireAuth, superadminOnly, async (req, res, next) => {
  try {
    let users = [];
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, role, department, company, is_active, is_approved')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        users = data;
      }
    } catch (e) {}

    if (users.length === 0) {
      users = [
        { id: 'demo-user-001', email: 'arya-user@digitech.co.id', full_name: 'arya-user', role: 'User', company: 'Digitech', department: 'Operations', is_active: true, is_approved: true },
        { id: 'demo-admin-001', email: 'arya-admin@digitech.co.id', full_name: 'arya-admin', role: 'Admin', company: 'Digitech', department: 'Inventory Control', is_active: true, is_approved: true },
        { id: 'demo-sa-001', email: 'arya-superadmin@digitech.co.id', full_name: 'arya-superadmin', role: 'Superadmin', company: 'Digitech', department: 'System Administration', is_active: true, is_approved: true },
        { id: 'user-pending-001', email: 'budi.santoso@vgt.co.id', full_name: 'Budi Santoso', role: 'User', company: 'VGT', department: 'Maintenance Pit 2', is_active: false, is_approved: false }
      ];
    }

    let allProjects = FALLBACK_PROJECTS;
    try {
      const { data: dbProjects } = await supabase
        .from('project_workspaces')
        .select('*')
        .order('created_at', { ascending: true });
      if (dbProjects && dbProjects.length > 0) {
        allProjects = dbProjects;
      }
    } catch (e) {}

    allProjects.forEach(p => registerProjectId(p.id));

    const authoritiesMap = getAuthoritiesMap();
    const enrichedUsers = users.map(u => ({
      ...u,
      allowed_projects: u.role === 'Superadmin'
        ? [...ALL_PROJECT_IDS]
        : (authoritiesMap[u.id] || (u.role === 'Admin' ? ['proj-famous'] : ['proj-wim']))
    }));

    const projectsList = allProjects.map(p => ({
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description,
      site_location: p.site_location,
      color_theme: p.color_theme,
      status: p.status
    }));

    return sendSuccess(res, {
      users: enrichedUsers,
      projects: projectsList,
      all_project_ids: ALL_PROJECT_IDS
    }, 'Daftar hak otoritas project pengguna berhasil diambil.');
  } catch (err) {
    next(err);
  }
});

// PUT /api/project-inventory/authorities/:userId — Superadmin only: update user's allowed projects
router.put('/authorities/:userId', requireAuth, superadminOnly, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { allowed_projects } = req.body;

    if (!Array.isArray(allowed_projects)) {
      throw new AppError('allowed_projects wajib berupa array kode project ID.', 400, 'VALIDATION_FAILED');
    }

    const updated = setUserAllowedProjects(userId, allowed_projects);
    return sendSuccess(res, { userId, allowed_projects: updated }, `Hak otoritas project untuk pengguna ${userId} berhasil diperbarui.`);
  } catch (err) {
    next(err);
  }
});

// GET /api/project-inventory/my-authorities — Current user's project authorities
router.get('/my-authorities', requireAuth, (req, res) => {
  const allowed = getUserAllowedProjects(req.user.id, req.user.role);
  return sendSuccess(res, {
    user_id: req.user.id,
    role: req.user.role,
    allowed_projects: allowed,
    is_superadmin: req.user.role === 'Superadmin'
  }, 'Hak otoritas project akun aktif.');
});

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
      const isAuthorized = req.user ? checkUserProjectAccess(req.user, proj.id) : true;
      const isLocked = !isAuthorized;

      // If FAMOUS, use real dataset statistics!
      if (proj.id === 'proj-famous' || proj.code === 'FAMOUS') {
        const totalItems = FAMOUS_SUMMARY.total_items || FAMOUS_ITEMS.length || 9416;
        const installedCount = FAMOUS_SUMMARY.by_status?.['Terinstall'] || 6513;
        const warehouseStock = FAMOUS_SUMMARY.by_status?.['Onsite'] || 2028;
        const damagedCount = (FAMOUS_SUMMARY.by_status?.['Rusak'] || 646) + (FAMOUS_SUMMARY.by_status?.['Return'] || 193);
        const fleetUnitsCount = FAMOUS_SUMMARY.fleet_summary?.total_units || 825;

        return {
          ...proj,
          is_authorized: isAuthorized,
          is_locked: isLocked,
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

      // If WIM, use real dataset statistics!
      if (proj.id === 'proj-wim' || proj.code === 'WIM') {
        const totalComponents = WIM_SUMMARY.total_components || WIM_COMPONENTS.length || 189;
        const installedCount = WIM_SUMMARY.by_status?.['Terpasang'] || 116;
        const warehouseStock = WIM_SUMMARY.by_lane?.['Gudang / Office VGT'] || 70;
        const damagedCount = (WIM_SUMMARY.by_condition?.['Rusak'] || 4) + (WIM_SUMMARY.by_condition?.['Discontinue / Rusak'] || 2);
        const warrantyCount = WIM_SUMMARY.total_warranty_items || WIM_WARRANTY.length || 41;

        return {
          ...proj,
          is_authorized: isAuthorized,
          is_locked: isLocked,
          stats: {
            total_items: totalComponents,
            installed_count: installedCount,
            warehouse_stock: warehouseStock,
            damaged_count: damagedCount,
            warehouses_count: 2,
            active_warranty: warrantyCount,
            expiring_warranty: 2
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
        is_authorized: isAuthorized,
        is_locked: isLocked,
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

    registerProjectId(newProject.id);

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
router.get('/warehouses', requireAuth, requireProjectAccess(req => req.query.project_id), async (req, res, next) => {
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
router.get('/famous/summary', requireAuth, requireProjectAccess('proj-famous'), (req, res) => {
  return sendSuccess(res, FAMOUS_SUMMARY, 'Ringkasan data real project FAMOUS.');
});

// GET /api/project-inventory/famous/fleet-matrix
router.get('/famous/fleet-matrix', requireAuth, requireProjectAccess('proj-famous'), (req, res) => {
  let { search, mitra, health, page = 1, limit = 50 } = req.query;
  page = parseInt(page) || 1;
  const isAll = limit === 'all';
  const pageLimit = isAll ? FAMOUS_FLEET_MATRIX.length : (parseInt(limit) || 50);

  let filtered = FAMOUS_FLEET_MATRIX;

  if (search) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(u =>
      (u.unit_code && u.unit_code.toLowerCase().includes(q)) ||
      (u.unit_number && u.unit_number.toLowerCase().includes(q)) ||
      (u.mitra && u.mitra.toLowerCase().includes(q)) ||
      (u.transfers_history && u.transfers_history.some(th =>
        (th.transferred_from && th.transferred_from.toLowerCase().includes(q)) ||
        (th.serial_number && th.serial_number.toLowerCase().includes(q))
      ))
    );
  }

  if (mitra && mitra.toUpperCase() !== 'ALL') {
    filtered = filtered.filter(u => u.mitra && u.mitra.toUpperCase() === mitra.toUpperCase());
  }

  if (health && health.toUpperCase() !== 'ALL') {
    filtered = filtered.filter(u => (u.health || u.health_status || '').toLowerCase() === health.toLowerCase());
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
router.get('/famous/items', requireAuth, requireProjectAccess('proj-famous'), (req, res) => {
  let { search, category, status, mitra, is_pindahan, page = 1, limit = 50 } = req.query;
  page = parseInt(page) || 1;
  const isAll = limit === 'all';
  const pageLimit = isAll ? FAMOUS_ITEMS.length : (parseInt(limit) || 50);

  let filtered = FAMOUS_ITEMS;

  if (search) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(item =>
      (item.serial_number && item.serial_number.toLowerCase().includes(q)) ||
      (item.asset_number && item.asset_number.toLowerCase().includes(q)) ||
      (item.imei && item.imei.toLowerCase().includes(q)) ||
      (item.imei_1 && item.imei_1.toLowerCase().includes(q)) ||
      (item.imei_2 && item.imei_2.toLowerCase().includes(q)) ||
      (item.unit_code && item.unit_code.toLowerCase().includes(q)) ||
      (item.unit_number && item.unit_number.toLowerCase().includes(q)) ||
      (item.transferred_from && item.transferred_from.toLowerCase().includes(q)) ||
      (item.bastm_number && item.bastm_number.toLowerCase().includes(q)) ||
      (item.notes && item.notes.toLowerCase().includes(q))
    );
  }

  if (category && category.toUpperCase() !== 'ALL') {
    filtered = filtered.filter(i => i.category && i.category.toLowerCase() === category.toLowerCase());
  }

  if (status && status.toUpperCase() !== 'ALL') {
    if (status.toLowerCase() === 'rma') {
      filtered = filtered.filter(i => i.status === 'Rusak' || i.status === 'Return');
    } else if (status.toLowerCase() === 'pindahan') {
      filtered = filtered.filter(i => i.is_pindahan || i.status === 'Pindahan');
    } else {
      filtered = filtered.filter(i => i.status && i.status.toLowerCase() === status.toLowerCase());
    }
  }

  if (mitra && mitra.toUpperCase() !== 'ALL') {
    filtered = filtered.filter(i => i.mitra && i.mitra.toUpperCase() === mitra.toUpperCase());
  }

  if (is_pindahan === 'true') {
    filtered = filtered.filter(i => i.is_pindahan || (i.transferred_from && i.transferred_from !== '-'));
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
// 2.6 REAL WIM PROJECT DEDICATED APIS
// ==========================================

// GET /api/project-inventory/wim/summary
router.get('/wim/summary', requireAuth, requireProjectAccess('proj-wim'), (req, res) => {
  return sendSuccess(res, WIM_SUMMARY, 'Ringkasan data real project WIM (Weigh-In-Motion).');
});

// GET /api/project-inventory/wim/components
router.get('/wim/components', requireAuth, requireProjectAccess('proj-wim'), (req, res) => {
  let { search, category, status, condition, lane, page = 1, limit = 50 } = req.query;
  page = parseInt(page) || 1;
  const isAll = limit === 'all';
  const pageLimit = isAll ? WIM_COMPONENTS.length : (parseInt(limit) || 50);

  let filtered = WIM_COMPONENTS;

  if (search) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(c =>
      (c.serial_number && c.serial_number.toLowerCase().includes(q)) ||
      (c.item_code && c.item_code.toLowerCase().includes(q)) ||
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.model_type && c.model_type.toLowerCase().includes(q)) ||
      (c.location && c.location.toLowerCase().includes(q)) ||
      (c.po_number && c.po_number.toLowerCase().includes(q)) ||
      (c.transferred_from && c.transferred_from.toLowerCase().includes(q)) ||
      (c.notes && c.notes.toLowerCase().includes(q))
    );
  }

  if (category && category.toUpperCase() !== 'ALL') {
    filtered = filtered.filter(c => c.category && c.category.toLowerCase() === category.toLowerCase());
  }

  if (status && status.toUpperCase() !== 'ALL') {
    filtered = filtered.filter(c => c.status && c.status.toLowerCase() === status.toLowerCase());
  }

  if (condition && condition.toUpperCase() !== 'ALL') {
    filtered = filtered.filter(c => c.condition && c.condition.toLowerCase() === condition.toLowerCase());
  }

  if (lane && lane.toUpperCase() !== 'ALL') {
    filtered = filtered.filter(c => c.lane && c.lane.toLowerCase().includes(lane.toLowerCase()));
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageLimit) || 1;
  const startIndex = (page - 1) * pageLimit;
  const pagedItems = isAll ? filtered : filtered.slice(startIndex, startIndex + pageLimit);

  return sendSuccess(res, {
    components: pagedItems,
    pagination: {
      page,
      limit: pageLimit,
      total,
      total_pages: totalPages
    }
  }, 'Daftar komponen fisik timbangan WIM berhasil diambil.');
});

// GET /api/project-inventory/wim/transactions
router.get('/wim/transactions', requireAuth, requireProjectAccess('proj-wim'), (req, res) => {
  let { search, category, stock_type, lane, page = 1, limit = 50 } = req.query;
  page = parseInt(page) || 1;
  const isAll = limit === 'all';
  const pageLimit = isAll ? WIM_TRANSACTIONS.length : (parseInt(limit) || 50);

  let filtered = WIM_TRANSACTIONS;

  if (search) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(t =>
      (t.category && t.category.toLowerCase().includes(q)) ||
      (t.action && t.action.toLowerCase().includes(q)) ||
      (t.notes && t.notes.toLowerCase().includes(q)) ||
      (t.lane && t.lane.toLowerCase().includes(q))
    );
  }

  if (category && category.toUpperCase() !== 'ALL') {
    filtered = filtered.filter(t => t.category && t.category.toLowerCase() === category.toLowerCase());
  }

  if (stock_type && stock_type.toUpperCase() !== 'ALL') {
    filtered = filtered.filter(t => t.stock_type && t.stock_type.toLowerCase().includes(stock_type.toLowerCase()));
  }

  if (lane && lane.toUpperCase() !== 'ALL') {
    filtered = filtered.filter(t => t.lane && t.lane.toLowerCase().includes(lane.toLowerCase()));
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageLimit) || 1;
  const startIndex = (page - 1) * pageLimit;
  const pagedItems = isAll ? filtered : filtered.slice(startIndex, startIndex + pageLimit);

  return sendSuccess(res, {
    transactions: pagedItems,
    pagination: {
      page,
      limit: pageLimit,
      total,
      total_pages: totalPages
    }
  }, 'Daftar riwayat transaksi stok WIM berhasil diambil.');
});

// GET /api/project-inventory/wim/warranty
router.get('/wim/warranty', requireAuth, requireProjectAccess('proj-wim'), (req, res) => {
  let { search, section } = req.query;
  let filtered = WIM_WARRANTY;

  if (search) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(w =>
      (w.item_name && w.item_name.toLowerCase().includes(q)) ||
      (w.part_number && w.part_number.toLowerCase().includes(q)) ||
      (w.warranty_period && w.warranty_period.toLowerCase().includes(q))
    );
  }

  if (section && section.toUpperCase() !== 'ALL') {
    filtered = filtered.filter(w => w.section && w.section.toLowerCase().includes(section.toLowerCase()));
  }

  return sendSuccess(res, {
    warranty_items: filtered,
    total: filtered.length
  }, 'Daftar katalog garansi & lead time sparepart WIM berhasil diambil.');
});

// ==========================================
// 2.7 PROJECT 8-STAGE DOCUMENTS APIS
// ==========================================

// GET /api/project-inventory/documents
router.get('/documents', requireAuth, requireProjectAccess(req => req.query.project_id), (req, res) => {
  let { project_id, stage_code, status, search } = req.query;
  let filtered = PROJECT_DOCUMENTS;

  if (project_id) {
    filtered = filtered.filter(d => d.project_id === project_id || (d.project_code && d.project_code.toLowerCase() === project_id.toLowerCase().replace('proj-', '')));
  }

  if (stage_code && stage_code.toUpperCase() !== 'ALL') {
    filtered = filtered.filter(d => d.stage_code && d.stage_code.toUpperCase() === stage_code.toUpperCase());
  }

  if (status && status.toUpperCase() !== 'ALL') {
    filtered = filtered.filter(d => d.status && d.status.toLowerCase() === status.toLowerCase());
  }

  if (search) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(d =>
      (d.doc_number && d.doc_number.toLowerCase().includes(q)) ||
      (d.title && d.title.toLowerCase().includes(q)) ||
      (d.creator_name && d.creator_name.toLowerCase().includes(q)) ||
      (d.summary && d.summary.toLowerCase().includes(q))
    );
  }

  return sendSuccess(res, {
    documents: filtered,
    total: filtered.length,
    project_id: project_id || 'all'
  }, 'Daftar dokumen 8 tahap proyek berhasil diambil.');
});

// POST /api/project-inventory/documents
router.post('/documents', requireAuth, (req, res) => {
  const { project_id, stage_code, title, doc_number, summary, priority, file_attachment, file_data, file_type } = req.body;
  if (!project_id || !stage_code || !title) {
    throw new AppError('project_id, stage_code, dan title wajib diisi.', 400, 'VALIDATION_FAILED');
  }

  const stageMap = {
    'RFI': { num: 1, name: 'Request for Information' },
    'PR': { num: 2, name: 'Purchase Requisition' },
    'PO': { num: 3, name: 'Purchase Order' },
    'Delivery': { num: 4, name: 'Ekspedisi & Surat Jalan' },
    'MOS': { num: 5, name: 'Material On Site (MOS)' },
    'QC': { num: 6, name: 'Commissioning & QC' },
    'Operational': { num: 7, name: 'Operasional & Mutasi / Pindahan' },
    'Decommissioning': { num: 8, name: 'Afkir & Decommissioning' }
  };

  const stageInfo = stageMap[stage_code] || { num: 1, name: stage_code };

  let fileUrl = null;
  if (file_data && file_attachment) {
    try {
      const safeName = `${Date.now()}_${file_attachment.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const uploadsDir = path.join(__dirname, '..', 'uploads', 'documents');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filePath = path.join(uploadsDir, safeName);
      if (file_data.includes(';base64,')) {
        const base64Data = file_data.split(';base64,').pop();
        fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });
      } else {
        fs.writeFileSync(filePath, file_data, 'utf8');
      }
      fileUrl = `/uploads/documents/${safeName}`;
    } catch (e) {
      console.warn('Failed to save file to disk:', e.message);
    }
  }

  const newDoc = {
    id: `pdoc-${Date.now()}`,
    project_id,
    project_code: project_id.replace('proj-', '').toUpperCase(),
    stage_code,
    stage_number: stageInfo.num,
    stage_name: stageInfo.name,
    doc_number: doc_number || `DOC/${project_id.toUpperCase()}/${stage_code}/${new Date().getFullYear()}/${Math.floor(Math.random() * 900 + 100)}`,
    title,
    created_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    creator_name: req.user?.full_name || 'Staff Lapangan',
    creator_role: req.user?.role || 'User',
    status: 'Submitted',
    priority: priority || 'Medium',
    summary: summary || '-',
    items_count: 1,
    signatures_count: 1,
    required_signatures: 2,
    file_attachment: file_attachment || 'Dokumen_Proyek.pdf',
    file_url: fileUrl || null,
    file_data: file_data || null,
    file_type: file_type || (file_attachment?.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image')
  };

  PROJECT_DOCUMENTS.unshift(newDoc);
  return sendCreated(res, newDoc, 'Dokumen tahap berhasil ditambahkan ke proyek.');
});

// POST /api/project-inventory/documents/:id/attachment (Upload / Attach PDF or Image to Document)
router.post('/documents/:id/attachment', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { file_name, file_data, file_type, summary } = req.body;

  const doc = PROJECT_DOCUMENTS.find(d => d.id === id);
  if (!doc) {
    throw new AppError('Dokumen tidak ditemukan.', 404, 'NOT_FOUND');
  }

  let fileUrl = null;
  if (file_data && file_name) {
    try {
      const safeName = `${Date.now()}_${file_name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const uploadsDir = path.join(__dirname, '..', 'uploads', 'documents');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filePath = path.join(uploadsDir, safeName);
      if (file_data.includes(';base64,')) {
        const base64Data = file_data.split(';base64,').pop();
        fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });
      } else {
        fs.writeFileSync(filePath, file_data, 'utf8');
      }
      fileUrl = `/uploads/documents/${safeName}`;
    } catch (e) {
      console.warn('Failed to save file to disk:', e.message);
    }
  }

  doc.file_attachment = file_name || doc.file_attachment;
  doc.file_url = fileUrl || doc.file_url;
  doc.file_data = file_data || doc.file_data;
  doc.file_type = file_type || (file_name?.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image');
  if (summary) doc.summary = summary;
  doc.updated_at = new Date().toISOString();

  return sendSuccess(res, doc, 'Berkas fisik berhasil disimpan dan diakses pada database.');
});

// POST /api/project-inventory/documents/:id/sign (Otorisasi Digital & Tanda Tangan Dokumen Proyek)
router.post('/documents/:id/sign', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { signature_image, signer_name, signer_role, slot, x_percent, y_percent } = req.body;

  const doc = PROJECT_DOCUMENTS.find(d => d.id === id);
  if (!doc) {
    throw new AppError('Dokumen tidak ditemukan.', 404, 'NOT_FOUND');
  }

  if (!doc.signatures) {
    doc.signatures = [];
  }

  const sigRecord = {
    id: `sig-${Date.now()}`,
    signer_name: signer_name || req.user?.full_name || 'Staff Terverifikasi',
    signer_role: signer_role || req.user?.role || 'Staff Lapangan',
    timestamp: new Date().toISOString(),
    signature_image: signature_image || null,
    x_percent: x_percent || 50,
    y_percent: y_percent || 80,
    slot: slot || 'slot1'
  };

  doc.signatures.push(sigRecord);
  doc.signatures_count = (doc.signatures_count || 0) + 1;
  if (doc.signatures_count >= (doc.required_signatures || 2)) {
    doc.status = 'Approved';
  }
  doc.updated_at = new Date().toISOString();

  return sendSuccess(res, doc, 'Tanda tangan digital berhasil disahkan pada dokumen.');
});

// ==========================================
// 3. PROJECT INVENTORY ITEMS & ASSETS
// ==========================================

// GET /api/project-inventory/items
router.get('/items', requireAuth, requireProjectAccess(req => req.query.project_id), async (req, res, next) => {
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
router.post('/request', requireAuth, requireProjectAccess(req => req.body.project_id), async (req, res, next) => {
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
router.get('/logs', requireAuth, requireProjectAccess(req => req.query.project_id), async (req, res, next) => {
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
