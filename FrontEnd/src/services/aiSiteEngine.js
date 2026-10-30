/**
 * AI In-Site Engine (NON-LLM / Zero Prompt Injection Vulnerability)
 * Deterministic Computer Vision Detector, Document Parameter Classifier,
 * and Fuzzy Weighted In-Site Search Machine.
 */

import jsQR from 'jsqr';
import { getProjects, getProjectItems, getProjectDocuments } from '../api/projectInventoryApi';
import api from '../api/client';

/**
 * 1. COMPUTER VISION: QR CODE DETECTOR FROM IMAGE / VIDEO CANVAS
 * Decodes QR code from an HTML5 Canvas or ImageData using jsQR
 */
export function detectQRCodeFromImageData(imageData) {
  if (!imageData) return null;
  try {
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });
    if (code && code.data) {
      return {
        raw: code.data,
        location: code.location,
        parsed: parseDigitechQRPayload(code.data)
      };
    }
  } catch (err) {
    console.warn('[AI Detector] QR decode error:', err);
  }
  return null;
}

/**
 * Parse and validate internal Digitech QR payload format
 * e.g. IMS:ITEM:SKU:WIM-LC-50T:SN:LC50T-2026-001:LOK:R-A01:PROJ:proj-wim
 * or verification URL: https://digitech-gems.id/verify?sku=...
 */
export function parseDigitechQRPayload(rawText) {
  if (!rawText) return null;

  const result = {
    type: 'GENERIC',
    sku: null,
    serialNumber: null,
    rack: null,
    projectId: null,
    docNumber: null,
    stage: null,
    unit: null,
    isDigitechStandard: false
  };

  // Format 1: Standard IMS Colon-Delimited Payload
  if (rawText.startsWith('IMS:')) {
    result.isDigitechStandard = true;
    const parts = rawText.split(':');

    for (let i = 0; i < parts.length; i++) {
      const key = parts[i].toUpperCase();
      const val = parts[i + 1] || '';

      if (key === 'ITEM') result.type = 'ITEM';
      if (key === 'DOC') result.type = 'DOCUMENT';
      if (key === 'FLEET' || key === 'UNIT') result.type = 'FLEET';
      if (key === 'RACK') result.type = 'RACK';

      if (key === 'SKU' || key === 'CODE') result.sku = val;
      if (key === 'SN' || key === 'SERIAL') result.serialNumber = val;
      if (key === 'LOK' || key === 'RACK') result.rack = val;
      if (key === 'PROJ') result.projectId = val;
      if (key === 'DOCNO') result.docNumber = val;
      if (key === 'STAGE') result.stage = val;
      if (key === 'UNIT') result.unit = val;
    }
    return result;
  }

  // Format 2: URL Parameters (e.g., https://.../verify?sku=...)
  if (rawText.includes('?') && (rawText.includes('sku=') || rawText.includes('doc=') || rawText.includes('sn='))) {
    try {
      const url = new URL(rawText);
      result.isDigitechStandard = true;
      result.sku = url.searchParams.get('sku') || url.searchParams.get('code');
      result.serialNumber = url.searchParams.get('sn');
      result.docNumber = url.searchParams.get('doc');
      result.projectId = url.searchParams.get('proj');
      result.type = result.docNumber ? 'DOCUMENT' : 'ITEM';
      return result;
    } catch {}
  }

  // Format 3: Raw Serial or Document Pattern Regex
  if (/^[A-Z0-9]{3,}-[A-Z0-9]{3,}-[A-Z0-9]{3,}$/i.test(rawText)) {
    result.type = 'SERIAL_OR_SKU';
    result.sku = rawText;
    return result;
  }

  if (/\d{3}\/[A-Z0-9\-_/]+/i.test(rawText)) {
    result.type = 'DOCUMENT';
    result.docNumber = rawText;
    return result;
  }

  return result;
}

/**
 * 2. HEURISTIC DOCUMENT PARAMETER CLASSIFIER (Zero Prompt Injection)
 * Analyzes document text, metadata, filenames, and headers to identify
 * the 8-Stage MOS classification and extracted parameters.
 */
export function classifyDocumentParameters(input) {
  const text = (typeof input === 'string' ? input : (input?.text || input?.name || input?.filename || '')).toUpperCase();
  const filename = (input?.filename || input?.name || '').toUpperCase();
  const fullContent = `${text} ${filename}`;

  const classification = {
    detected: false,
    stageNumber: 5,
    stageCode: 'MOS',
    stageName: 'Material On Site (MOS)',
    confidenceScore: 0.85,
    docNumber: null,
    projectId: 'proj-wim',
    projectCode: 'WIM',
    urgency: 'Medium',
    signaturesRequired: 3,
    status: 'Verified',
    extractedTags: []
  };

  // 1. Detect 8 Stages
  if (fullContent.includes('RFI') || fullContent.includes('REQUEST FOR INFORMATION') || fullContent.includes('KAJIAN')) {
    classification.stageNumber = 1;
    classification.stageCode = 'RFI';
    classification.stageName = 'Request for Information';
    classification.signaturesRequired = 1;
  } else if (fullContent.includes('PURCHASE REQUISITION') || fullContent.includes('PR-') || fullContent.includes('/PR/')) {
    classification.stageNumber = 2;
    classification.stageCode = 'PR';
    classification.stageName = 'Purchase Requisition';
    classification.signaturesRequired = 2;
  } else if (fullContent.includes('PURCHASE ORDER') || fullContent.includes('PO-') || fullContent.includes('/PO/')) {
    classification.stageNumber = 3;
    classification.stageCode = 'PO';
    classification.stageName = 'Purchase Order';
    classification.signaturesRequired = 2;
  } else if (fullContent.includes('SURAT JALAN') || fullContent.includes('DELIVERY') || fullContent.includes('EKSPEDISI') || fullContent.includes('DO/')) {
    classification.stageNumber = 4;
    classification.stageCode = 'Delivery';
    classification.stageName = 'Ekspedisi & Surat Jalan';
    classification.signaturesRequired = 2;
  } else if (fullContent.includes('MOS') || fullContent.includes('BASTM') || fullContent.includes('MATERIAL ON SITE') || fullContent.includes('PENERIMAAN FISIK')) {
    classification.stageNumber = 5;
    classification.stageCode = 'MOS';
    classification.stageName = 'Material On Site (MOS)';
    classification.signaturesRequired = 3;
  } else if (fullContent.includes('QC') || fullContent.includes('COMMISSIONING') || fullContent.includes('QUALITY CONTROL') || fullContent.includes('FATIGUE ALERT')) {
    classification.stageNumber = 6;
    classification.stageCode = 'QC';
    classification.stageName = 'Commissioning & QC';
    classification.signaturesRequired = 2;
  } else if (fullContent.includes('PINDAHAN') || fullContent.includes('MUTASI') || fullContent.includes('RELOKASI') || fullContent.includes('EX-UNIT')) {
    classification.stageNumber = 7;
    classification.stageCode = 'Operational';
    classification.stageName = 'Operasional & Mutasi Unit';
    classification.signaturesRequired = 2;
  } else if (fullContent.includes('AFKIR') || fullContent.includes('DECOMMISSIONING') || fullContent.includes('SCRAP') || fullContent.includes('DISPOSAL')) {
    classification.stageNumber = 8;
    classification.stageCode = 'Decommissioning';
    classification.stageName = 'Afkir & Decommissioning';
    classification.signaturesRequired = 3;
  }

  // 2. Detect Project Workspace
  if (fullContent.includes('FAMOUS') || fullContent.includes('FLEET') || fullContent.includes('MDVR') || fullContent.includes('GPS') || fullContent.includes('HAULING')) {
    classification.projectId = 'proj-famous';
    classification.projectCode = 'FAMOUS';
  } else if (fullContent.includes('WIM') || fullContent.includes('LOADCELL') || fullContent.includes('TIMBANGAN') || fullContent.includes('SCALE')) {
    classification.projectId = 'proj-wim';
    classification.projectCode = 'WIM';
  } else if (fullContent.includes('CCM') || fullContent.includes('CRUSHER') || fullContent.includes('COAL') || fullContent.includes('CONVEYOR')) {
    classification.projectId = 'proj-ccm';
    classification.projectCode = 'CCM';
  }

  // 3. Extract Document Number Regex Pattern
  const docNoMatch = fullContent.match(/(\d{3}\/[A-Z0-9_\-./]+|(?:PO|PR|QC|DO|MOS|RFI)-[A-Z0-9_\-./]+)/i);
  if (docNoMatch) {
    classification.docNumber = docNoMatch[1];
    classification.confidenceScore = 0.96;
    classification.detected = true;
  } else {
    classification.docNumber = `DOC/${classification.projectCode}/${classification.stageCode}/${new Date().getFullYear()}`;
    classification.detected = true;
  }

  // 4. Urgency Heuristic
  if (fullContent.includes('CRITICAL') || fullContent.includes('RUSAK') || fullContent.includes('DARURAT') || fullContent.includes('BREAKDOWN')) {
    classification.urgency = 'Critical';
  } else if (fullContent.includes('HIGH') || fullContent.includes('SEGERA')) {
    classification.urgency = 'High';
  }

  return classification;
}

// Curated Operational Fallbacks for Instant Client-Side Indexing
const DEFAULT_WIM_COMPONENTS = [
  { item_code: 'WIM-LC-50T', name: 'Load Cell Compression 50 Ton Digital', serial_number: 'LC50T-2026-001', lane_location: 'Lane 1 Pit Sebamban', status: 'Optimal' },
  { item_code: 'WIM-IND-XK3190', name: 'Digital Weight Indicator XK3190-A9+', serial_number: 'IND-XK-8821', lane_location: 'Control Cabin Lane 1', status: 'Optimal' },
  { item_code: 'WIM-JB-8W', name: 'Waterproof Stainless Junction Box 8-Wire', serial_number: 'JB8W-2026-04', lane_location: 'Scale Pit Understructure', status: 'Optimal' },
  { item_code: 'WIM-DSP-LED', name: 'Remote Display Scoreboard 5-Inch Ultra-Bright LED', serial_number: 'DSP-LED-5IN-02', lane_location: 'Gantry Pole Entrance', status: 'Optimal' },
  { item_code: 'WIM-SPD-LOOP', name: 'Inductive Loop Speed & Axle Sensor Coil', serial_number: 'LOOP-2026-A1', lane_location: 'Approach Ramp Lane 1', status: 'Optimal' }
];

const DEFAULT_FAMOUS_ITEMS = [
  { item_code: 'FMS-GPS-4G', device_type: 'GPS Tracker 4G LTE High-Precision', imei: '864201048821901', installed_unit: 'DT-BIB-04', mitra: 'PT BIB Hauling', status: 'Active' },
  { item_code: 'FMS-DSM-CAM', device_type: 'DSM AI Fatigue & Distraction Sensor Camera', imei: '864201048821902', installed_unit: 'DT-BIB-04', mitra: 'PT BIB Hauling', status: 'Active' },
  { item_code: 'FMS-ADAS-01', device_type: 'ADAS Forward Collision Warning Dual-Lens Camera', imei: '864201048821903', installed_unit: 'DT-BIB-07', mitra: 'PT BIB Hauling', status: 'Active' },
  { item_code: 'FMS-FLS-ULTRA', device_type: 'Ultra-Sonic Real-time Fuel Level Sensor', imei: '864201048821904', installed_unit: 'DT-BIB-12', mitra: 'PT BIB Hauling', status: 'Active' },
  { item_code: 'FMS-RFID-RDR', device_type: 'Driver RFID Reader & Auto-Immobilizer', imei: '864201048821905', installed_unit: 'DT-BIB-15', mitra: 'PT BIB Hauling', status: 'Active' }
];

const DEFAULT_INVENTORY_ITEMS = [
  { sku: 'BIB-CAT-777D-FLTR', name: 'Cat 777D Engine Oil Filter Heavy Duty', rack: 'R-A01', current_stock: 4, unit: 'PCS', category: 'Heavy Equipment Parts', brand: 'Caterpillar' },
  { sku: 'BIB-KOM-PC2000-HYD', name: 'Komatsu PC2000 Hydraulic Cylinder Seal Kit', rack: 'R-A02', current_stock: 18, unit: 'SET', category: 'Hydraulics', brand: 'Komatsu' },
  { sku: 'BIB-VOL-FMX-BRK', name: 'Volvo FMX 440 Heavy Duty Brake Lining Assm', rack: 'R-B01', current_stock: 32, unit: 'SET', category: 'Hauling Fleet', brand: 'Volvo' },
  { sku: 'BIB-LUB-SHL-T68', name: 'Shell Tellus S2 V 68 Industrial Hydraulic Oil', rack: 'R-C01', current_stock: 6, unit: 'DRUM', category: 'Lubricants & Fuel', brand: 'Shell' }
];

/**
 * 3. IN-SITE SEARCHING MACHINE (DETERMINISTIC WEIGHTED FUZZY INDEX)
 * Indexes local items, fleet units, documents, projects, and warehouses.
 * Completely immune to prompt injection attacks.
 */
class InSiteSearchEngine {
  constructor() {
    this.index = [];
    this.isLoaded = false;
    this.lastFetched = 0;
    this.seedInitialIndex();
  }

  seedInitialIndex() {
    const items = [];
    // Seed Projects (Original 3 Workspace Projects: WIM, FAMOUS, CCM)
    items.push(
      { id: 'proj-wim', type: 'PROJECT', category: 'Project Workspace', title: 'Project WIM • Weigh-In-Motion BIB Pit Sebamban', code: 'WIM', subtitle: 'Site Tambang BIB • KM 14.5', description: 'Jembatan Timbang Berkecepatan Tinggi', url: '/project-inventory?project=proj-wim', badge: 'WIM', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200', keywords: ['wim', 'timbangan', 'weigh', 'scale', 'sebamban'] },
      { id: 'proj-famous', type: 'PROJECT', category: 'Project Workspace', title: 'Project FAMOUS • Fleet Telematics & Safety System', code: 'FAMOUS', subtitle: 'Site Tambang BIB • Fleet Management', description: '825 Unit Armada Hauling & Sensor Kelelahan Pengemudi', url: '/project-inventory?project=proj-famous', badge: 'FAMOUS', badgeColor: 'bg-red-50 text-red-700 border-red-200', keywords: ['famous', 'armada', 'truk', 'gps', 'telematika'] },
      { id: 'proj-ccm', type: 'PROJECT', category: 'Project Workspace', title: 'Project CCM • Coal Crushing & Overland Conveyor', code: 'CCM', subtitle: 'Coal Terminal Port BIB', description: 'Crusher & Belt Scale Monitoring', url: '/project-inventory?project=proj-ccm', badge: 'CCM', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200', keywords: ['ccm', 'conveyor', 'crusher', 'coal'] }
    );
    // Seed WIM Hardware
    DEFAULT_WIM_COMPONENTS.forEach(c => {
      items.push({
        id: `wim-${c.item_code}`,
        type: 'HARDWARE',
        category: 'WIM Scale Hardware',
        title: c.name,
        code: c.item_code,
        subtitle: `Lokasi: ${c.lane_location} • Status: ${c.status}`,
        description: `SN: ${c.serial_number}`,
        url: '/project-inventory?project=proj-wim',
        badge: 'WIM',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        keywords: [c.item_code, c.name, c.serial_number, 'load', 'cell', 'loadcell', 'timbangan', 'scale', 'wim']
      });
    });
    // Seed FAMOUS Telematics
    DEFAULT_FAMOUS_ITEMS.forEach(f => {
      items.push({
        id: `fms-${f.item_code}`,
        type: 'FLEET_PART',
        category: 'FAMOUS Telematika',
        title: `${f.device_type} (${f.installed_unit})`,
        code: f.item_code,
        subtitle: `Armada: ${f.installed_unit} • Mitra: ${f.mitra}`,
        description: `IMEI: ${f.imei}`,
        url: '/project-inventory?project=proj-famous',
        badge: 'FAMOUS',
        badgeColor: 'bg-red-50 text-red-700 border-red-200',
        keywords: [f.item_code, f.imei, f.device_type, f.installed_unit, 'gps', 'telematika', 'dsm', 'adas']
      });
    });
    // Seed Materials
    DEFAULT_INVENTORY_ITEMS.forEach(it => {
      items.push({
        id: `mat-${it.sku}`,
        type: 'MATERIAL',
        category: 'Katalog Material',
        title: it.name,
        code: it.sku,
        subtitle: `Rak: ${it.rack} • Stok: ${it.current_stock} ${it.unit}`,
        description: `Brand: ${it.brand}`,
        url: '/inventory',
        badge: it.rack,
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        keywords: [it.name, it.sku, it.rack, it.brand, 'filter', 'seal', 'hydraulic', 'oil', 'material']
      });
    });
    // Seed Quick Actions
    items.push(
      { id: 'act-cyber-qr', type: 'ACTION', category: 'Aksi Cepat', title: 'Generator Cyber QR Code (3D Holographic)', code: 'ACTION:QR_GENERATOR', subtitle: 'Generate QR code dinamis animasi 3D, unduh vector SVG & print', url: '/inventory', badge: 'Cyber QR', badgeColor: 'bg-red-50 text-red-800 border-red-200', keywords: ['qr', 'qrcode', 'generator', 'cetak', 'print'] },
      { id: 'act-mos-approval', type: 'ACTION', category: 'Aksi Cepat', title: 'Verifikasi & Tanda Tangan Dokumen MOS', code: 'ACTION:MOS', subtitle: 'Buka antrean berkas MOS yang menunggu pemeriksaan fisik', url: '/opname', badge: 'Quick Action', badgeColor: 'bg-amber-50 text-amber-800 border-amber-200', keywords: ['verifikasi', 'mos', 'approval'] }
    );
    this.index = items;
  }

  async buildIndex(forceRefresh = false) {
    const now = Date.now();
    // Cache index for 30 seconds
    if (!forceRefresh && this.isLoaded && (now - this.lastFetched < 30000)) {
      return this.index;
    }

    try {
      const [projects, famousItems, wimComponents, documentsRes, inventoryItems] = await Promise.all([
        getProjects().catch(() => []),
        api.get('/project-inventory/famous/items').then(r => r.data?.data || []).catch(() => []),
        api.get('/project-inventory/wim/components').then(r => r.data?.data || []).catch(() => []),
        api.get('/project-inventory/documents').then(r => r.data?.data?.documents || []).catch(() => []),
        api.get('/inventory').then(r => r.data?.data || []).catch(() => [])
      ]);

      const itemsIndex = [];

      // A. Projects Index
      (projects || []).forEach(p => {
        itemsIndex.push({
          id: p.id,
          type: 'PROJECT',
          category: 'Project Workspace',
          title: `Project ${p.code} • ${p.name?.replace(/^Project\s+/i, '')}`,
          code: p.code,
          subtitle: p.site_location || 'Site Tambang BIB',
          description: p.description || '',
          url: `/project-inventory?project=${p.id}`,
          badge: p.code,
          badgeColor: 'bg-red-50 text-red-700 border-red-200',
          keywords: [p.code, p.name, p.site_location, 'workspace', 'proyek', 'site']
        });
      });

      // B. WIM Scale Hardware (Combined Server + Standard Catalog)
      const mergedWim = [...(wimComponents || []), ...DEFAULT_WIM_COMPONENTS];
      const seenWim = new Set();
      mergedWim.forEach(c => {
        const code = c.item_code || c.code || 'WIM-COMP';
        if (seenWim.has(code)) return;
        seenWim.add(code);
        itemsIndex.push({
          id: c.id || `wim-${code}`,
          type: 'HARDWARE',
          category: 'WIM Scale Hardware',
          title: c.name || c.item_name || 'Komponen WIM',
          code: code,
          subtitle: `Lokasi: ${c.lane_location || c.warehouse_name || 'Lane 1 Sebamban'} • Status: ${c.status || 'Aktif'}`,
          description: `SN: ${c.serial_number || '-'} • Garansi: ${c.warranty_status || 'Aktif'}`,
          url: `/project-inventory?project=proj-wim`,
          badge: 'WIM',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          keywords: [code, c.name, c.serial_number, c.lane_location, 'load', 'cell', 'loadcell', 'timbangan', 'scale', 'wim']
        });
      });

      // C. FAMOUS Fleet Telematics Hardware
      const mergedFamous = [...(famousItems || []), ...DEFAULT_FAMOUS_ITEMS];
      const seenFamous = new Set();
      mergedFamous.forEach(f => {
        const code = f.item_code || f.imei || f.serial_number;
        if (seenFamous.has(code)) return;
        seenFamous.add(code);
        itemsIndex.push({
          id: f.id || `fms-${code}`,
          type: 'FLEET_PART',
          category: 'FAMOUS Telematika',
          title: `${f.device_type || f.category || 'Perangkat Telematika'} (${f.installed_unit || 'Armada Hauling'})`,
          code: code,
          subtitle: `Armada: ${f.installed_unit || 'Pool'} • Mitra: ${f.mitra || 'BIB'}`,
          description: `IMEI / SN: ${f.imei || f.serial_number || '-'} • Kondisi: ${f.status || 'Normal'}`,
          url: `/project-inventory?project=proj-famous`,
          badge: 'FAMOUS',
          badgeColor: 'bg-red-50 text-red-700 border-red-200',
          keywords: [code, f.imei, f.serial_number, f.installed_unit, f.device_type, f.mitra, 'famous', 'truk', 'gps', 'telematika', 'dsm', 'adas']
        });
      });

      // D. 8-Stage MOS Documents
      (documentsRes || []).forEach(d => {
        itemsIndex.push({
          id: d.id,
          type: 'DOCUMENT',
          category: `Tahap ${d.stage_number}: ${d.stage_code}`,
          title: d.title || d.doc_number,
          code: d.doc_number,
          subtitle: `Project: ${d.project_code || 'Site'} • PIC: ${d.creator_name || 'Admin'}`,
          description: d.summary || `Dokumen resmi tahap ${d.stage_name || d.stage_code}`,
          url: `/project-inventory?project=${d.project_id || 'proj-wim'}&tab=documents`,
          badge: d.stage_code,
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
          keywords: [d.doc_number, d.title, d.stage_code, d.stage_name, d.creator_name, 'dokumen', 'mos', 'bastm']
        });
      });

      // E. General Inventory Katalog Material
      const mergedInventory = [...(inventoryItems || []), ...DEFAULT_INVENTORY_ITEMS];
      const seenInv = new Set();
      mergedInventory.forEach(it => {
        const sku = it.sku || it.item_code || it.code;
        if (seenInv.has(sku)) return;
        seenInv.add(sku);
        itemsIndex.push({
          id: it.id || `mat-${sku}`,
          type: 'MATERIAL',
          category: 'Katalog Material',
          title: it.name,
          code: sku,
          subtitle: `Rak: ${it.rack || it.bin_location || 'R-A01'} • Stok: ${it.current_stock ?? it.currentStock ?? 0} ${it.unit || 'PCS'}`,
          description: `Kategori: ${it.category || 'Sparepart'} • Brand: ${it.brand || 'Digitech'}`,
          url: `/inventory`,
          badge: it.rack || 'Gudang',
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
          keywords: [it.name, sku, it.rack, it.category, it.brand, 'material', 'sparepart', 'filter', 'seal', 'brake']
        });
      });

      // F. System Quick Actions
      itemsIndex.push(
        {
          id: 'act-cyber-qr',
          type: 'ACTION',
          category: 'Aksi Cepat',
          title: 'Generator Cyber QR Code (3D Holographic)',
          code: 'ACTION:QR_GENERATOR',
          subtitle: 'Generate QR code dinamis animasi 3D, unduh vector SVG & print',
          url: '/inventory',
          badge: 'Cyber QR',
          badgeColor: 'bg-red-50 text-red-800 border-red-200',
          keywords: ['qr', 'qrcode', 'generator', 'holographic', 'cetak', 'print', 'barcode']
        },
        {
          id: 'act-mos-approval',
          type: 'ACTION',
          category: 'Aksi Cepat',
          title: 'Verifikasi & Tanda Tangan Dokumen MOS',
          code: 'ACTION:MOS',
          subtitle: 'Buka antrean berkas MOS yang menunggu pemeriksaan fisik',
          url: '/opname',
          badge: 'Quick Action',
          badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
          keywords: ['verifikasi', 'mos', 'approval', 'tandatangan', 'ttd']
        },
        {
          id: 'act-stock-in',
          type: 'ACTION',
          category: 'Aksi Cepat',
          title: 'Input Penerimaan Barang Masuk (Stock In)',
          code: 'ACTION:STOCK_IN',
          subtitle: 'Catat kedatangan material baru dan cetak label QR',
          url: '/inventory',
          badge: 'Gudang',
          badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          keywords: ['input', 'barang masuk', 'receiving', 'tambah', 'stok']
        },
        {
          id: 'act-authorities',
          type: 'ACTION',
          category: 'Otoritas Superadmin',
          title: 'Kelola Hak Otoritas Project',
          code: 'ACTION:AUTHORITY',
          subtitle: 'Atur izin akses workspace per masing-masing personel',
          url: '/users?tab=authorities',
          badge: 'Superadmin',
          badgeColor: 'bg-red-50 text-red-800 border-red-200',
          keywords: ['otoritas', 'hak akses', 'user', 'permission', 'kunci']
        }
      );

      this.index = itemsIndex;
      this.isLoaded = true;
      this.lastFetched = Date.now();
      return this.index;
    } catch (err) {
      console.warn('[InSiteSearchEngine] Index build error:', err);
      return this.index;
    }
  }

  /**
   * Search query against index with deterministic weighting & multi-token support
   */
  search(query, options = {}) {
    if (!query || !query.trim()) return [];
    const q = query.toLowerCase().trim();
    const tokens = q.split(/\s+/).filter(Boolean);
    const limit = options.limit || 16;

    const scored = [];

    for (const item of this.index) {
      let score = 0;
      const code = (item.code || '').toLowerCase();
      const title = (item.title || '').toLowerCase();
      const subtitle = (item.subtitle || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const category = (item.category || '').toLowerCase();
      const keywordsStr = (item.keywords || []).join(' ').toLowerCase();
      const fullText = `${code} ${title} ${subtitle} ${desc} ${category} ${keywordsStr}`;

      // 1. Exact match bonuses
      if (code === q) score += 120;
      else if (code.startsWith(q)) score += 85;
      else if (code.includes(q)) score += 70;

      if (title === q) score += 100;
      else if (title.startsWith(q)) score += 80;
      else if (title.includes(q)) score += 65;

      if (subtitle.includes(q)) score += 40;
      if (category.includes(q)) score += 35;

      // 2. Multi-token partial matching
      let matchedTokens = 0;
      for (const t of tokens) {
        if (fullText.includes(t)) {
          matchedTokens++;
          score += 30;
        }
      }

      if (tokens.length > 1 && matchedTokens === tokens.length) {
        score += 60; // All tokens present in document
      }

      if (score > 0) {
        scored.push({ item, score });
      }
    }

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(s => s.item);
  }
}

export const searchEngine = new InSiteSearchEngine();
