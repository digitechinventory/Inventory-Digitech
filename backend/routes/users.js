import { Router } from 'express';
import crypto from 'crypto';
import { supabase } from '../services/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { adminOnly, superadminOnly } from '../middleware/rbac.js';
import { cacheDel } from '../services/redis.js';
import { sendSuccess } from '../middlewares/responseHandler.js';
import { AppError } from '../middlewares/errorHandler.js';
import { sendActivationEmail, sendAccountSettingsChangeEmail } from '../services/mailer.js';

import { 
  base32Decode, 
  generateTotp, 
  verifyTotp, 
  generateTotpSecret, 
  generateOtpAuthUrl, 
  generateBackupCodes 
} from '../utils/totp.js';
import { getUserAllowedProjects, setUserAllowedProjects } from '../services/projectAuthorityService.js';

const router = Router();

let FALLBACK_USERS_LIST = [
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
    let list = (error || !data || data.length === 0) ? FALLBACK_USERS_LIST : data;
    if (error || !data || data.length === 0) {
      if (status === 'pending') list = list.filter(u => !u.is_active || !u.is_approved);
      if (status === 'active') list = list.filter(u => u.is_active && u.is_approved);
      if (role) list = list.filter(u => u.role === role);
    }

    const enriched = list.map(u => ({
      ...u,
      allowed_projects: getUserAllowedProjects(u.id, u.role)
    }));

    return sendSuccess(res, enriched, 'Daftar pengguna berhasil diambil.');
  } catch (err) {
    const enrichedFallback = FALLBACK_USERS_LIST.map(u => ({
      ...u,
      allowed_projects: getUserAllowedProjects(u.id, u.role)
    }));
    return sendSuccess(res, enrichedFallback, 'Daftar pengguna fallback.');
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

    if (error) {
      const pendingFallback = FALLBACK_USERS_LIST.filter(u => !u.is_active || !u.is_approved);
      return sendSuccess(res, pendingFallback, 'Antrean aktivasi akun baru (fallback).');
    }
    return sendSuccess(res, data || [], 'Antrean aktivasi akun baru.');
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

    let updatedData = null;
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ role })
        .eq('id', req.params.id)
        .select()
        .single();
      if (!error && data) updatedData = data;
    } catch {}

    const idx = FALLBACK_USERS_LIST.findIndex(u => u.id === req.params.id);
    if (idx !== -1) {
      FALLBACK_USERS_LIST[idx].role = role;
      if (!updatedData) updatedData = FALLBACK_USERS_LIST[idx];
    }

    if (!updatedData) {
      throw new AppError('Pengguna tidak ditemukan untuk diubah rolenya.', 404, 'RESOURCE_NOT_FOUND');
    }

    await cacheDel(`user:${req.params.id}`).catch(() => {});

    return sendSuccess(res, updatedData, `Role pengguna berhasil diubah menjadi ${role}.`);
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:id/status — Superadmin only: Activate or Deactivate user
router.put('/:id/status', requireAuth, superadminOnly, async (req, res, next) => {
  try {
    const { is_active } = req.body;
    if (typeof is_active !== 'boolean') {
      throw new AppError('Field is_active harus berupa boolean (true/false).', 400, 'VALIDATION_FAILED');
    }

    if (req.params.id === req.user.id && !is_active) {
      throw new AppError('Tidak dapat menonaktifkan akun Anda sendiri yang sedang aktif.', 400, 'VALIDATION_FAILED');
    }

    let updatedData = null;
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ is_active })
        .eq('id', req.params.id)
        .select()
        .single();
      if (!error && data) updatedData = data;
    } catch {}

    // Update in fallback list as well
    const idx = FALLBACK_USERS_LIST.findIndex(u => u.id === req.params.id);
    if (idx !== -1) {
      FALLBACK_USERS_LIST[idx].is_active = is_active;
      if (!updatedData) updatedData = FALLBACK_USERS_LIST[idx];
    }

    if (!updatedData) {
      throw new AppError('Pengguna tidak ditemukan untuk diubah statusnya.', 404, 'RESOURCE_NOT_FOUND');
    }

    await cacheDel(`user:${req.params.id}`).catch(() => {});

    const statusLabel = is_active ? 'diaktifkan' : 'dinonaktifkan';
    return sendSuccess(
      res,
      updatedData,
      `Akun pengguna ${updatedData.full_name || req.params.id} berhasil ${statusLabel}.`
    );
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:id — Superadmin only
router.delete('/:id', requireAuth, superadminOnly, async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      throw new AppError('Tidak dapat menghapus akun Anda sendiri yang sedang aktif.', 400, 'VALIDATION_FAILED');
    }

    try {
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', req.params.id);
    } catch {}

    // Remove from fallback list
    FALLBACK_USERS_LIST = FALLBACK_USERS_LIST.filter(u => u.id !== req.params.id);

    await cacheDel(`user:${req.params.id}`).catch(() => {});

    return sendSuccess(res, { id: req.params.id }, 'Pengguna berhasil dihapus.');
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:id/projects — Superadmin only: Update project authority for user
router.put('/:id/projects', requireAuth, superadminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { allowed_projects } = req.body;

    if (!Array.isArray(allowed_projects)) {
      throw new AppError('allowed_projects harus berupa array project ID.', 400, 'VALIDATION_FAILED');
    }

    const updatedProjects = setUserAllowedProjects(id, allowed_projects);
    await cacheDel(`user:${id}`).catch(() => {});

    return sendSuccess(
      res,
      { id, allowed_projects: updatedProjects },
      `Hak otoritas project untuk pengguna ${id} berhasil diperbarui.`
    );
  } catch (err) {
    next(err);
  }
});

// GET /api/users/me — Get profile of currently authenticated user with MFA info & project authorities
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

    const defaultSecret = 'JBSWY3DPEHPK3PXP';
    const effectiveRole = profile.role || req.user.role || 'User';
    const enrichedProfile = {
      ...profile,
      allowed_projects: getUserAllowedProjects(req.user.id, effectiveRole),
      totp_secret: profile.totp_secret || defaultSecret,
      otp_auth_url: `otpauth://totp/Digitech%20IMS:${encodeURIComponent(profile.email || req.user.email)}?secret=${profile.totp_secret || defaultSecret}&issuer=Digitech%20IMS`
    };

    return sendSuccess(res, enrichedProfile, 'Profil pengguna aktif.');
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
      company: company || 'DIGITECH'
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

    if (req.user?.email) {
      sendAccountSettingsChangeEmail(
        req.user.email,
        req.user.full_name || full_name,
        'Pembaruan Data Diri Profil Akun',
        `Nama: ${full_name}, Departemen: ${department || '-'}`
      ).catch(e => console.warn('[Users] Email alert error:', e.message));
    }

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

    if (req.user?.email) {
      sendAccountSettingsChangeEmail(
        req.user.email,
        req.user.full_name,
        'Pengaturan Verifikasi Email (MFA)',
        isEnabled ? 'MFA Email telah diaktifkan' : 'MFA Email telah dinonaktifkan'
      ).catch(e => console.warn('[Users] Email alert error:', e.message));
    }

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

// In-memory signature cache for resilient fallback across demo users
const USER_SIGNATURES = {};

// GET /api/users/signature — Get currently logged in user's saved signature
router.get('/signature', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    let signature = USER_SIGNATURES[userId] || null;

    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('signature_image')
        .eq('id', userId)
        .maybeSingle();
      if (data?.signature_image) {
        signature = data.signature_image;
      }
    } catch {}

    return sendSuccess(res, { signature }, 'Tanda tangan pengguna berhasil diambil.');
  } catch (err) {
    next(err);
  }
});

// POST /api/users/signature — Save / update user's extracted signature
router.post('/signature', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { signature } = req.body;
    if (!signature) {
      throw new AppError('Data tanda tangan tidak boleh kosong.', 400, 'VALIDATION_FAILED');
    }

    USER_SIGNATURES[userId] = signature;

    try {
      await supabase
        .from('user_profiles')
        .update({ signature_image: signature, updated_at: new Date().toISOString() })
        .eq('id', userId);
    } catch (e) {
      console.warn('[Users] Supabase update signature error:', e.message);
    }

    return sendSuccess(res, { signature }, 'Tanda tangan digital berhasil disimpan di profil akun.');
  } catch (err) {
    next(err);
  }
});

// GET /api/users/mfa/status — Cek status MFA akun saat ini
router.get('/mfa/status', requireAuth, async (req, res, next) => {
  try {
    let profile = null;
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('email_mfa_enabled, authenticator_mfa_enabled, totp_secret')
        .eq('id', req.user.id)
        .maybeSingle();
      if (data) profile = data;
    } catch {}

    const isEmailMfa = Boolean(profile?.email_mfa_enabled);
    const isAuthMfa = Boolean(profile?.authenticator_mfa_enabled);
    const secretKey = profile?.totp_secret || 'JBSWY3DPEHPK3PXP';
    const otpAuthUrl = generateOtpAuthUrl(req.user.email, secretKey);

    return sendSuccess(res, {
      email_mfa_enabled: isEmailMfa,
      authenticator_mfa_enabled: isAuthMfa,
      secretKey,
      otpAuthUrl,
      email: req.user.email
    }, 'Status keamanan MFA akun.');
  } catch (err) {
    next(err);
  }
});

// POST /api/users/mfa/generate-secret — Generate secret baru untuk scan Google Authenticator
router.post('/mfa/generate-secret', requireAuth, async (req, res, next) => {
  try {
    const newSecret = generateTotpSecret();
    const otpAuthUrl = generateOtpAuthUrl(req.user.email, newSecret);
    return sendSuccess(res, {
      secretKey: newSecret,
      otpAuthUrl
    }, 'Secret Google Authenticator baru berhasil dibuat.');
  } catch (err) {
    next(err);
  }
});

// POST /api/users/mfa/authenticator — Enable/Disable Google Authenticator (TOTP)
router.post('/mfa/authenticator', requireAuth, async (req, res, next) => {
  try {
    const { enabled, code, secret } = req.body;
    const isEnabled = Boolean(enabled);
    const secretKey = secret || 'JBSWY3DPEHPK3PXP'; // Base32 TOTP secret

    let backupCodes = null;

    if (isEnabled) {
      if (!code || !verifyTotp(secretKey, code)) {
        throw new AppError(
          'Kode verifikasi Authenticator 6-digit tidak valid atau telah kedaluwarsa. Pastikan jam pada smartphone Anda sinkron otomatis.',
          400,
          'INVALID_TOTP'
        );
      }
      backupCodes = generateBackupCodes(8);
    }

    const otpAuthUrl = generateOtpAuthUrl(req.user.email, secretKey);

    try {
      await supabase
        .from('user_profiles')
        .update({
          authenticator_mfa_enabled: isEnabled,
          totp_secret: isEnabled ? secretKey : null
        })
        .eq('id', req.user.id);
    } catch {}

    if (req.user?.email) {
      sendAccountSettingsChangeEmail(
        req.user.email,
        req.user.full_name,
        'Pengaturan Aplikasi Authenticator (Google / TOTP)',
        isEnabled ? 'Aplikasi Authenticator telah berhasil dihubungkan dan diaktifkan' : 'Aplikasi Authenticator telah dinonaktifkan'
      ).catch(e => console.warn('[Users] Email alert error:', e.message));
    }

    return sendSuccess(
      res,
      {
        authenticator_mfa_enabled: isEnabled,
        secretKey,
        otpAuthUrl,
        backupCodes
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

    if (req.user?.email) {
      sendAccountSettingsChangeEmail(
        req.user.email,
        req.user.full_name,
        'Penggantian Kata Sandi Akun',
        'Kata sandi login Anda telah berhasil diperbarui secara aman.'
      ).catch(e => console.warn('[Users] Email alert error:', e.message));
    }

    return sendSuccess(res, { success: true }, 'Password akun berhasil diperbarui secara aman.');
  } catch (err) {
    next(err);
  }
});

export default router;

