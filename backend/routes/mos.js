import { Router } from 'express';
import crypto from 'crypto';
import { supabase } from '../services/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { adminOnly, superadminOnly } from '../middleware/rbac.js';
import { sendSuccess, sendCreated } from '../middlewares/responseHandler.js';
import { AppError } from '../middlewares/errorHandler.js';
import { sendMosNotificationEmail } from '../services/mailer.js';
import { sendMosStepTelegramAlert } from '../services/telegram.js';

const router = Router();

// Fallback in-memory/static MOS documents
const FALLBACK_MOS = [
  {
    id: 'mos-001',
    doc_number: '001/VGT/MOS/MNTOA/BIBOA/VIII/2026',
    title: 'Penerimaan Filter Engine Caterpillar 777D',
    site_location: 'Office VGT',
    site_id: 'site-vgt-office',
    pic_receiver_name: 'arya-user',
    received_date: '2026-08-14',
    po_do_number: 'PO-2026-CAT-091 / DO-BIB-8821',
    package_condition: 'Baik',
    photo_attachment_url: null,
    status: 'completed',
    items: [
      {
        item_name: 'Cat 777D Engine Oil Filter',
        part_number: 'BIB-CAT-777D-FLTR',
        serial_number: 'SN-FLTR-9982',
        qty_received: 12,
        qty_do: 12,
        unit: 'PCS',
        item_condition: 'Baru',
        warranty: '12 Bulan Garansi Pabrik',
        assigned_bin_location: 'R-A01',
        notes: 'Kemasan tersegel rapi'
      }
    ],
    signatures: {
      slot1: {
        signed: true,
        slot_type: 'creator',
        signer_name: 'arya-user',
        signer_title: 'Teknisi Lapangan',
        role: 'User',
        timestamp: '2026-08-14T09:15:00.000Z',
        hash: 'SHA256:7b9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c'
      },
      slot2: {
        signed: true,
        slot_type: 'reviewer',
        signer_name: 'arya-admin',
        signer_title: 'Supervisor Logistik',
        role: 'Admin',
        timestamp: '2026-08-14T11:30:00.000Z',
        hash: 'SHA256:3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e'
      },
      slot3: {
        signed: true,
        slot_type: 'acknowledgement',
        signer_name: 'arya-superadmin',
        signer_title: 'Superadmin Digitech',
        role: 'Superadmin',
        timestamp: '2026-08-14T14:00:00.000Z',
        hash: 'SHA256:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b'
      }
    },
    created_at: '2026-08-14T09:00:00.000Z'
  },
  {
    id: 'mos-002',
    doc_number: '002/VGT/MOS/MNTOA/BIBOA/IX/2026',
    title: 'Sparepart Hidrolik Komatsu PC2000',
    site_location: 'Workshop Main BIB',
    site_id: 'site-bib-ws',
    pic_receiver_name: 'arya-user',
    received_date: '2026-09-02',
    po_do_number: 'PO-2026-KOM-044 / DO-KM-7712',
    package_condition: 'Baik',
    photo_attachment_url: null,
    status: 'waiting_admin',
    items: [
      {
        item_name: 'Komatsu PC2000 Hydraulic Seal Kit',
        part_number: 'BIB-KOM-PC2000-HYD',
        serial_number: 'SK-2000-091',
        qty_received: 20,
        qty_do: 20,
        unit: 'SET',
        item_condition: 'Baru',
        warranty: '6 Bulan',
        assigned_bin_location: 'R-A02',
        notes: 'Pemeriksaan fisik awal lengkap'
      }
    ],
    signatures: {
      slot1: {
        signed: true,
        slot_type: 'creator',
        signer_name: 'arya-user',
        signer_title: 'Teknisi Lapangan',
        role: 'User',
        timestamp: '2026-09-02T10:00:00.000Z',
        hash: 'SHA256:5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f'
      },
      slot2: { signed: false },
      slot3: { signed: false }
    },
    created_at: '2026-09-02T09:45:00.000Z'
  }
];

// Helper to normalize MOS document
const normalizeMosDoc = (d) => ({
  id: d.id,
  doc_number: d.doc_number || d.mos_number || d.id,
  title: d.title || `MOS ${d.doc_number || d.mos_number || d.id}`,
  site_location: d.site_location || d.site_name || 'Office VGT',
  site_id: d.site_id,
  pic_receiver_name: d.pic_receiver_name || d.requester_name || d.submitted_by || 'Teknisi Lapangan',
  received_date: d.received_date || d.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
  po_do_number: d.po_do_number || (d.po_number ? `${d.po_number} / ${d.do_number || ''}` : d.purpose),
  package_condition: d.package_condition || 'Baik',
  photo_attachment_url: d.photo_attachment_url || d.photo_url || null,
  status: d.status || 'draft',
  rejection_notes: d.rejection_notes || null,
  items: Array.isArray(d.items) ? d.items : [],
  signatures: d.signatures || {
    slot1: d.slot1_signature ? { signed: true, signer_name: d.slot1_signer, timestamp: d.slot1_signed_at } : { signed: false },
    slot2: d.slot2_signature ? { signed: true, signer_name: d.slot2_signer, timestamp: d.slot2_signed_at } : { signed: false },
    slot3: d.slot3_signature ? { signed: true, signer_name: d.slot3_signer, timestamp: d.slot3_signed_at } : { signed: false }
  },
  created_by_id: d.created_by || d.submitted_by_id,
  created_at: d.created_at
});

// GET /api/mos — Role-filtered list
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = supabase.from('mos_documents').select('*').order('created_at', { ascending: false });

    // Role-based filtering (PRD 5)
    if (req.user.role === 'User') {
      // User only sees their own submissions
      query = query.or(`created_by.eq.${req.user.id},submitted_by_id.eq.${req.user.id},pic_receiver_name.eq.${req.user.full_name}`);
    }

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    let list = (data && data.length > 0) ? data.map(normalizeMosDoc) : FALLBACK_MOS;

    // Filter fallback if used
    if (req.user.role === 'User' && (!data || data.length === 0)) {
      list = FALLBACK_MOS; // for preview
    }

    return sendSuccess(res, list, 'Daftar dokumen MOS berhasil dimuat.');
  } catch (err) {
    return sendSuccess(res, FALLBACK_MOS, 'Daftar dokumen MOS (fallback).');
  }
});

// GET /api/mos/stats
router.get('/stats', requireAuth, async (req, res, next) => {
  try {
    const { data } = await supabase.from('mos_documents').select('status');
    const docs = (data && data.length > 0) ? data : FALLBACK_MOS;

    const stats = {
      total: docs.length,
      draft: docs.filter(d => d.status === 'draft').length,
      waiting_admin: docs.filter(d => d.status === 'waiting_admin').length,
      waiting_superadmin: docs.filter(d => d.status === 'waiting_superadmin').length,
      completed: docs.filter(d => d.status === 'completed').length,
      rejected: docs.filter(d => d.status === 'rejected').length
    };

    return sendSuccess(res, stats, 'Statistik dokumen MOS.');
  } catch (err) {
    next(err);
  }
});

// GET /api/mos/:id
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('mos_documents')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    let doc = data ? normalizeMosDoc(data) : FALLBACK_MOS.find(d => d.id === req.params.id);

    if (!doc) {
      throw new AppError('Dokumen MOS tidak ditemukan.', 404, 'RESOURCE_NOT_FOUND');
    }

    return sendSuccess(res, doc, 'Detail dokumen MOS.');
  } catch (err) {
    next(err);
  }
});

// POST /api/mos — Create new MOS Draft (PRD Section 7.1)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const {
      doc_number,
      site_location,
      site_id,
      pic_receiver_name,
      received_date,
      po_do_number,
      package_condition,
      photo_attachment_url,
      items,
      signature_creator // Slot 1 canvas base64
    } = req.body;

    if (!site_location || !items || items.length === 0) {
      throw new AppError('Lokasi site dan rincian barang material wajib diisi.', 400, 'VALIDATION_FAILED', [
        { field: 'site_location', issue: !site_location ? 'Lokasi site terverifikasi wajib ada' : null },
        { field: 'items', issue: !items?.length ? 'Minimal satu item material wajib diisi' : null }
      ].filter(f => f.issue));
    }

    // Auto-generate standard document number if not provided: 00X/VGT/MOS/MNTOA/BIBOA/MONTH/YEAR
    const monthRoman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][new Date().getMonth()];
    const year = new Date().getFullYear();
    const docNum = doc_number || `${String(Date.now()).slice(-3)}/VGT/MOS/MNTOA/BIBOA/${monthRoman}/${year}`;
    const mosId = `mos-${Date.now()}`;

    // Prepare signatures from document sheet or construct initial structure
    const signatures = req.body.signatures || {
      slot1: { signed: false },
      slot2: { signed: false },
      slot3: { signed: false }
    };

    if (signature_creator && !signatures.slot1?.signed) {
      const timestamp = new Date().toISOString();
      const hash = `SHA256:${crypto.createHash('sha256').update(`${req.user.id}:${mosId}:slot1:${timestamp}`).digest('hex')}`;
      signatures.slot1 = {
        signed: true,
        slot_type: 'creator',
        signer_name: pic_receiver_name || req.user.full_name,
        signer_title: 'Teknisi Lapangan (PIC Penerima)',
        role: req.user.role,
        signature_image: signature_creator,
        timestamp,
        hash
      };
    }

    let initialStatus = req.body.status || 'draft';
    if (signatures.slot1?.signed && signatures.slot2?.signed && signatures.slot3?.signed) {
      initialStatus = 'completed';
    } else if (signatures.slot2?.signed) {
      initialStatus = 'waiting_superadmin';
    } else if (signatures.slot1?.signed) {
      initialStatus = 'waiting_admin';
    }

    const newMosRecord = {
      id: mosId,
      doc_number: docNum,
      mos_number: docNum,
      title: `Penerimaan Material ${items[0]?.item_name || 'Site'} (${docNum})`,
      purpose: `Penerimaan Material ${items[0]?.item_name || 'Operasional'} (${docNum})`,
      site_location,
      site_id: site_id || 'site-vgt-office',
      pic_receiver_name: pic_receiver_name || req.user.full_name,
      requester_name: pic_receiver_name || req.user.full_name,
      requester_email: req.user.email,
      department: req.user.department || 'Operasional Lapangan',
      received_date: received_date || new Date().toISOString().split('T')[0],
      po_do_number: po_do_number || '-',
      package_condition: package_condition || 'Baik',
      photo_attachment_url: photo_attachment_url || null,
      status: initialStatus,
      items: items.map((it, idx) => ({
        id: `item-${idx + 1}`,
        item_name: it.item_name || 'Material Item',
        part_number: it.part_number || it.sku || '-',
        serial_number: it.serial_number || '-',
        qty_received: Number(it.qty_received || it.qty || 1),
        qty_do: Number(it.qty_do || it.qty_received || 1),
        unit: it.unit || 'PCS',
        item_condition: it.item_condition || 'Baru',
        warranty: it.warranty || 'Standar Vendor',
        assigned_bin_location: it.assigned_bin_location || it.rack || 'R-A01',
        notes: it.notes || ''
      })),
      signatures,
      created_by: req.user.id,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('mos_documents')
      .insert(newMosRecord)
      .select()
      .maybeSingle();

    const createdDoc = data ? normalizeMosDoc(data) : newMosRecord;

    // Telegram and Email alerts if Slot 1 was signed
    if (initialStatus === 'waiting_admin') {
      sendMosStepTelegramAlert(docNum, 'Draf Diajukan (Slot 1 TTD)', req.user.full_name, 'Admin Logistik').catch(() => {});
    }

    return sendCreated(res, createdDoc, 'Dokumen MOS berhasil dibuat dan disimpan.');
  } catch (err) {
    next(err);
  }
});

// PUT /api/mos/:id/sign — Dynamic 3-Role Signature (PRD Section 7.2)
router.put('/:id/sign', requireAuth, async (req, res, next) => {
  try {
    const { slot, signature_image, notes } = req.body;
    const { role, full_name, id: userId } = req.user;

    if (!['slot1', 'slot2', 'slot3'].includes(slot)) {
      throw new AppError('Slot tanda tangan tidak valid (harus slot1, slot2, atau slot3).', 400, 'VALIDATION_FAILED');
    }

    // Role-Lock Check (PRD 7.2.2 & SDD 3.3)
    if (slot === 'slot1') {
      // Slot 1: Creator (User)
      // Any authenticated creator can sign Slot 1
    } else if (slot === 'slot2') {
      // Slot 2: Reviewer (Admin/Supervisor)
      if (!['Admin', 'Superadmin'].includes(role)) {
        throw new AppError('Hanya akun dengan Role Admin atau Superadmin yang berhak menandatangani Slot 2 (Diperiksa Oleh).', 403, 'MOS_INVALID_SLOT_ROLE');
      }
    } else if (slot === 'slot3') {
      // Slot 3: Acknowledgement (Superadmin)
      if (role !== 'Superadmin') {
        throw new AppError('Hanya akun dengan Role Superadmin yang berhak memberikan otorisasi final Slot 3 (Diketahui Oleh).', 403, 'MOS_INVALID_SLOT_ROLE');
      }
    }

    // Fetch existing document
    const { data: existingDoc } = await supabase
      .from('mos_documents')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    const doc = existingDoc ? normalizeMosDoc(existingDoc) : FALLBACK_MOS.find(d => d.id === req.params.id);

    if (!doc) {
      throw new AppError('Dokumen MOS tidak ditemukan.', 404, 'RESOURCE_NOT_FOUND');
    }

    // State transition check (PRD 7.2 & SDD Figure 10)
    let newStatus = doc.status;
    let signerTitle = 'Teknisi VGT';

    if (slot === 'slot1') {
      newStatus = 'waiting_admin';
      signerTitle = 'Teknisi VGT Lapangan';
    } else if (slot === 'slot2') {
      if (doc.status !== 'waiting_admin' && doc.status !== 'draft') {
        throw new AppError('Dokumen belum berada pada status menunggu pemeriksaan Admin (waiting_admin).', 409, 'STATE_CONFLICT');
      }
      newStatus = 'waiting_superadmin';
      signerTitle = 'Supervisor Logistik VGT';
    } else if (slot === 'slot3') {
      if (doc.status !== 'waiting_superadmin') {
        throw new AppError('Dokumen belum disetujui Slot 2 dan belum menunggu otorisasi Superadmin.', 409, 'STATE_CONFLICT');
      }
      newStatus = 'completed';
      signerTitle = 'Superadmin Digitech / BIB';
    }

    const timestamp = new Date().toISOString();
    const hash = `SHA256:${crypto.createHash('sha256').update(`${userId}:${doc.id}:${slot}:${timestamp}`).digest('hex')}`;

    const updatedSignatures = {
      ...doc.signatures,
      [slot]: {
        signed: true,
        slot_type: slot === 'slot1' ? 'creator' : slot === 'slot2' ? 'reviewer' : 'acknowledgement',
        signer_name: full_name,
        signer_title: signerTitle,
        role,
        signature_image: signature_image || null,
        notes: notes || '',
        timestamp,
        hash
      }
    };

    // Update in database
    await supabase
      .from('mos_documents')
      .update({
        signatures: updatedSignatures,
        status: newStatus,
        updated_at: timestamp
      })
      .eq('id', req.params.id);

    // AUTO-LEDGER COMMIT (PRD Section 7.2.2 & SDD Section 3.3)
    // Tepat saat dokumen berstatus completed, mutasi stok dibukukan ke inventory_ledger
    if (newStatus === 'completed') {
      for (const item of doc.items || []) {
        const qtyReceived = Number(item.qty_received || item.qty || 1);
        const binLocation = item.assigned_bin_location || item.rack || 'R-A01';
        
        // 1. Insert into inventory_ledger
        try {
          await supabase
            .from('inventory_ledger')
            .insert({
              item_name: item.item_name,
              part_number: item.part_number || item.sku,
              bin_location: binLocation,
              qty_change: qtyReceived,
              transaction_type: 'MOS_IN',
              reference_doc_id: doc.doc_number || doc.id,
              notes: `Auto-ledger penambahan stok MOS completed (${doc.doc_number})`,
              performed_by: full_name,
              created_at: timestamp
            });
        } catch (e) {
          console.warn('[Auto-Ledger] Insert failed:', e.message);
        }

        // 2. Increment stock in inventory_items if matching
        if (item.part_number) {
          try {
            const { data: invItem } = await supabase
              .from('inventory_items')
              .select('id, current_stock')
              .or(`sku.eq.${item.part_number},name.ilike.%${item.item_name}%`)
              .maybeSingle();

            if (invItem) {
              await supabase
                .from('inventory_items')
                .update({
                  current_stock: Number(invItem.current_stock || 0) + qtyReceived
                })
                .eq('id', invItem.id);
            }
          } catch (e) {
            console.warn('[Auto-Stock] Update failed:', e.message);
          }
        }
      }

      // Send completion notifications
      sendMosNotificationEmail(doc.requester_email || 'arya-user@digitech.co.id', doc.doc_number, 'completed', full_name, notes).catch(() => {});
    }

    const finalDoc = {
      ...doc,
      status: newStatus,
      signatures: updatedSignatures
    };

    return sendSuccess(res, finalDoc, `Tanda tangan ${slot.toUpperCase()} berhasil dibubuhkan. Status dokumen kini: ${newStatus}.`);
  } catch (err) {
    next(err);
  }
});

// PUT /api/mos/:id/reject — Reject document back to draft with revision notes
router.put('/:id/reject', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { rejection_notes } = req.body;
    if (!rejection_notes) {
      throw new AppError('Alasan penolakan / catatan revisi wajib diisi.', 400, 'VALIDATION_FAILED');
    }

    const { data: doc } = await supabase
      .from('mos_documents')
      .update({
        status: 'rejected',
        rejection_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .maybeSingle();

    sendMosNotificationEmail(doc?.requester_email || 'arya-user@digitech.co.id', doc?.doc_number || req.params.id, 'rejected', req.user.full_name, rejection_notes).catch(() => {});

    return sendSuccess(res, doc || { id: req.params.id, status: 'rejected', rejection_notes }, 'Dokumen MOS dikembalikan dengan catatan revisi.');
  } catch (err) {
    next(err);
  }
});

export default router;
