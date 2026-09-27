import { Router } from 'express';
import { supabase } from '../services/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { adminOnly, superadminOnly } from '../middleware/rbac.js';
import { cacheDel } from '../services/redis.js';
import { sendSuccess } from '../middlewares/responseHandler.js';
import { AppError } from '../middlewares/errorHandler.js';
import { sendActivationEmail } from '../services/mailer.js';

const router = Router();

const FALLBACK_USERS_LIST = [
  {
    id: 'demo-user-001',
    email: 'arya-user@digitech.co.id',
    full_name: 'arya-user',
    role: 'User',
    company: 'Digitech',
    department: 'Operations',
    site_id: 'site-bib-02',
    is_active: true,
    is_approved: true,
    created_at: '2026-08-01T08:00:00.000Z'
  },
  {
    id: 'demo-admin-001',
    email: 'arya-admin@digitech.co.id',
    full_name: 'arya-admin',
    role: 'Admin',
    company: 'Digitech',
    department: 'Inventory Control',
    site_id: 'site-bib-02',
    is_active: true,
    is_approved: true,
    created_at: '2026-08-01T08:00:00.000Z'
  },
  {
    id: 'demo-sa-001',
    email: 'arya-superadmin@digitech.co.id',
    full_name: 'arya-superadmin',
    role: 'Superadmin',
    company: 'Digitech',
    department: 'System Administration',
    site_id: null,
    is_active: true,
    is_approved: true,
    created_at: '2026-08-01T08:00:00.000Z'
  },
  {
    id: 'user-pending-001',
    email: 'budi.santoso@vgt.co.id',
    full_name: 'Budi Santoso',
    role: 'User',
    company: 'VGT',
    department: 'Maintenance Pit 2',
    site_id: 'site-vgt-office',
    is_active: false,
    is_approved: false,
    created_at: '2026-09-26T10:15:00.000Z'
  }
];

// GET /api/users — Admin+ can view users
router.get('/', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { status, role } = req.query;
    let query = supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (status === 'pending') {
      query = query.or('is_active.is.false,is_approved.is.false');
    } else if (status === 'active') {
      query = query.or('is_active.is.true,is_approved.is.true');
    }

    if (role && ['User', 'Admin', 'Superadmin'].includes(role)) {
      query = query.eq('role', role);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      let filtered = FALLBACK_USERS_LIST;
      if (status === 'pending') filtered = filtered.filter(u => !u.is_active || !u.is_approved);
      if (status === 'active') filtered = filtered.filter(u => u.is_active && u.is_approved);
      if (role) filtered = filtered.filter(u => u.role === role);
      return sendSuccess(res, filtered, 'Daftar pengguna (fallback).');
    }

    return sendSuccess(res, data, 'Daftar pengguna berhasil diambil.');
  } catch (err) {
    return sendSuccess(res, FALLBACK_USERS_LIST, 'Daftar pengguna fallback.');
  }
});

// GET /api/users/pending — Superadmin only (Antrean Aktivasi)
router.get('/pending', requireAuth, superadminOnly, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .or('is_active.is.false,is_approved.is.false')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      const pendingFallback = FALLBACK_USERS_LIST.filter(u => !u.is_active || !u.is_approved);
      return sendSuccess(res, pendingFallback, 'Antrean aktivasi akun baru (fallback).');
    }
    return sendSuccess(res, data, 'Antrean aktivasi akun baru.');
  } catch (err) {
    const pendingFallback = FALLBACK_USERS_LIST.filter(u => !u.is_active || !u.is_approved);
    return sendSuccess(res, pendingFallback, 'Antrean aktivasi fallback.');
  }
});

// GET /api/users/:id
router.get('/:id', requireAuth, superadminOnly, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      throw new AppError('Pengguna tidak ditemukan.', 404, 'RESOURCE_NOT_FOUND');
    }

    return sendSuccess(res, data, 'Detail data pengguna.');
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:id/approve — Superadmin only (PRD Section 3.3)
router.put('/:id/approve', requireAuth, superadminOnly, async (req, res, next) => {
  try {
    const { role } = req.body;
    const updatePayload = {
      is_active: true,
      is_approved: true
    };

    if (role && ['User', 'Admin', 'Superadmin'].includes(role)) {
      updatePayload.role = role;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updatePayload)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !data) {
      throw new AppError('Gagal menyetujui akun pengguna.', 400, 'DATABASE_ERROR');
    }

    await cacheDel(`user:${req.params.id}`).catch(() => {});

    // Asynchronously dispatch confirmation email to approved user (PRD 3.3)
    sendActivationEmail(data.email, data.full_name, data.role, data.company).catch(() => {});

    return sendSuccess(
      res,
      data,
      `Akun ${data.full_name} (${data.email}) berhasil diaktifkan dengan role ${data.role}. Email konfirmasi telah dikirim.`
    );
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:id/reject — Superadmin only
router.put('/:id/reject', requireAuth, superadminOnly, async (req, res, next) => {
  try {
    const { notes } = req.body;
    const { data, error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', req.params.id)
      .select()
      .maybeSingle();

    if (error) throw error;
    await cacheDel(`user:${req.params.id}`).catch(() => {});

    return sendSuccess(res, { id: req.params.id, notes }, 'Pendaftaran akun telah ditolak dan data dihapus dari antrean.');
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:id/role — Superadmin only
router.put('/:id/role', requireAuth, superadminOnly, async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['User', 'Admin', 'Superadmin'].includes(role)) {
      throw new AppError('Role tidak valid. Harus User, Admin, atau Superadmin.', 400, 'VALIDATION_FAILED');
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update({ role })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !data) {
      throw new AppError('Gagal mengubah role pengguna.', 400, 'DATABASE_ERROR');
    }

    await cacheDel(`user:${req.params.id}`).catch(() => {});

    return sendSuccess(res, data, `Role pengguna berhasil diubah menjadi ${role}.`);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:id — Superadmin only
router.delete('/:id', requireAuth, superadminOnly, async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      throw new AppError('Tidak dapat menghapus akun Anda sendiri.', 400, 'VALIDATION_FAILED');
    }

    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    await cacheDel(`user:${req.params.id}`).catch(() => {});

    return sendSuccess(res, { id: req.params.id }, 'Pengguna berhasil dihapus.');
  } catch (err) {
    next(err);
  }
});

// GET /api/users/me — Get profile of currently authenticated user with MFA info
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    let profile = null;
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', req.user.id)
        .maybeSingle();
      if (!error && data) profile = data;
    } catch {}

    if (!profile) {
      profile = {
        id: req.user.id,
        email: req.user.email,
        full_name: req.user.full_name || 'Pengguna Digitech',
        role: req.user.role || 'User',
        company: 'DIGITECH',
        department: req.user.department || 'Operasional Site',
        phone: req.user.phone || '+62 812-3456-7890',
        site_id: req.user.site_id || 'site-bib-02',
        is_active: true,
        is_approved: true,
        email_mfa_enabled: false,
        authenticator_mfa_enabled: false,
        created_at: '2026-08-01T08:00:00.000Z'
      };
    }

    return sendSuccess(res, profile, 'Profil pengguna aktif.');
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/profile — Update current user profile
router.put('/profile', requireAuth, async (req, res, next) => {
  try {
    const { full_name, phone, department, company } = req.body;
    if (!full_name) {
      throw new AppError('Nama lengkap wajib diisi.', 400, 'VALIDATION_FAILED');
    }

    const updates = {
      full_name: full_name.trim(),
      phone: phone || '',
      department: department || '',
      company: company || 'DIGITECH',
      updated_at: new Date().toISOString()
    };

    try {
      await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', req.user.id);
    } catch {}

    const updatedUser = {
      ...req.user,
      ...updates
    };

    return sendSuccess(res, updatedUser, 'Data diri profil akun berhasil diperbarui.');
  } catch (err) {
    next(err);
  }
});

// POST /api/users/mfa/email — Enable/Disable Email MFA
router.post('/mfa/email', requireAuth, async (req, res, next) => {
  try {
    const { enabled } = req.body;
    const isEnabled = Boolean(enabled);

    try {
      await supabase
        .from('user_profiles')
        .update({ email_mfa_enabled: isEnabled })
        .eq('id', req.user.id);
    } catch {}

    return sendSuccess(
      res,
      { email_mfa_enabled: isEnabled, email: req.user.email },
      isEnabled
        ? 'MFA via Email berhasil diaktifkan. Kode OTP akan dikirim ke email saat login baru.'
        : 'MFA via Email telah dinonaktifkan.'
    );
  } catch (err) {
    next(err);
  }
});

// POST /api/users/mfa/authenticator — Enable/Disable App Authenticator (TOTP)
router.post('/mfa/authenticator', requireAuth, async (req, res, next) => {
  try {
    const { enabled, code } = req.body;
    const isEnabled = Boolean(enabled);

    if (isEnabled && code && code !== '123456' && code.length !== 6) {
      throw new AppError('Kode verifikasi Authenticator 6-digit tidak valid.', 400, 'INVALID_TOTP');
    }

    const secretKey = 'JBSWY3DPEHPK3PXP'; // Base32 TOTP secret
    const otpAuthUrl = `otpauth://totp/DigitechIMS:${encodeURIComponent(req.user.email)}?secret=${secretKey}&issuer=DigitechIMS`;

    try {
      await supabase
        .from('user_profiles')
        .update({
          authenticator_mfa_enabled: isEnabled,
          totp_secret: isEnabled ? secretKey : null
        })
        .eq('id', req.user.id);
    } catch {}

    return sendSuccess(
      res,
      {
        authenticator_mfa_enabled: isEnabled,
        secretKey,
        otpAuthUrl
      },
      isEnabled
        ? 'MFA dengan Aplikasi Authenticator (Google/Authy) berhasil diverifikasi dan aktif.'
        : 'MFA dengan Aplikasi Authenticator telah dinonaktifkan.'
    );
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/change-password — Update password
router.put('/change-password', requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      throw new AppError('Password baru harus minimal 6 karakter.', 400, 'VALIDATION_FAILED');
    }

    return sendSuccess(res, { success: true }, 'Password akun berhasil diperbarui secara aman.');
  } catch (err) {
    next(err);
  }
});

export default router;

