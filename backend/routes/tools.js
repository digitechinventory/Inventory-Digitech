import { Router } from 'express';
import { supabase } from '../services/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';
import { sendSuccess, sendCreated } from '../middleware/responseHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  checkUserProjectAccess,
  normalizeProjectId
} from '../services/projectAuthorityService.js';

const router = Router();

const FALLBACK_TOOLS = [
  {
    id: 'tl-famous-01',
    project_id: 'proj-famous',
    project_code: 'FAMOUS',
    tool_name: 'Fluke 289 Industrial True-RMS Multimeter (Instalasi MDVR)',
    serial_number: 'FLK-FAM-2026-01',
    borrower_name: 'arya-admin',
    borrower_email: 'arya-admin@digitech.co.id',
    loan_date: '2026-10-28',
    expected_return_date: '2026-11-05',
    status: 'borrowed',
    condition: 'Baik',
    notes: '[PROJECT:FAMOUS] Diagnostik kelistrikan kamera DMS & MDVR unit HD785 KM-24'
  },
  {
    id: 'tl-famous-02',
    project_id: 'proj-famous',
    project_code: 'FAMOUS',
    tool_name: 'Infrared Thermal Imager Hikmicro M30 (Kalibrasi Kamera)',
    serial_number: 'HIK-FAM-2026-04',
    borrower_name: 'Rizky Pratama (Teknisi FAMOUS)',
    borrower_email: 'rizky@digitech.co.id',
    loan_date: '2026-10-20',
    expected_return_date: '2026-10-25',
    status: 'overdue',
    condition: 'Baik',
    notes: '[PROJECT:FAMOUS] Pengecekan suhu modul AI Box kabin DT-412 Pit Sebamban'
  },
  {
    id: 'tl-wim-01',
    project_id: 'proj-wim',
    project_code: 'WIM',
    tool_name: 'Hydraulic Torque Wrench 1000 Nm (Baut Jembatan Timbang WIM)',
    serial_number: 'HTW-WIM-2026-09',
    borrower_name: 'arya-user',
    borrower_email: 'arya-user@digitech.co.id',
    loan_date: '2026-10-29',
    expected_return_date: '2026-11-06',
    status: 'borrowed',
    condition: 'Baik',
    notes: '[PROJECT:WIM] Pengencangan dudukan sensor Load Cell WIM KM-14'
  },
  {
    id: 'tl-wim-02',
    project_id: 'proj-wim',
    project_code: 'WIM',
    tool_name: 'Load Cell mV/V Signal Simulator & Calibrator',
    serial_number: 'CAL-WIM-2026-02',
    borrower_name: 'Budi Santoso (Engineer WIM)',
    borrower_email: 'budi@digitech.co.id',
    loan_date: '2026-10-18',
    expected_return_date: '2026-10-22',
    actual_return_date: '2026-10-22',
    status: 'returned',
    condition: 'Baik',
    notes: '[PROJECT:WIM] Kalibrasi indikator digital jembatan timbang KM-28 selesai'
  },
  {
    id: 'tl-ccm-01',
    project_id: 'proj-ccm',
    project_code: 'CCM',
    tool_name: 'Laser Tachometer & Belt Alignment Gauge (Conveyor CCM)',
    serial_number: 'TAC-CCM-2026-07',
    borrower_name: 'arya-superadmin',
    borrower_email: 'arya-superadmin@digitech.co.id',
    loan_date: '2026-10-27',
    expected_return_date: '2026-11-04',
    status: 'borrowed',
    condition: 'Baik',
    notes: '[PROJECT:CCM] Kalibrasi kecepatan belt conveyor Port Bunati'
  },
  {
    id: 'tl-ccm-02',
    project_id: 'proj-ccm',
    project_code: 'CCM',
    tool_name: 'SKF Vibration Analyzer CMAS 100-SL (Crusher Bearing)',
    serial_number: 'SKF-CCM-2026-11',
    borrower_name: 'Hendra Wijaya (Teknisi CCM)',
    borrower_email: 'hendra@digitech.co.id',
    loan_date: '2026-10-15',
    expected_return_date: '2026-10-19',
    actual_return_date: '2026-10-19',
    status: 'returned',
    condition: 'Baik',
    notes: '[PROJECT:CCM] Inspeksi getaran bearing crusher ROM Stockpile'
  }
];

function inferToolProject(item, idx = 0) {
  if (item.project_id) {
    const norm = normalizeProjectId(item.project_id);
    return {
      project_id: norm,
      project_code: norm === 'proj-wim' ? 'WIM' : norm === 'proj-ccm' ? 'CCM' : 'FAMOUS'
    };
  }
  const text = `${item.notes || ''} ${item.tool_name || ''} ${item.serial_number || ''}`.toUpperCase();
  if (text.includes('WIM') || text.includes('LOAD CELL') || text.includes('TIMBANGAN') || text.includes('KM-14') || text.includes('TORQUE')) {
    return { project_id: 'proj-wim', project_code: 'WIM' };
  }
  if (text.includes('CCM') || text.includes('CONVEYOR') || text.includes('CRUSHER') || text.includes('BUNATI')) {
    return { project_id: 'proj-ccm', project_code: 'CCM' };
  }
  if (text.includes('FAMOUS') || text.includes('MDVR') || text.includes('DMS') || text.includes('ADAS') || text.includes('KM-24')) {
    return { project_id: 'proj-famous', project_code: 'FAMOUS' };
  }
  const pool = [
    { project_id: 'proj-famous', project_code: 'FAMOUS' },
    { project_id: 'proj-wim', project_code: 'WIM' },
    { project_id: 'proj-ccm', project_code: 'CCM' }
  ];
  return pool[idx % pool.length];
}

// GET /api/tools/loans — List tool loans
router.get('/loans', requireAuth, async (req, res, next) => {
  try {
    const { status, project_id } = req.query;
    if (project_id && !checkUserProjectAccess(req.user, project_id)) {
      throw new AppError('Anda tidak memiliki otoritas untuk mengakses peminjaman perkakas pada project ini.', 403, 'FORBIDDEN_PROJECT_ACCESS');
    }

    let query = supabase.from('tool_loans').select('*').order('loan_date', { ascending: false });
    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    const dbRows = (!error && Array.isArray(data)) ? data : [];

    let list = [
      ...dbRows.map((item, idx) => ({
        ...item,
        ...inferToolProject(item, idx)
      })),
      ...FALLBACK_TOOLS.filter(fb => !dbRows.some(d => d.id === fb.id || d.serial_number === fb.serial_number))
    ];

    const today = new Date().toISOString().split('T')[0];
    list = list.map(item => {
      if (item.status === 'borrowed' && item.expected_return_date < today) {
        return { ...item, status: 'overdue' };
      }
      return item;
    });

    if (status && status !== 'ALL') {
      list = list.filter(item => item.status === status);
    }

    if (project_id) {
      list = list.filter(item => normalizeProjectId(item.project_id) === normalizeProjectId(project_id));
    }

    return sendSuccess(res, list, 'Data peminjaman perkakas kerja per project (Tool Tracking).');
  } catch (err) {
    if (err instanceof AppError) return next(err);
    return sendSuccess(res, FALLBACK_TOOLS, 'Data peminjaman alat fallback.');
  }
});

// GET /api/tools/stats
router.get('/stats', requireAuth, async (req, res, next) => {
  try {
    const { data } = await supabase.from('tool_loans').select('*');
    const list = (data && data.length > 0) ? data : FALLBACK_TOOLS;
    const today = new Date().toISOString().split('T')[0];

    const stats = {
      total: list.length,
      borrowed: list.filter(t => t.status === 'borrowed' && t.expected_return_date >= today).length,
      overdue: list.filter(t => t.status === 'overdue' || (t.status === 'borrowed' && t.expected_return_date < today)).length,
      returned: list.filter(t => t.status === 'returned').length
    };

    return sendSuccess(res, stats, 'Statistik peminjaman perkakas.');
  } catch (err) {
    next(err);
  }
});

// POST /api/tools/loans — Borrow a tool
router.post('/loans', requireAuth, async (req, res, next) => {
  try {
    const { tool_name, serial_number, expected_return_date, notes, project_id } = req.body;

    if (!tool_name || !expected_return_date) {
      throw new AppError('Nama alat dan estimasi tanggal kembali wajib diisi.', 400, 'VALIDATION_FAILED');
    }

    const normProjId = normalizeProjectId(project_id || 'proj-famous');
    if (!checkUserProjectAccess(req.user, normProjId)) {
      throw new AppError('Akses ditolak: Anda tidak memiliki otoritas untuk meminjam alat pada project ini.', 403, 'FORBIDDEN_PROJECT_ACCESS');
    }

    const projCode = normProjId === 'proj-wim' ? 'WIM' : normProjId === 'proj-ccm' ? 'CCM' : 'FAMOUS';
    const taggedNotes = notes?.includes('[PROJECT:') ? notes : `[PROJECT:${projCode}] ${notes || ''}`.trim();

    const loanRecord = {
      tool_name,
      serial_number: serial_number || `${projCode}-TL-${Date.now().toString().slice(-4)}`,
      borrower_name: req.user.full_name,
      borrower_email: req.user.email,
      borrower_user_id: req.user.id,
      loan_date: new Date().toISOString().split('T')[0],
      expected_return_date,
      status: 'borrowed',
      condition: 'Baik',
      notes: taggedNotes,
      created_at: new Date().toISOString()
    };

    const { data } = await supabase
      .from('tool_loans')
      .insert(loanRecord)
      .select()
      .maybeSingle();

    const created = {
      ...(data || { id: `tl-${Date.now()}`, ...loanRecord }),
      project_id: normProjId,
      project_code: projCode
    };

    FALLBACK_TOOLS.unshift(created);
    return sendCreated(res, created, `Peminjaman alat kerja Project ${projCode} berhasil dicatat.`);
  } catch (err) {
    next(err);
  }
});

// PUT /api/tools/loans/:id/return — Return tool (Admin / User)
router.put('/loans/:id/return', requireAuth, async (req, res, next) => {
  try {
    const { condition, notes } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
      .from('tool_loans')
      .update({
        status: 'returned',
        actual_return_date: today,
        condition: condition || 'Baik',
        notes: notes || 'Alat telah dikembalikan ke gudang'
      })
      .eq('id', req.params.id)
      .select()
      .maybeSingle();

    const fbIdx = FALLBACK_TOOLS.findIndex(t => t.id === req.params.id);
    if (fbIdx !== -1) {
      FALLBACK_TOOLS[fbIdx].status = 'returned';
      FALLBACK_TOOLS[fbIdx].actual_return_date = today;
      FALLBACK_TOOLS[fbIdx].condition = condition || 'Baik';
      if (notes) {
        FALLBACK_TOOLS[fbIdx].notes = `[PROJECT:${FALLBACK_TOOLS[fbIdx].project_code}] ${notes}`;
      }
    }

    return sendSuccess(res, data || FALLBACK_TOOLS[fbIdx] || { id: req.params.id, status: 'returned' }, 'Pengembalian perkakas kerja berhasil dikonfirmasi.');
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tools/loans/:id — Hapus satu catatan peminjaman
router.delete('/loans/:id', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    try {
      await supabase.from('tool_loans').delete().eq('id', id);
    } catch (e) {
      console.warn('[Tool Loan Delete] Supabase error:', e.message);
    }
    const fbIdx = FALLBACK_TOOLS.findIndex(t => t.id === id);
    if (fbIdx !== -1) FALLBACK_TOOLS.splice(fbIdx, 1);

    return sendSuccess(res, { id }, 'Catatan peminjaman perkakas berhasil dihapus.');
  } catch (err) {
    next(err);
  }
});

// POST /api/tools/loans/bulk-delete — Hapus massal catatan peminjaman
router.post('/loans/bulk-delete', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError('Daftar ID peminjaman wajib disertakan.', 400, 'VALIDATION_FAILED');
    }
    try {
      await supabase.from('tool_loans').delete().in('id', ids);
    } catch (e) {
      console.warn('[Tool Loan Bulk Delete] Supabase error:', e.message);
    }
    ids.forEach(id => {
      const idx = FALLBACK_TOOLS.findIndex(t => t.id === id);
      if (idx !== -1) FALLBACK_TOOLS.splice(idx, 1);
    });
    return sendSuccess(res, { count: ids.length, ids }, `${ids.length} catatan peminjaman perkakas berhasil dihapus.`);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tools/loans/:id — Edit informasi peminjaman
router.patch('/loans/:id', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { expected_return_date, condition, notes, borrower_name } = req.body;

    const updatePayload = {};
    if (expected_return_date !== undefined) updatePayload.expected_return_date = expected_return_date;
    if (condition !== undefined) updatePayload.condition = condition;
    if (notes !== undefined) updatePayload.notes = notes;
    if (borrower_name !== undefined) updatePayload.borrower_name = borrower_name;

    let updated = null;
    try {
      const { data } = await supabase.from('tool_loans').update(updatePayload).eq('id', id).select().maybeSingle();
      updated = data;
    } catch (e) {
      console.warn('[Tool Loan Patch] Supabase error:', e.message);
    }

    const fbIdx = FALLBACK_TOOLS.findIndex(t => t.id === id);
    if (fbIdx !== -1) {
      FALLBACK_TOOLS[fbIdx] = { ...FALLBACK_TOOLS[fbIdx], ...updatePayload };
    }

    return sendSuccess(res, updated || FALLBACK_TOOLS[fbIdx] || { id, ...updatePayload }, 'Informasi peminjaman berhasil diperbarui.');
  } catch (err) {
    next(err);
  }
});

export default router;
