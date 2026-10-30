import { Router } from 'express';
import crypto from 'crypto';
import { supabase } from '../services/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { adminOnly, superadminOnly } from '../middleware/rbac.js';
import { sendSuccess, sendCreated } from '../middlewares/responseHandler.js';
import { AppError } from '../middlewares/errorHandler.js';
import { sendMosNotificationEmail } from '../services/mailer.js';
import { sendMosStepTelegramAlert } from '../services/telegram.js';
import { convertPdfToImages } from '../services/pdfService.js';

const router = Router();

// Official Document Templates
export const DOCUMENT_TEMPLATES = {
  MOS: {
    id: 'tpl-mos-001',
    type: 'MOS',
    code: '001_VGT_MOS',
    title: 'MATERIAL ON SITE',
    subtitle: 'BERITA ACARA VERIFIKASI & PENERIMAAN MATERIAL SITE',
    defaultOrientation: 'landscape',
    defaultSite: 'Office VGT',
    defaultReceiver: 'Rayhans Najib Al-Faruq',
    defaultDocNumber: '001/VGT/MOS/MNTOA/BIBOA/IV/2026',
    defaultDate: '2026-04-07',
    defaultCondition: 'Baik',
    columns: [
      'No', 'Nama Barang / Material', 'Spesifikasi / Part No.', 'Serial Number',
      'Qty Terima', 'Qty DO', 'Kondisi Barang', 'Garansi', 'Keterangan'
    ],
    defaultItems: [
      { id: 'm1', name: 'LOADCELL INTERCOMP', spec: 'INTERCOMP Loadcell double ended shear beam', sn: '91913187', qty_received: 1, qty_do: 1, condition: 'Baru', warranty: '550k weighing cycle', notes: '' },
      { id: 'm2', name: 'LOADCELL INTERCOMP', spec: 'INTERCOMP Loadcell double ended shear beam', sn: '92309683', qty_received: 1, qty_do: 1, condition: 'Baru', warranty: '550k weighing cycle', notes: '' },
      { id: 'm3', name: 'LOADCELL INTERCOMP', spec: 'INTERCOMP Loadcell double ended shear beam', sn: '92285794', qty_received: 1, qty_do: 1, condition: 'Baru', warranty: '550k weighing cycle', notes: '' },
      { id: 'm4', name: 'LOADCELL INTERCOMP', spec: 'INTERCOMP Loadcell double ended shear beam', sn: '91913138', qty_received: 1, qty_do: 1, condition: 'Baru', warranty: '550k weighing cycle', notes: '' },
      { id: 'm5', name: 'LOADCELL INTERCOMP', spec: 'INTERCOMP Loadcell double ended shear beam', sn: '92309753', qty_received: 1, qty_do: 1, condition: 'Baru', warranty: '550k weighing cycle', notes: '' },
      { id: 'm6', name: 'LOADCELL INTERCOMP', spec: 'INTERCOMP Loadcell double ended shear beam', sn: '91913125', qty_received: 1, qty_do: 1, condition: 'Baru', warranty: '550k weighing cycle', notes: '' },
      { id: 'm7', name: 'LOADCELL INTERCOMP', spec: 'INTERCOMP Loadcell double ended shear beam', sn: '92309685', qty_received: 1, qty_do: 1, condition: 'Baru', warranty: '550k weighing cycle', notes: '' },
      { id: 'm8', name: 'LOADCELL INTERCOMP', spec: 'INTERCOMP Loadcell double ended shear beam', sn: '92285792', qty_received: 1, qty_do: 1, condition: 'Baru', warranty: '550k weighing cycle', notes: '' },
      { id: 'm9', name: 'AX920 PLATFORM MOUNT', spec: 'UC50-30', sn: 'VGT-MNTG-01', qty_received: 1, qty_do: 1, condition: 'Baru', warranty: '1 Tahun', notes: '' },
      { id: 'm10', name: 'AX920 PLATFORM MOUNT', spec: 'UC50-30', sn: 'VGT-MNTG-02', qty_received: 1, qty_do: 1, condition: 'Baru', warranty: '1 Tahun', notes: '' },
      { id: 'm11', name: 'AX920 PLATFORM MOUNT', spec: 'UC50-30', sn: 'VGT-MNTG-03', qty_received: 1, qty_do: 1, condition: 'Baru', warranty: '1 Tahun', notes: '' },
      { id: 'm12', name: 'AX920 PLATFORM MOUNT', spec: 'UC50-30', sn: 'VGT-MNTG-04', qty_received: 1, qty_do: 1, condition: 'Baru', warranty: '1 Tahun', notes: '' }
    ]
  },
  MDT: {
    id: 'tpl-mdt-005',
    type: 'MDT',
    code: '005_VGT_MDT',
    title: 'MATERIAL DISMANTLING',
    subtitle: 'BERITA ACARA PEMBONGKARAN & PELEPASAN MATERIAL SITE',
    defaultOrientation: 'landscape',
    defaultSite: 'WIM KM 13',
    defaultReceiver: 'Zainal Fahriandy',
    defaultDocNumber: '005/VGT/MDT/MNTOA/BIBOA/V/2026',
    defaultDate: '2026-05-22',
    defaultCondition: 'Barang dummy',
    columns: [
      'No', 'Nama Barang / Material', 'Spesifikasi / Part No.', 'Serial Number',
      'Qty Dismantling', 'Qty Installation', 'Kondisi Barang', 'Garansi', 'Keterangan'
    ],
    defaultItems: [
      { id: 'd1', name: 'LOADCELL INTERCOMP', spec: 'INTERCOMP Loadcell double ended shear beam', sn: '91066926', qty_received: 1, qty_do: 0, condition: 'Dummy', warranty: '550k weighing cycle', notes: 'Diganti dengan Loadcell bosche' },
      { id: 'd2', name: 'LOADCELL INTERCOMP', spec: 'INTERCOMP Loadcell double ended shear beam', sn: '91066930', qty_received: 1, qty_do: 0, condition: 'Rusak', warranty: '550k weighing cycle', notes: 'Loadcell patah' },
      { id: 'd3', name: 'LOADCELL INTERCOMP', spec: 'INTERCOMP Loadcell double ended shear beam', sn: '91066923', qty_received: 1, qty_do: 0, condition: 'Dummy', warranty: '550k weighing cycle', notes: 'Diganti dengan Loadcell bosche' },
      { id: 'd4', name: 'LOADCELL INTERCOMP', spec: 'INTERCOMP Loadcell double ended shear beam', sn: '91508649', qty_received: 1, qty_do: 0, condition: 'Dummy', warranty: '550k weighing cycle', notes: 'Diganti dengan Loadcell bosche' }
    ]
  },
  MRP: {
    id: 'tpl-mrp-006',
    type: 'MRP',
    code: '006_VGT_MRP',
    title: 'MATERIAL REPLACEMENT',
    subtitle: 'BERITA ACARA PEMASANGAN & PENGGANTIAN MATERIAL UNIT',
    defaultOrientation: 'landscape',
    defaultSite: 'WIM KM 13',
    defaultReceiver: 'Zainal Fahriandy',
    defaultDocNumber: '006/VGT/MRP/MNTOA/BIBOA/V/2026',
    defaultDate: '2026-05-26',
    defaultCondition: 'Barang baru',
    columns: [
      'No', 'Nama Barang / Material', 'Spesifikasi / Part No.', 'Serial Number',
      'Qty Dismantling', 'Qty Installation', 'Kondisi Barang', 'Garansi', 'Keterangan'
    ],
    defaultItems: [
      { id: 'r1', name: 'LOADCELL INTERCOMP', spec: 'INTERCOMP Loadcell double ended shear beam', sn: '91913187', qty_received: 0, qty_do: 1, condition: 'Baru', warranty: '550k weighing cycle', notes: 'Barang kondisi baik' },
      { id: 'r2', name: 'LOADCELL INTERCOMP', spec: 'INTERCOMP Loadcell double ended shear beam', sn: '92309683', qty_received: 0, qty_do: 1, condition: 'Baru', warranty: '550k weighing cycle', notes: 'Barang kondisi baik' },
      { id: 'r3', name: 'LOADCELL INTERCOMP', spec: 'INTERCOMP Loadcell double ended shear beam', sn: '92285794', qty_received: 0, qty_do: 1, condition: 'Baru', warranty: '550k weighing cycle', notes: 'Barang kondisi baik' },
      { id: 'r4', name: 'LOADCELL INTERCOMP', spec: 'INTERCOMP Loadcell double ended shear beam', sn: '91913138', qty_received: 0, qty_do: 1, condition: 'Baru', warranty: '550k weighing cycle', notes: 'Barang kondisi baik' }
    ]
  }
};

// Fallback in-memory/static documents matching the 3 official documents
export let FALLBACK_MOS = [
  {
    id: 'doc-001-mos',
    doc_number: '001/VGT/MOS/MNTOA/BIBOA/IV/2026',
    template_type: 'MOS',
    title: 'MATERIAL ON SITE',
    subtitle: 'BERITA ACARA VERIFIKASI & PENERIMAAN MATERIAL SITE',
    site_location: 'Office VGT',
    site_id: 'site-vgt-office',
    pic_receiver_name: 'Rayhans Najib Al-Faruq',
    received_date: '2026-04-07',
    po_do_number: '-',
    package_condition: 'Baik',
    orientation: 'landscape',
    status: 'completed',
    created_at: '2026-04-07T08:30:00.000Z',
    items: DOCUMENT_TEMPLATES.MOS.defaultItems,
    signatures_placed: [
      {
        id: 'sig-001-1',
        page_index: 0,
        x_percent: 12.0,
        y_percent: 85.0,
        width_percent: 18.0,
        height_percent: 10.0,
        signer_name: 'Rayhans Najib A.',
        signer_role: 'Teknisi VGT',
        timestamp: '2026-04-07 10:15',
        hash: 'SHA256:001-MOS-MAKER-VALIDATED'
      },
      {
        id: 'sig-001-2',
        page_index: 0,
        x_percent: 45.0,
        y_percent: 85.0,
        width_percent: 18.0,
        height_percent: 10.0,
        signer_name: 'Zainal Fahriandy',
        signer_role: 'Supervisor VGT',
        timestamp: '2026-04-07 13:20',
        hash: 'SHA256:001-MOS-CHECKER-VALIDATED'
      },
      {
        id: 'sig-001-3',
        page_index: 0,
        x_percent: 78.0,
        y_percent: 85.0,
        width_percent: 18.0,
        height_percent: 10.0,
        signer_name: 'Harris',
        signer_role: 'Digitech Otoritas Final',
        timestamp: '2026-04-07 16:00',
        hash: 'SHA256:001-MOS-FINAL-VALIDATED'
      }
    ]
  },
  {
    id: 'doc-002-mos',
    doc_number: '002/VGT/MOS/MNTOA/BIBOA/V/2026',
    template_type: 'MOS',
    title: 'MATERIAL ON SITE',
    subtitle: 'BERITA ACARA VERIFIKASI & PENERIMAAN MATERIAL SITE',
    site_location: 'Workshop BIB KM 14',
    site_id: 'site-bib-km14',
    pic_receiver_name: 'Rayhans Najib Al-Faruq',
    received_date: '2026-05-10',
    po_do_number: 'PO-2026-MOS-088',
    package_condition: 'Baik',
    orientation: 'landscape',
    status: 'waiting_user',
    created_at: '2026-05-10T09:15:00.000Z',
    items: DOCUMENT_TEMPLATES.MOS.defaultItems.slice(0, 4),
    signatures_placed: []
  },
  {
    id: 'doc-005-mdt',
    doc_number: '005/VGT/MDT/MNTOA/BIBOA/V/2026',
    template_type: 'MDT',
    title: 'MATERIAL DISMANTLING',
    subtitle: 'BERITA ACARA PEMBONGKARAN & PELEPASAN MATERIAL SITE',
    site_location: 'WIM KM 13',
    site_id: 'site-wim-km13',
    pic_receiver_name: 'Zainal Fahriandy',
    received_date: '2026-05-22',
    po_do_number: '-',
    package_condition: 'Barang dummy',
    orientation: 'landscape',
    status: 'waiting_superadmin',
    created_at: '2026-05-22T09:00:00.000Z',
    items: DOCUMENT_TEMPLATES.MDT.defaultItems,
    signatures_placed: [
      {
        id: 'sig-005-1',
        page_index: 0,
        x_percent: 12.0,
        y_percent: 85.0,
        width_percent: 18.0,
        height_percent: 10.0,
        signer_name: 'Rayhans Najib A.',
        signer_role: 'Teknisi VGT',
        timestamp: '2026-05-22 11:00',
        hash: 'SHA256:005-MDT-MAKER-VALIDATED'
      },
      {
        id: 'sig-005-2',
        page_index: 0,
        x_percent: 45.0,
        y_percent: 85.0,
        width_percent: 18.0,
        height_percent: 10.0,
        signer_name: 'Zainal Fahriandy',
        signer_role: 'Supervisor VGT',
        timestamp: '2026-05-22 14:10',
        hash: 'SHA256:005-MDT-CHECKER-VALIDATED'
      }
    ]
  },
  {
    id: 'doc-006-mrp',
    doc_number: '006/VGT/MRP/MNTOA/BIBOA/V/2026',
    template_type: 'MRP',
    title: 'MATERIAL REPLACEMENT',
    subtitle: 'BERITA ACARA PEMASANGAN & PENGGANTIAN MATERIAL UNIT',
    site_location: 'WIM KM 13',
    site_id: 'site-wim-km13',
    pic_receiver_name: 'Zainal Fahriandy',
    received_date: '2026-05-26',
    po_do_number: '-',
    package_condition: 'Barang baru',
    orientation: 'landscape',
    status: 'waiting_admin',
    created_at: '2026-05-26T10:00:00.000Z',
    items: DOCUMENT_TEMPLATES.MRP.defaultItems,
    signatures_placed: [
      {
        id: 'sig-006-1',
        page_index: 0,
        x_percent: 12.0,
        y_percent: 85.0,
        width_percent: 18.0,
        height_percent: 10.0,
        signer_name: 'Rayhans Najib A.',
        signer_role: 'Teknisi VGT',
        timestamp: '2026-05-26 11:30',
        hash: 'SHA256:006-MRP-MAKER-VALIDATED'
      }
    ]
  }
];

// Helper to generate a unique official document number
export const generateUniqueDocNumber = (type = 'MOS') => {
  const monthRoman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][new Date().getMonth()];
  const year = new Date().getFullYear();
  const typeCode = type === 'MDT' ? 'MDT' : type === 'MRP' ? 'MRP' : type === 'MR' ? 'MR' : type === 'CUSTOM' ? 'DOC' : 'MOS';

  // Find highest sequence from existing documents
  let maxSeq = 6;
  for (const doc of FALLBACK_MOS) {
    const num = doc.doc_number || doc.mos_number || '';
    const match = num.match(/^(\d+)\/VGT\//);
    if (match) {
      const val = parseInt(match[1], 10);
      if (val > maxSeq) maxSeq = val;
    }
  }

  const nextSeq = Math.max(maxSeq + 1, FALLBACK_MOS.length + 1);
  return `${String(nextSeq).padStart(3, '0')}/VGT/${typeCode}/MNTOA/BIBOA/${monthRoman}/${year}`;
};

// Helper to normalize MOS/Approval document
const normalizeMosDoc = (d) => {
  const sigs = (typeof d.signatures === 'object' && d.signatures !== null) ? d.signatures : {};
  const placed = sigs.signatures_placed || sigs.placed || d.signatures_placed || [];

  const originLoc = d.origin_location || sigs.origin_location || 'Office VGT';
  const destLoc = d.destination_location || sigs.destination_location || d.site_location || d.site_name || 'BIB Pit Sebamban KM-14';
  const senderNm = d.sender_name || sigs.sender_name || d.requester_name || 'Rayhans Najib Al-Faruq';
  const senderRl = d.sender_role || sigs.sender_role || d.department || 'Teknisi VGT';
  const destRecv = d.destination_receiver || sigs.destination_receiver || d.pic_receiver_name || 'Team Mekanik Pit';

  return {
    id: d.id,
    doc_number: d.doc_number || d.mos_number || d.id,
    mos_number: d.mos_number || d.doc_number,
    template_type: d.template_type || sigs.template_type || (d.doc_number?.includes('MDT') ? 'MDT' : d.doc_number?.includes('MRP') ? 'MRP' : 'MOS'),
    title: d.title || `Dokumen Approval ${d.doc_number || d.id}`,
    subtitle: d.subtitle || sigs.subtitle || '',
    vendor_name: d.vendor_name || 'PT Trakindo Utama',
    
    // Rute Pengiriman (Dari Siapa -> Akan Kemana)
    site_location: destLoc,
    origin_location: originLoc,
    destination_location: destLoc,
    sender_name: senderNm,
    sender_role: senderRl,
    destination_receiver: destRecv,
    pic_receiver_name: d.pic_receiver_name || destRecv,

    // Alur Approval: Approval untuk Siapa (Maker, Checker, Approver)
    approval_maker_name: d.approval_maker_name || sigs.approval_maker_name || senderNm,
    approval_maker_role: d.approval_maker_role || sigs.approval_maker_role || senderRl,
    approval_maker_dept: d.approval_maker_dept || sigs.approval_maker_dept || 'Teknisi Operasional',
    approval_checker_name: d.approval_checker_name || sigs.approval_checker_name || 'Zainal Fahriandy',
    approval_checker_role: d.approval_checker_role || sigs.approval_checker_role || 'Supervisor VGT',
    approval_checker_dept: d.approval_checker_dept || sigs.approval_checker_dept || 'Gudang & Logistik',
    approval_approver_name: d.approval_approver_name || sigs.approval_approver_name || 'Harris',
    approval_approver_role: d.approval_approver_role || sigs.approval_approver_role || 'Digitech',
    approval_approver_dept: d.approval_approver_dept || sigs.approval_approver_dept || 'Head of Operation',

    site_id: d.site_id,
    received_date: d.received_date || d.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    required_date: d.required_date || sigs.required_date || '-',
    po_do_number: d.po_do_number || '-',
    do_sj_number: d.do_sj_number || sigs.do_sj_number || '-',
    wo_spk_number: d.wo_spk_number || sigs.wo_spk_number || '-',
    department: d.department || sigs.department || senderRl,
    urgency: d.urgency || sigs.urgency || 'Normal',
    unit_targeted: d.unit_targeted || sigs.unit_targeted || '-',
    transport_mode: d.transport_mode || sigs.transport_mode || '-',
    driver_name: d.driver_name || sigs.driver_name || '-',
    sender_phone: d.sender_phone || sigs.sender_phone || '-',
    receiver_phone: d.receiver_phone || sigs.receiver_phone || '-',
    package_condition: d.package_condition || 'Baik',
    photo_attachment_url: d.photo_attachment_url || d.photo_url || null,
    orientation: d.orientation || sigs.orientation || 'landscape',
    pages: Array.isArray(d.pages) && d.pages.length > 0 ? d.pages : (Array.isArray(sigs.pages) ? sigs.pages : []),
    status: d.status || 'draft',
    purpose: d.purpose || 'Dokumen persetujuan dan otorisasi operasional.',
    notes_justification: d.notes_justification || sigs.notes_justification || '',
    rejection_notes: d.rejection_notes || null,
    items: Array.isArray(d.items) ? d.items.map((it, idx) => ({
      id: it.id || `item-${idx + 1}`,
      name: it.name || it.item_name || 'Material Item',
      item_name: it.item_name || it.name || 'Material Item',
      spec: it.spec || it.part_number || '-',
      part_number: it.part_number || it.spec || '-',
      sn: it.sn || it.serial_number || '-',
      serial_number: it.serial_number || it.sn || '-',
      category: it.category || 'Sparepart',
      unit: it.unit || it.satuan || 'PCS',
      qty_received: Number(it.qty_received ?? it.qty ?? 1),
      qty_do: Number(it.qty_do ?? 0),
      condition: it.condition || it.item_condition || 'Baru',
      warranty: it.warranty || '-',
      bin_location: it.bin_location || it.rack_location || '-',
      notes: it.notes || ''
    })) : [],
    signatures_placed: Array.isArray(placed) ? placed : [],
    signatures: sigs,
    created_by_id: d.created_by,
    created_at: d.created_at
  };
};

// GET /api/mos/next-number — Generate unique, different document number
router.get('/next-number', (req, res) => {
  const { type = 'MOS' } = req.query;
  const num = generateUniqueDocNumber(type);
  return sendSuccess(res, { doc_number: num }, 'Nomor dokumen otomatis berhasil di-generate.');
});

// GET /api/mos/templates — Get available official templates
router.get('/templates', (req, res) => {
  return sendSuccess(res, DOCUMENT_TEMPLATES, 'Daftar template dokumen resmi berhasil dimuat.');
});

// POST /api/mos/convert-pdf — Convert PDF to high-res page images with orientation detection
router.post('/convert-pdf', requireAuth, async (req, res, next) => {
  try {
    const { pdf, max_pages = 10 } = req.body;
    if (!pdf) {
      throw new AppError('File PDF (base64 atau path) wajib disediakan.', 400, 'VALIDATION_FAILED');
    }

    const conversionResult = await convertPdfToImages(pdf, max_pages);
    return sendSuccess(res, conversionResult, 'Konversi PDF berhasil.');
  } catch (err) {
    next(err);
  }
});

// GET /api/mos — Role-filtered list (Waiting List & Archive)
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { status, template_type } = req.query;
    let query = supabase.from('mos_documents').select('*').order('created_at', { ascending: false });

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }
    if (template_type) {
      query = query.eq('template_type', template_type);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('[MOS] Supabase query error:', error.message);
    }

    let list = (data && data.length > 0) ? data.map(normalizeMosDoc) : FALLBACK_MOS;

    // Filter in-memory if query params passed and using fallback
    if (!data || data.length === 0) {
      if (status && status !== 'ALL') {
        list = list.filter(d => d.status === status);
      }
      if (template_type) {
        list = list.filter(d => d.template_type === template_type);
      }
    }

    return sendSuccess(res, list, 'Daftar waiting list & arsip dokumen berhasil dimuat.');
  } catch (err) {
    return sendSuccess(res, FALLBACK_MOS, 'Daftar dokumen fallback.');
  }
});

// GET /api/mos/stats — Statistics
router.get('/stats', requireAuth, async (req, res, next) => {
  try {
    const { data } = await supabase.from('mos_documents').select('status');
    const docs = (data && data.length > 0) ? data : FALLBACK_MOS;

    const stats = {
      total: docs.length,
      draft: docs.filter(d => d.status === 'draft').length,
      waiting_sign: docs.filter(d => d.status === 'waiting_sign').length,
      waiting_admin: docs.filter(d => d.status === 'waiting_admin').length,
      waiting_superadmin: docs.filter(d => d.status === 'waiting_superadmin').length,
      completed: docs.filter(d => d.status === 'completed').length,
      rejected: docs.filter(d => d.status === 'rejected').length
    };

    return sendSuccess(res, stats, 'Statistik dokumen.');
  } catch (err) {
    next(err);
  }
});

// GET /api/mos/:id — Document details
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('mos_documents')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    let doc = data ? normalizeMosDoc(data) : FALLBACK_MOS.find(d => d.id === req.params.id);

    if (!doc) {
      throw new AppError('Dokumen tidak ditemukan.', 404, 'RESOURCE_NOT_FOUND');
    }

    return sendSuccess(res, doc, 'Detail dokumen.');
  } catch (err) {
    next(err);
  }
});

// POST /api/mos — Create document (built-in template or custom uploaded document)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const {
      template_type = 'MOS',
      doc_number,
      title,
      subtitle,
      purpose,
      site_location,
      site_id,
      origin_location = 'Office VGT',
      destination_location = 'BIB Pit Sebamban KM-14',
      sender_name,
      sender_role = 'Teknisi VGT',
      sender_phone = '-',
      destination_receiver,
      pic_receiver_name,
      receiver_phone = '-',
      approval_maker_name,
      approval_maker_role = 'Teknisi VGT',
      approval_maker_dept = 'Teknisi Operasional',
      approval_checker_name = 'Zainal Fahriandy',
      approval_checker_role = 'Supervisor VGT',
      approval_checker_dept = 'Gudang & Logistik',
      approval_approver_name = 'Harris',
      approval_approver_role = 'Digitech',
      approval_approver_dept = 'Head of Operation',
      received_date,
      required_date = '-',
      po_do_number,
      do_sj_number = '-',
      wo_spk_number = '-',
      department,
      urgency = 'Normal',
      unit_targeted = '-',
      transport_mode = '-',
      driver_name = '-',
      package_condition,
      notes_justification = '',
      photo_attachment_url,
      orientation = 'landscape',
      pages = [],
      items = [],
      signatures_placed = []
    } = req.body;

    const autoNumber = generateUniqueDocNumber(template_type);
    const docNum = doc_number || autoNumber;
    const docId = `doc-${Date.now()}`;

    const effectiveSender = sender_name || req.user.full_name || 'Rayhans Najib Al-Faruq';
    const effectiveReceiver = destination_receiver || pic_receiver_name || 'Team Mekanik Pit';
    const effectiveMakerName = approval_maker_name || effectiveSender;

    const newDoc = {
      id: docId,
      doc_number: docNum,
      mos_number: docNum,
      template_type,
      title: title || (DOCUMENT_TEMPLATES[template_type]?.title || 'DOKUMEN APPROVAL'),
      subtitle: subtitle || (DOCUMENT_TEMPLATES[template_type]?.subtitle || ''),
      purpose: purpose || 'Verifikasi dan otorisasi dokumen kerja site.',
      
      // Rute Alur Pengiriman
      site_location: destination_location || site_location || 'BIB Pit Sebamban KM-14',
      origin_location: origin_location || 'Office VGT',
      destination_location: destination_location || site_location || 'BIB Pit Sebamban KM-14',
      sender_name: effectiveSender,
      sender_role: sender_role || req.user.department || 'Teknisi VGT',
      sender_phone: sender_phone || '-',
      destination_receiver: effectiveReceiver,
      pic_receiver_name: effectiveReceiver,
      receiver_phone: receiver_phone || '-',

      // Alur Otorisasi / Approval
      approval_maker_name: effectiveMakerName,
      approval_maker_role: approval_maker_role || 'Teknisi VGT',
      approval_maker_dept: approval_maker_dept || 'Teknisi Operasional',
      approval_checker_name: approval_checker_name || 'Zainal Fahriandy',
      approval_checker_role: approval_checker_role || 'Supervisor VGT',
      approval_checker_dept: approval_checker_dept || 'Gudang & Logistik',
      approval_approver_name: approval_approver_name || 'Harris',
      approval_approver_role: approval_approver_role || 'Digitech',
      approval_approver_dept: approval_approver_dept || 'Head of Operation',

      site_id: site_id || 'site-vgt-office',
      requester_name: effectiveSender,
      requester_email: req.user.email,
      department: department || req.user.department || sender_role || 'Operasional Site',
      received_date: received_date || new Date().toISOString().split('T')[0],
      required_date: required_date || '-',
      po_do_number: po_do_number || '-',
      do_sj_number: do_sj_number || '-',
      wo_spk_number: wo_spk_number || '-',
      urgency: urgency || 'Normal',
      unit_targeted: unit_targeted || '-',
      transport_mode: transport_mode || '-',
      driver_name: driver_name || '-',
      package_condition: package_condition || 'Baik',
      notes_justification: notes_justification || '',
      photo_attachment_url: photo_attachment_url || null,
      orientation,
      pages,
      items: items.map((it, idx) => ({
        id: it.id || `item-${idx + 1}`,
        name: it.name || it.item_name || 'Material Item',
        item_name: it.item_name || it.name || 'Material Item',
        spec: it.spec || it.part_number || '-',
        part_number: it.part_number || it.spec || '-',
        sn: it.sn || it.serial_number || '-',
        serial_number: it.serial_number || it.sn || '-',
        category: it.category || 'Sparepart',
        unit: it.unit || it.satuan || 'PCS',
        qty_received: Number(it.qty_received ?? it.qty ?? 1),
        qty_do: Number(it.qty_do ?? 0),
        condition: it.condition || it.item_condition || 'Baru',
        warranty: it.warranty || '-',
        bin_location: it.bin_location || it.rack_location || '-',
        notes: it.notes || ''
      })),
      signatures_placed: signatures_placed || [],
      status: signatures_placed.length >= 3 ? 'completed' : signatures_placed.length >= 2 ? 'waiting_superadmin' : signatures_placed.length >= 1 ? 'waiting_admin' : 'waiting_sign',
      created_by: req.user.id,
      created_at: new Date().toISOString()
    };

    // Save to in-memory fallback
    FALLBACK_MOS.unshift(newDoc);

    // Save to Supabase if available
    try {
      const dbPayload = {
        id: newDoc.id,
        doc_number: newDoc.doc_number,
        mos_number: newDoc.mos_number,
        title: newDoc.title,
        purpose: newDoc.purpose,
        site_location: newDoc.site_location,
        site_id: newDoc.site_id,
        pic_receiver_name: newDoc.pic_receiver_name,
        requester_name: newDoc.requester_name,
        requester_email: newDoc.requester_email,
        department: newDoc.department,
        received_date: newDoc.received_date,
        po_do_number: newDoc.po_do_number,
        package_condition: newDoc.package_condition,
        photo_attachment_url: newDoc.photo_attachment_url,
        status: newDoc.status,
        items: newDoc.items,
        signatures: {
          template_type: newDoc.template_type,
          subtitle: newDoc.subtitle,
          orientation: newDoc.orientation,
          origin_location: newDoc.origin_location,
          destination_location: newDoc.destination_location,
          sender_name: newDoc.sender_name,
          sender_role: newDoc.sender_role,
          sender_phone: newDoc.sender_phone,
          destination_receiver: newDoc.destination_receiver,
          receiver_phone: newDoc.receiver_phone,
          approval_maker_name: newDoc.approval_maker_name,
          approval_maker_role: newDoc.approval_maker_role,
          approval_maker_dept: newDoc.approval_maker_dept,
          approval_checker_name: newDoc.approval_checker_name,
          approval_checker_role: newDoc.approval_checker_role,
          approval_checker_dept: newDoc.approval_checker_dept,
          approval_approver_name: newDoc.approval_approver_name,
          approval_approver_role: newDoc.approval_approver_role,
          approval_approver_dept: newDoc.approval_approver_dept,
          required_date: newDoc.required_date,
          do_sj_number: newDoc.do_sj_number,
          wo_spk_number: newDoc.wo_spk_number,
          urgency: newDoc.urgency,
          unit_targeted: newDoc.unit_targeted,
          transport_mode: newDoc.transport_mode,
          driver_name: newDoc.driver_name,
          notes_justification: newDoc.notes_justification,
          pages: newDoc.pages,
          signatures_placed: newDoc.signatures_placed
        },
        created_by: newDoc.created_by,
        created_at: newDoc.created_at
      };
      const { error: insErr } = await supabase.from('mos_documents').insert(dbPayload);
      if (insErr) {
        console.warn('[MOS] Supabase insert error:', insErr.message);
      }
    } catch (e) {
      console.warn('[MOS] Supabase insert warning:', e.message);
    }

    sendMosStepTelegramAlert(docNum, `Dokumen baru masuk Waiting List (${template_type})`, req.user.full_name, 'Approver').catch(() => {});

    return sendCreated(res, newDoc, 'Dokumen berhasil dibuat dan masuk ke Waiting List.');
  } catch (err) {
    next(err);
  }
});

// PUT /api/mos/:id — Update existing document details (doc_number, routes, approvers, items, etc.)
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const {
      doc_number,
      title,
      subtitle,
      purpose,
      site_location,
      origin_location,
      destination_location,
      sender_name,
      sender_role,
      sender_phone,
      destination_receiver,
      pic_receiver_name,
      receiver_phone,
      approval_maker_name,
      approval_maker_role,
      approval_maker_dept,
      approval_checker_name,
      approval_checker_role,
      approval_checker_dept,
      approval_approver_name,
      approval_approver_role,
      approval_approver_dept,
      received_date,
      required_date,
      po_do_number,
      do_sj_number,
      wo_spk_number,
      department,
      urgency,
      unit_targeted,
      transport_mode,
      driver_name,
      package_condition,
      notes_justification,
      items
    } = req.body;

    let doc = FALLBACK_MOS.find(d => d.id === req.params.id);
    if (!doc) {
      const { data } = await supabase.from('mos_documents').select('*').eq('id', req.params.id).maybeSingle();
      if (data) {
        doc = normalizeMosDoc(data);
      }
    }

    if (!doc) {
      throw new AppError('Dokumen tidak ditemukan.', 404, 'RESOURCE_NOT_FOUND');
    }

    // Update fields
    if (doc_number) {
      doc.doc_number = doc_number;
      doc.mos_number = doc_number;
    }
    if (title) doc.title = title;
    if (subtitle) doc.subtitle = subtitle;
    if (purpose) doc.purpose = purpose;
    if (origin_location) doc.origin_location = origin_location;
    if (destination_location) {
      doc.destination_location = destination_location;
      doc.site_location = destination_location;
    } else if (site_location) {
      doc.site_location = site_location;
      doc.destination_location = site_location;
    }
    if (sender_name) doc.sender_name = sender_name;
    if (sender_role) doc.sender_role = sender_role;
    if (sender_phone !== undefined) doc.sender_phone = sender_phone;
    if (destination_receiver) {
      doc.destination_receiver = destination_receiver;
      doc.pic_receiver_name = destination_receiver;
    }
    if (pic_receiver_name) doc.pic_receiver_name = pic_receiver_name;
    if (receiver_phone !== undefined) doc.receiver_phone = receiver_phone;
    if (approval_maker_name) doc.approval_maker_name = approval_maker_name;
    if (approval_maker_role) doc.approval_maker_role = approval_maker_role;
    if (approval_maker_dept) doc.approval_maker_dept = approval_maker_dept;
    if (approval_checker_name) doc.approval_checker_name = approval_checker_name;
    if (approval_checker_role) doc.approval_checker_role = approval_checker_role;
    if (approval_checker_dept) doc.approval_checker_dept = approval_checker_dept;
    if (approval_approver_name) doc.approval_approver_name = approval_approver_name;
    if (approval_approver_role) doc.approval_approver_role = approval_approver_role;
    if (approval_approver_dept) doc.approval_approver_dept = approval_approver_dept;
    if (received_date) doc.received_date = received_date;
    if (required_date !== undefined) doc.required_date = required_date;
    if (po_do_number) doc.po_do_number = po_do_number;
    if (do_sj_number !== undefined) doc.do_sj_number = do_sj_number;
    if (wo_spk_number !== undefined) doc.wo_spk_number = wo_spk_number;
    if (department !== undefined) doc.department = department;
    if (urgency !== undefined) doc.urgency = urgency;
    if (unit_targeted !== undefined) doc.unit_targeted = unit_targeted;
    if (transport_mode !== undefined) doc.transport_mode = transport_mode;
    if (driver_name !== undefined) doc.driver_name = driver_name;
    if (package_condition) doc.package_condition = package_condition;
    if (notes_justification !== undefined) doc.notes_justification = notes_justification;
    if (Array.isArray(items)) {
      doc.items = items.map((it, idx) => ({
        id: it.id || `item-${idx + 1}`,
        name: it.name || it.item_name || 'Material Item',
        item_name: it.item_name || it.name || 'Material Item',
        spec: it.spec || it.part_number || '-',
        part_number: it.part_number || it.spec || '-',
        sn: it.sn || it.serial_number || '-',
        serial_number: it.serial_number || it.sn || '-',
        category: it.category || 'Sparepart',
        unit: it.unit || it.satuan || 'PCS',
        qty_received: Number(it.qty_received ?? it.qty ?? 1),
        qty_do: Number(it.qty_do ?? 0),
        condition: it.condition || it.item_condition || 'Baru',
        warranty: it.warranty || '-',
        bin_location: it.bin_location || it.rack_location || '-',
        notes: it.notes || ''
      }));
    }

    // Update in Supabase
    try {
      const existingSigs = typeof doc.signatures === 'object' && doc.signatures !== null ? doc.signatures : {};
      const updatedSigs = {
        ...existingSigs,
        origin_location: doc.origin_location,
        destination_location: doc.destination_location,
        sender_name: doc.sender_name,
        sender_role: doc.sender_role,
        sender_phone: doc.sender_phone,
        destination_receiver: doc.destination_receiver,
        receiver_phone: doc.receiver_phone,
        approval_maker_name: doc.approval_maker_name,
        approval_maker_role: doc.approval_maker_role,
        approval_maker_dept: doc.approval_maker_dept,
        approval_checker_name: doc.approval_checker_name,
        approval_checker_role: doc.approval_checker_role,
        approval_checker_dept: doc.approval_checker_dept,
        approval_approver_name: doc.approval_approver_name,
        approval_approver_role: doc.approval_approver_role,
        approval_approver_dept: doc.approval_approver_dept,
        required_date: doc.required_date,
        do_sj_number: doc.do_sj_number,
        wo_spk_number: doc.wo_spk_number,
        urgency: doc.urgency,
        unit_targeted: doc.unit_targeted,
        transport_mode: doc.transport_mode,
        driver_name: doc.driver_name,
        notes_justification: doc.notes_justification
      };

      await supabase
        .from('mos_documents')
        .update({
          doc_number: doc.doc_number,
          mos_number: doc.doc_number,
          title: doc.title,
          purpose: doc.purpose,
          site_location: doc.site_location || doc.destination_location,
          pic_receiver_name: doc.pic_receiver_name,
          received_date: doc.received_date,
          po_do_number: doc.po_do_number,
          package_condition: doc.package_condition,
          items: doc.items,
          signatures: updatedSigs,
          updated_at: new Date().toISOString()
        })
        .eq('id', req.params.id);
    } catch (e) {
      console.warn('[MOS] Supabase update warning:', e.message);
    }

    return sendSuccess(res, doc, 'Data dan rute dokumen berhasil diperbarui.');
  } catch (err) {
    next(err);
  }
});

// POST /api/mos/:id/stamp — Stamp user's transparent signature onto document at drag-and-drop location
router.post('/:id/stamp', requireAuth, async (req, res, next) => {
  try {
    const {
      page_index = 0,
      x_percent,
      y_percent,
      width_percent = 18.0,
      height_percent = 10.0,
      signature_image,
      signer_name,
      signer_role
    } = req.body;

    if (x_percent == null || y_percent == null) {
      throw new AppError('Koordinat posisi tanda tangan (x, y) wajib disertakan.', 400, 'VALIDATION_FAILED');
    }

    // Find document
    let doc = FALLBACK_MOS.find(d => d.id === req.params.id);
    let supabaseRecord = null;
    try {
      const { data } = await supabase.from('mos_documents').select('*').eq('id', req.params.id).maybeSingle();
      if (data) {
        supabaseRecord = data;
        doc = normalizeMosDoc(data);
      }
    } catch {}

    if (!doc) {
      throw new AppError('Dokumen tidak ditemukan.', 404, 'RESOURCE_NOT_FOUND');
    }

    // 1. Validasi apakah user ini sudah pernah menandatangani dokumen ini
    const existingStamps = doc.signatures_placed || [];
    const alreadySignedByUser = existingStamps.some(
      s => (s.signer_id && s.signer_id === req.user.id) ||
           (s.signer_name && req.user.full_name && s.signer_name.toLowerCase() === req.user.full_name.toLowerCase())
    );
    if (alreadySignedByUser) {
      throw new AppError('Anda sudah menandatangani dokumen ini sebelumnya.', 400, 'ALREADY_SIGNED');
    }

    // 2. Validasi tata letak tanda tangan berdasarkan role pengguna (untuk template standar)
    const isCustomDoc = doc.is_custom || doc.template_type === 'custom' || doc.template_type === 'CUSTOM';
    const x = Number(x_percent);
    const targetSlot = x <= 36 ? 'maker' : (x <= 66 ? 'checker' : 'approver');
    const userRole = (req.user?.role || '').toLowerCase();

    if (!isCustomDoc) {
      if (userRole === 'user' && targetSlot !== 'maker') {
        throw new AppError('Validasi Gagal: Sebagai User / Pembuat, Anda hanya diizinkan menandatangani di kolom "Dibuat Oleh" (kiri).', 403, 'INVALID_SLOT');
      }
      if (userRole === 'admin' && targetSlot !== 'checker') {
        throw new AppError('Validasi Gagal: Sebagai Admin / Supervisor, Anda hanya diizinkan menandatangani di kolom "Diperiksa Oleh" (tengah).', 403, 'INVALID_SLOT');
      }
      if (userRole === 'superadmin' && targetSlot !== 'approver') {
        throw new AppError('Validasi Gagal: Sebagai Superadmin, Anda hanya diizinkan menandatangani di kolom "Diketahui Oleh" (kanan).', 403, 'INVALID_SLOT');
      }

      // 3. Validasi apakah kolom tersebut sudah terisi tanda tangan oleh pihak lain
      const slotOccupied = existingStamps.some(s => {
        if (Number(s.page_index ?? 0) !== Number(page_index)) return false;
        const sx = Number(s.x_percent);
        const sSlot = sx <= 36 ? 'maker' : (sx <= 66 ? 'checker' : 'approver');
        return sSlot === targetSlot;
      });
      if (slotOccupied) {
        const slotName = targetSlot === 'maker' ? 'Dibuat Oleh' : (targetSlot === 'checker' ? 'Diperiksa Oleh' : 'Diketahui Oleh');
        throw new AppError(`Kolom otorisasi "${slotName}" sudah ditandatangani pada dokumen ini.`, 400, 'SLOT_ALREADY_SIGNED');
      }
    }

    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const hash = `SHA256:${crypto.createHash('sha256').update(`${req.user.id}:${doc.id}:${Date.now()}`).digest('hex').toUpperCase().slice(0, 24)}`;

    const newStamp = {
      id: `sig-stamp-${Date.now()}`,
      signer_id: req.user.id,
      page_index: Number(page_index),
      x_percent: Number(x_percent),
      y_percent: Number(y_percent),
      width_percent: Number(width_percent),
      height_percent: Number(height_percent),
      signature_image: signature_image || null,
      signer_name: signer_name || req.user.full_name || 'Approver',
      signer_role: signer_role || req.user.role || 'Staff Lapangan',
      timestamp,
      hash
    };

    const updatedStamps = [...existingStamps, newStamp];

    // Determine state transition based on stamp count or user role
    let nextStatus = doc.status;
    if (updatedStamps.length >= 3 || targetSlot === 'approver') {
      nextStatus = 'completed';
    } else if (targetSlot === 'checker') {
      nextStatus = 'waiting_superadmin';
    } else {
      nextStatus = 'waiting_admin';
    }

    doc.signatures_placed = updatedStamps;
    doc.status = nextStatus;
    doc.updated_at = new Date().toISOString();

    // Auto-commit inventory ledger if completed
    if (nextStatus === 'completed' && doc.items?.length > 0) {
      for (const item of doc.items) {
        const qtyReceived = Number(item.qty_received || item.qty || 1);
        try {
          await supabase.from('inventory_ledger').insert({
            item_name: item.name || item.item_name,
            part_number: item.spec || item.part_number,
            bin_location: 'R-A01',
            qty_change: qtyReceived,
            transaction_type: 'MOS_IN',
            reference_doc_id: doc.doc_number,
            notes: `Auto-commit approval ttd (${doc.doc_number})`,
            performed_by: req.user.full_name,
            created_at: new Date().toISOString()
          });
        } catch {}
      }
    }

    try {
      const existingSigs = (typeof doc.signatures === 'object' && doc.signatures !== null) ? doc.signatures : {};
      const updatedSigs = {
        ...existingSigs,
        signatures_placed: updatedStamps,
        placed: updatedStamps
      };
      const updatePayload = {
        signatures: updatedSigs,
        status: nextStatus,
        updated_at: new Date().toISOString()
      };
      if (updatedStamps.length >= 1) {
        updatePayload.slot1_signature = updatedStamps[0].signature_image;
        updatePayload.slot1_signer = updatedStamps[0].signer_name;
        updatePayload.slot1_signed_at = new Date().toISOString();
      }
      if (updatedStamps.length >= 2) {
        updatePayload.slot2_signature = updatedStamps[1].signature_image;
        updatePayload.slot2_signer = updatedStamps[1].signer_name;
        updatePayload.slot2_signed_at = new Date().toISOString();
      }
      if (updatedStamps.length >= 3) {
        updatePayload.slot3_signature = updatedStamps[2].signature_image;
        updatePayload.slot3_signer = updatedStamps[2].signer_name;
        updatePayload.slot3_signed_at = new Date().toISOString();
      }

      await supabase
        .from('mos_documents')
        .update(updatePayload)
        .eq('id', req.params.id);
    } catch {}

    sendMosStepTelegramAlert(
      doc.doc_number,
      `Tanda Tangan Ditempel (${newStamp.signer_name})`,
      newStamp.signer_name,
      nextStatus === 'completed' ? 'Selesai Otorisasi' : 'Approver Berikutnya'
    ).catch(() => {});

    return sendSuccess(res, doc, `Tanda tangan berhasil ditempel pada posisi dokumen. Status dokumen kini: ${nextStatus}.`);
  } catch (err) {
    next(err);
  }
});

// PUT /api/mos/:id/reject — Reject document with revision notes
router.put('/:id/reject', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { rejection_notes } = req.body;
    if (!rejection_notes) {
      throw new AppError('Alasan penolakan / catatan revisi wajib diisi.', 400, 'VALIDATION_FAILED');
    }

    let doc = FALLBACK_MOS.find(d => d.id === req.params.id);
    if (doc) {
      doc.status = 'rejected';
      doc.rejection_notes = rejection_notes;
    }

    try {
      await supabase
        .from('mos_documents')
        .update({
          status: 'rejected',
          rejection_notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', req.params.id);
    } catch {}

    return sendSuccess(res, { id: req.params.id, status: 'rejected', rejection_notes }, 'Dokumen ditolak dan dikembalikan untuk revisi.');
  } catch (err) {
    next(err);
  }
});

export default router;
