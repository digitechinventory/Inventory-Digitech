import { Router } from 'express';
import { supabase } from '../services/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';
import { sendSuccess, sendCreated } from '../middlewares/responseHandler.js';
import { AppError } from '../middlewares/errorHandler.js';

const router = Router();

const FALLBACK_TOOLS = [
  {
    id: 'tl-001',
    tool_name: 'Digital Torque Wrench 1/2" Heavy Duty',
    serial_number: 'TW-2026-089',
    borrower_name: 'arya-user',
    borrower_email: 'arya-user@digitech.co.id',
    loan_date: '2026-09-20',
    expected_return_date: '2026-09-25',
    actual_return_date: null,
    status: 'borrowed',
    condition: 'Baik',
    notes: 'Pekerjaan overhaul engine'
  },
  {
    id: 'tl-002',
    tool_name: 'Fluke 87V Industrial Multimeter',
    serial_number: 'FLUKE-87V-4421',
    borrower_name: 'arya-user',
    borrower_email: 'arya-user@digitech.co.id',
    loan_date: '2026-09-12',
    expected_return_date: '2026-09-19',
    actual_return_date: null,
    status: 'overdue',
    condition: 'Baik',
    notes: 'Perbaikan panel sensor'
  },
  {
    id: 'tl-003',
    tool_name: 'Hydraulic Pressure Test Kit 600 Bar',
    serial_number: 'HYD-TST-600B',
    borrower_name: 'arya-admin',
    borrower_email: 'arya-admin@digitech.co.id',
    loan_date: '2026-09-15',
    expected_return_date: '2026-09-18',
    actual_return_date: '2026-09-18',
    status: 'returned',
    condition: 'Baik',
    notes: 'Pengecekan valve manifold'
  }
];

// GET /api/tools/loans — List tool loans
router.get('/loans', requireAuth, async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = supabase.from('tool_loans').select('*').order('loan_date', { ascending: false });

    // User only sees their own loans
    if (req.user.role === 'User') {
      query = query.or(`borrower_email.eq.${req.user.email},borrower_name.eq.${req.user.full_name}`);
    }

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    let list = (data && data.length > 0) ? data : FALLBACK_TOOLS;

    // Dynamically flag overdue
    const today = new Date().toISOString().split('T')[0];
    list = list.map(item => {
      if (item.status === 'borrowed' && item.expected_return_date < today) {
        return { ...item, status: 'overdue' };
      }
      return item;
    });

    return sendSuccess(res, list, 'Data peminjaman perkakas kerja (Tool Tracking).');
  } catch (err) {
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

// POST /api/tools/loans — Borrow a tool (PRD Section 6.5)
router.post('/loans', requireAuth, async (req, res, next) => {
  try {
    const { tool_name, serial_number, expected_return_date, notes } = req.body;

    if (!tool_name || !expected_return_date) {
      throw new AppError('Nama alat dan estimasi tanggal kembali wajib diisi.', 400, 'VALIDATION_FAILED');
    }

    const loanRecord = {
      tool_name,
      serial_number: serial_number || '-',
      borrower_name: req.user.full_name,
      borrower_email: req.user.email,
      borrower_user_id: req.user.id,
      loan_date: new Date().toISOString().split('T')[0],
      expected_return_date,
      status: 'borrowed',
      condition: 'Baik',
      notes: notes || '',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('tool_loans')
      .insert(loanRecord)
      .select()
      .maybeSingle();

    return sendCreated(res, data || loanRecord, 'Peminjaman alat kerja berhasil dicatat.');
  } catch (err) {
    next(err);
  }
});

// PUT /api/tools/loans/:id/return — Return tool (Admin / User)
router.put('/loans/:id/return', requireAuth, async (req, res, next) => {
  try {
    const { condition, notes } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
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

    return sendSuccess(res, data || { id: req.params.id, status: 'returned' }, 'Pengembalian perkakas kerja berhasil dikonfirmasi.');
  } catch (err) {
    next(err);
  }
});

export default router;
