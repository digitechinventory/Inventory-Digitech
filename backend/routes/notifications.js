import { Router } from 'express';
import { supabase } from '../services/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { sendSuccess } from '../middlewares/responseHandler.js';
import { AppError } from '../middlewares/errorHandler.js';

const router = Router();

// Fallback in-memory notification store keyed by user_id to ensure offline/resilience
const inMemoryUserNotifications = new Map();

const DEFAULT_ROLE_NOTIFICATIONS = {
  Superadmin: [
    {
      id: 'default-sa-1',
      title: 'Menunggu Otorisasi Final (Slot 3)',
      message: 'MOS-2026-09-001 dari PT Trakindo Utama siap untuk penandatanganan dan pengesahan akhir.',
      type: 'info',
      link: '/mos',
      is_read: false,
      created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    },
    {
      id: 'default-sa-2',
      title: 'Permintaan Aktivasi Akun Baru',
      message: 'Terdapat 1 pendaftar baru (budi-teknisi) menunggu verifikasi dan persetujuan role.',
      type: 'warning',
      link: '/users',
      is_read: false,
      created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString()
    },
    {
      id: 'default-sa-3',
      title: 'Rekonsiliasi Audit Tahunan',
      message: 'Stock Opname Q3 2026 telah rampung di 4 gudang dan siap ditinjau di Ledger.',
      type: 'success',
      link: '/opname',
      is_read: false,
      created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
    }
  ],
  Admin: [
    {
      id: 'default-admin-1',
      title: 'Batas Minimum Safety Stock',
      message: 'Hydraulic Hose 1-inch di rak B3 tersisa 14 MTR (Safety Stock: 25 MTR). Segera buat PO.',
      type: 'warning',
      link: '/inventory',
      is_read: false,
      created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString()
    },
    {
      id: 'default-admin-2',
      title: 'Verifikasi Penerimaan Lapangan (Slot 2)',
      message: 'Penerimaan suku cadang MOS-2026-09-004 telah dicek fisik oleh penerima.',
      type: 'info',
      link: '/mos',
      is_read: false,
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
    },
    {
      id: 'default-admin-3',
      title: 'Jatuh Tempo Pengembalian Tools',
      message: 'Snap-on HD Digital Torque Wrench dipinjam oleh teknisi lapangan melebihi batas 3 hari.',
      type: 'warning',
      link: '/tools',
      is_read: false,
      created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    }
  ],
  User: [
    {
      id: 'default-user-1',
      title: 'Pengajuan MOS Disetujui',
      message: 'Permintaan material suku cadang MOS-2026-09-002 telah disetujui oleh Supervisor Gudang.',
      type: 'success',
      link: '/mos',
      is_read: false,
      created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString()
    },
    {
      id: 'default-user-2',
      title: 'Reminder Peminjaman Peralatan',
      message: 'Peralatan Fluke 87V Digital Multimeter Anda dijadwalkan kembali besok pukul 16:00 WITA.',
      type: 'info',
      link: '/tools',
      is_read: false,
      created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    },
    {
      id: 'default-user-3',
      title: 'Jadwal Agenda Shift Site',
      message: 'Shift inspeksi berkala Genset Workshop Batulicin dijadwalkan hari ini pukul 14:00.',
      type: 'info',
      link: '/agenda',
      is_read: false,
      created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
    }
  ]
};

/**
 * GET /api/notifications
 * Mengambil seluruh notifikasi spesifik milik req.user.id
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role || 'User';

    if (supabase) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return sendSuccess(res, {
          notifications: data,
          unread_count: data.filter(n => !n.is_read).length,
          user_id: userId,
          role: userRole
        }, 'Notifikasi berhasil dimuat.');
      }

      // If user has no notifications yet, seed default notifications for this specific user
      const defaults = DEFAULT_ROLE_NOTIFICATIONS[userRole] || DEFAULT_ROLE_NOTIFICATIONS.User;
      const seedRows = defaults.map(d => ({
        user_id: userId,
        role: userRole,
        title: d.title,
        message: d.message,
        type: d.type,
        link: d.link,
        is_read: false
      }));

      const { data: inserted, error: insertErr } = await supabase
        .from('notifications')
        .insert(seedRows)
        .select();

      if (!insertErr && inserted) {
        return sendSuccess(res, {
          notifications: inserted,
          unread_count: inserted.filter(n => !n.is_read).length,
          user_id: userId,
          role: userRole
        }, 'Notifikasi default diinisialisasi untuk user.');
      }
    }

    // In-memory fallback per user_id
    if (!inMemoryUserNotifications.has(userId)) {
      const defaults = (DEFAULT_ROLE_NOTIFICATIONS[userRole] || DEFAULT_ROLE_NOTIFICATIONS.User).map(d => ({
        ...d,
        id: `${userId}-${d.id}`,
        user_id: userId,
        role: userRole
      }));
      inMemoryUserNotifications.set(userId, defaults);
    }

    const userNotifs = inMemoryUserNotifications.get(userId) || [];
    return sendSuccess(res, {
      notifications: userNotifs,
      unread_count: userNotifs.filter(n => !n.is_read).length,
      user_id: userId,
      role: userRole
    }, 'Notifikasi berhasil dimuat (fallback mode).');
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/notifications/:id/read
 * Menandai satu notifikasi sebagai sudah dibaca (strictly scoped ke user_id)
 */
router.post('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notifId = req.params.id;

    if (supabase) {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notifId)
        .eq('user_id', userId)
        .select();

      if (!error && data && data.length > 0) {
        return sendSuccess(res, data[0], 'Notifikasi telah ditandai dibaca.');
      }
    }

    // In-memory fallback
    if (inMemoryUserNotifications.has(userId)) {
      const list = inMemoryUserNotifications.get(userId);
      const item = list.find(n => n.id === notifId);
      if (item) {
        item.is_read = true;
        return sendSuccess(res, item, 'Notifikasi telah ditandai dibaca.');
      }
    }

    return sendSuccess(res, { id: notifId, is_read: true }, 'Notifikasi telah ditandai dibaca.');
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/notifications/read-all
 * Menandai semua notifikasi milik user ini sebagai sudah dibaca
 */
router.post('/read-all', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (supabase) {
      await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false);
    }

    if (inMemoryUserNotifications.has(userId)) {
      const list = inMemoryUserNotifications.get(userId);
      list.forEach(n => { n.is_read = true; });
    }

    return sendSuccess(res, { user_id: userId, is_read: true }, 'Seluruh notifikasi user telah ditandai dibaca.');
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/notifications/:id
 * Menghapus/dismiss notifikasi spesifik milik user_id
 */
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notifId = req.params.id;

    if (supabase) {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notifId)
        .eq('user_id', userId);
    }

    if (inMemoryUserNotifications.has(userId)) {
      const list = inMemoryUserNotifications.get(userId);
      const filtered = list.filter(n => n.id !== notifId);
      inMemoryUserNotifications.set(userId, filtered);
    }

    return sendSuccess(res, { id: notifId, deleted: true }, 'Notifikasi berhasil dihapus.');
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/notifications
 * Menghapus seluruh notifikasi milik user_id
 */
router.delete('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (supabase) {
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);
    }

    inMemoryUserNotifications.set(userId, []);

    return sendSuccess(res, { user_id: userId, cleared: true }, 'Seluruh notifikasi user berhasil dibersihkan.');
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/notifications
 * Membuat notifikasi baru. Jika target_role disediakan, membuat baris untuk setiap user dalam role tersebut.
 */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { title, message, type = 'info', link = null, target_user_id, target_role } = req.body;

    if (!title || !message) {
      throw new AppError('Judul dan pesan notifikasi wajib diisi', 400);
    }

    const createdRows = [];

    // Jika ditujukan ke user spesifik
    if (target_user_id) {
      const row = {
        user_id: target_user_id,
        role: target_role || 'User',
        title,
        message,
        type,
        link,
        is_read: false
      };
      if (supabase) {
        const { data } = await supabase.from('notifications').insert([row]).select();
        if (data) createdRows.push(...data);
      } else {
        const list = inMemoryUserNotifications.get(target_user_id) || [];
        const newNotif = { ...row, id: `notif-${Date.now()}`, created_at: new Date().toISOString() };
        list.unshift(newNotif);
        inMemoryUserNotifications.set(target_user_id, list);
        createdRows.push(newNotif);
      }
    } else if (target_role) {
      // Diberikan ke setiap user dalam role tersebut secara independen
      let userIds = [];
      if (supabase) {
        const { data: users } = await supabase.from('user_profiles').select('id').eq('role', target_role);
        userIds = (users || []).map(u => u.id);
      }
      if (userIds.length === 0) {
        if (target_role === 'Superadmin') userIds = ['demo-sa-001'];
        else if (target_role === 'Admin') userIds = ['demo-admin-001'];
        else userIds = ['demo-user-001'];
      }

      for (const uid of userIds) {
        const row = {
          user_id: uid,
          role: target_role,
          title,
          message,
          type,
          link,
          is_read: false
        };
        if (supabase) {
          const { data } = await supabase.from('notifications').insert([row]).select();
          if (data) createdRows.push(...data);
        } else {
          const list = inMemoryUserNotifications.get(uid) || [];
          const newNotif = { ...row, id: `notif-${Date.now()}-${uid}`, created_at: new Date().toISOString() };
          list.unshift(newNotif);
          inMemoryUserNotifications.set(uid, list);
          createdRows.push(newNotif);
        }
      }
    } else {
      // Default: kirim ke pembuat notifikasi sendiri
      const row = {
        user_id: req.user.id,
        role: req.user.role || 'User',
        title,
        message,
        type,
        link,
        is_read: false
      };
      if (supabase) {
        const { data } = await supabase.from('notifications').insert([row]).select();
        if (data) createdRows.push(...data);
      }
    }

    return sendSuccess(res, createdRows, 'Notifikasi berhasil dibuat.');
  } catch (err) {
    next(err);
  }
});

export default router;
