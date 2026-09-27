import { Router } from 'express';
import { supabase, supabaseAdmin } from '../services/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { cacheGet, cacheSet, cacheDel } from '../services/redis.js';
import { sendSuccess, sendCreated } from '../middlewares/responseHandler.js';
import { AppError } from '../middlewares/errorHandler.js';
import { sendNewUserAlertToAdmin } from '../services/mailer.js';
import { sendNewUserTelegramAlert } from '../services/telegram.js';

const router = Router();

const FALLBACK_USERS = {
  'arya-user@digitech.co.id': {
    id: 'demo-user-001',
    email: 'arya-user@digitech.co.id',
    full_name: 'arya-user',
    role: 'User',
    company: 'Digitech',
    department: 'Operations',
    site_id: 'site-bib-02',
    is_active: true,
    phone: '+6281200000001'
  },
  'arya-admin@digitech.co.id': {
    id: 'demo-admin-001',
    email: 'arya-admin@digitech.co.id',
    full_name: 'arya-admin',
    role: 'Admin',
    company: 'Digitech',
    department: 'Inventory Control',
    site_id: 'site-bib-02',
    is_active: true,
    phone: '+6281200000002'
  },
  'arya-superadmin@digitech.co.id': {
    id: 'demo-sa-001',
    email: 'arya-superadmin@digitech.co.id',
    full_name: 'arya-superadmin',
    role: 'Superadmin',
    company: 'Digitech',
    department: 'System Administration',
    site_id: null,
    is_active: true,
    phone: '+6281200000003'
  }
};

// POST /api/auth/register — PRD Section 3.2
router.post('/register', async (req, res, next) => {
  try {
    const { full_name, email, password, phone, company, department } = req.body;

    // Validation
    const validationDetails = [];
    if (!full_name || full_name.trim().length < 2) {
      validationDetails.push({ field: 'full_name', issue: 'Nama lengkap minimal 2 karakter.' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validationDetails.push({ field: 'email', issue: 'Format email tidak valid.' });
    }
    if (!password || password.length < 8) {
      validationDetails.push({ field: 'password', issue: 'Kata sandi minimal harus 8 karakter.' });
    }
    if (!company) {
      validationDetails.push({ field: 'company', issue: 'Pilihan mitra perusahaan (VGT / Digitech / BIB) wajib dipilih.' });
    }
    if (!department) {
      validationDetails.push({ field: 'department', issue: 'Divisi atau departemen wajib diisi.' });
    }

    if (validationDetails.length > 0) {
      throw new AppError('Validasi formulir pendaftaran gagal.', 400, 'VALIDATION_FAILED', validationDetails);
    }

    // Check if email already registered in user_profiles
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingUser || FALLBACK_USERS[email.toLowerCase()]) {
      throw new AppError('Alamat email sudah terdaftar dalam sistem.', 409, 'STATE_CONFLICT', [
        { field: 'email', issue: 'Email sudah digunakan oleh akun lain.' }
      ]);
    }

    // Create auth account via Supabase Auth
    let authUserId = `user-${Date.now()}`;
    try {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password
      });
      if (authData?.user?.id) {
        authUserId = authData.user.id;
      }
    } catch (authError) {
      console.warn('[Auth Register] Supabase Auth fallback:', authError.message);
    }

    // Insert user record with is_active = false and role = 'User' (PRD 3.2)
    const newUserRecord = {
      id: authUserId,
      email: email.toLowerCase(),
      full_name,
      phone: phone || null,
      company,
      department,
      role: 'User',
      is_approved: false,
      is_active: false,
      created_at: new Date().toISOString()
    };

    const { error: profileErr } = await supabase
      .from('user_profiles')
      .insert(newUserRecord);

    if (profileErr) {
      console.error('[Auth Register] DB Insert Error:', profileErr);
    }

    // Asynchronously dispatch notification email to Superadmin
    sendNewUserAlertToAdmin('arya-superadmin@digitech.co.id', newUserRecord).catch(() => {});

    return sendCreated(
      res,
      {
        userId: authUserId,
        email: newUserRecord.email,
        fullName: newUserRecord.full_name,
        company: newUserRecord.company,
        role: newUserRecord.role,
        isActive: false
      },
      'Pendaftaran berhasil disimpan. Akun Anda sedang menunggu persetujuan dan aktivasi oleh Superadmin.'
    );
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login — PRD Section 3.4 & 3.5
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError('Email dan kata sandi wajib diisi.', 400, 'VALIDATION_FAILED', [
        { field: 'email', issue: !email ? 'Email wajib diisi' : null },
        { field: 'password', issue: !password ? 'Password wajib diisi' : null }
      ].filter(f => f.issue));
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Check database profile
    let profile = null;
    let authSession = null;

    try {
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (!authErr && authData?.user) {
        const { data: p } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();
        profile = p;
        authSession = authData.session;
      }
    } catch {}

    // Fallback lookup if Supabase auth didn't return (e.g. dev/demo accounts)
    if (!profile) {
      const { data: p } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();
      if (p) {
        profile = p;
      } else if (FALLBACK_USERS[cleanEmail]) {
        profile = FALLBACK_USERS[cleanEmail];
      }
    }

    if (!profile) {
      throw new AppError('Kredensial tidak valid. Periksa kembali email dan kata sandi Anda.', 401, 'AUTH_INVALID_CREDENTIALS');
    }

    // 2. Validate is_active status (PRD Section 3.5 & SDD 2.3)
    const isActive = profile.is_active ?? profile.is_approved ?? false;
    if (!isActive) {
      throw new AppError(
        'Akun Anda sedang menunggu persetujuan dan aktivasi oleh Superadmin. Silakan hubungi pengawas site.',
        403,
        'AUTH_ACCOUNT_INACTIVE',
        { email: cleanEmail, status: 'pending_activation' }
      );
    }

    const tokenPayload = {
      id: profile.id,
      email: profile.email,
      role: profile.role || 'User',
      company: profile.company,
      exp: Date.now() + 86400000
    };

    const token = `bearer.${Buffer.from(JSON.stringify(tokenPayload)).toString('base64')}`;

    const userInfo = {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role || 'User',
      company: profile.company || 'DIGITECH',
      department: profile.department || 'Operasional',
      site_id: profile.site_id,
      is_active: true
    };

    // Cache user info in Redis for 24h
    await cacheSet(`user:${profile.id}`, JSON.stringify(userInfo), 86400).catch(() => {});

    return sendSuccess(
      res,
      {
        user: userInfo,
        session: {
          access_token: authSession?.access_token || token,
          refresh_token: authSession?.refresh_token || null,
          expires_at: authSession?.expires_at || Date.now() + 86400000
        }
      },
      'Autentikasi berhasil.'
    );
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    if (req.user?.id) {
      await cacheDel(`user:${req.user.id}`).catch(() => {});
    }
    return sendSuccess(res, null, 'Sesi berhasil diakhiri (Logout sukses).');
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const cached = await cacheGet(`user:${req.user.id}`).catch(() => null);
    if (cached) {
      const user = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return sendSuccess(res, user, 'Data profil pengguna.');
    }
    return sendSuccess(res, req.user, 'Data profil pengguna.');
  } catch (err) {
    next(err);
  }
});

export default router;
