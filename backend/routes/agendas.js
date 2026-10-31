import { Router } from 'express';
import { supabase } from '../services/supabase.js';
import localDb from '../services/localDb.js';
import { requireAuth } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';
import { sendSuccess, sendCreated } from '../middleware/responseHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendAgendaNotificationEmail } from '../services/mailer.js';

const router = Router();
const FALLBACK_AGENDAS = [];

// GET /api/agendas â€” List agendas with optional filter by month or category
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { month, category, status } = req.query;
    let query = supabase.from('agendas').select('*').order('date', { ascending: true }).order('start_time', { ascending: true });

    if (month) {
      // month format: YYYY-MM
      const startDate = `${month}-01`;
      const endDate = `${month}-31`;
      query = query.gte('date', startDate).lte('date', endDate);
    }

    if (category && category !== 'ALL') {
      query = query.eq('category', category);
    }

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[Agendas] Supabase query error, checking localDb:', error.message);
      if (localDb.isConnected()) {
        let sql = 'SELECT * FROM agendas WHERE 1=1';
        const params = [];
        if (month) {
          params.push(`${month}-01`, `${month}-31`);
          sql += ` AND date >= $${params.length - 1} AND date <= $${params.length}`;
        }
        if (category && category !== 'ALL') {
          params.push(category);
          sql += ` AND category = $${params.length}`;
        }
        sql += ' ORDER BY date ASC, start_time ASC';
        const result = await localDb.query(sql, params);
        return sendSuccess(res, result.rows, 'Daftar agenda site berhasil dimuat (Local DB).');
      }
      return sendSuccess(res, FALLBACK_AGENDAS, 'Daftar agenda site (fallback).');
    }

    return sendSuccess(res, data || [], 'Daftar agenda site berhasil dimuat.');
  } catch (err) {
    next(err);
  }
});

// GET /api/agendas/:id â€” Detail single agenda
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('agendas').select('*').eq('id', id).maybeSingle();

    if (error || !data) {
      const fallback = FALLBACK_AGENDAS.find(a => a.id === id);
      if (fallback) return sendSuccess(res, fallback, 'Detail agenda site (fallback).');
      throw new AppError('Agenda tidak ditemukan.', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, data, 'Detail agenda site.');
  } catch (err) {
    next(err);
  }
});

// POST /api/agendas â€” Create agenda (Admin & Superadmin only)
router.post('/', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const {
      title,
      date,
      start_time,
      end_time,
      category,
      site_location,
      site_id,
      pic_name,
      status,
      description
    } = req.body;

    if (!title || !date) {
      throw new AppError('Judul agenda dan tanggal wajib diisi.', 400, 'VALIDATION_ERROR');
    }

    const newAgenda = {
      id: `agn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      date,
      start_time: start_time || '08:00',
      end_time: end_time || '17:00',
      category: category || 'Shift',
      site_location: site_location || 'Pit South Site BIB-02',
      site_id: site_id || null,
      pic_name: pic_name || req.user.full_name,
      pic_id: req.user.id,
      status: status || 'scheduled',
      description: description || '',
      created_by: req.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('agendas').insert([newAgenda]).select().single();

    if (error) {
      console.warn('[Agendas] Failed to insert into Supabase:', error.message);
      if (localDb.isConnected()) {
        await localDb.query(
          `INSERT INTO agendas (id, title, date, start_time, end_time, category, site_location, pic_name, status, description, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            newAgenda.id,
            newAgenda.title,
            newAgenda.date,
            newAgenda.start_time,
            newAgenda.end_time,
            newAgenda.category,
            newAgenda.site_location,
            newAgenda.pic_name,
            newAgenda.status,
            newAgenda.description,
            newAgenda.created_by
          ]
        );
      }
    }

    if (req.user?.email) {
      sendAgendaNotificationEmail(req.user.email, {
        title: newAgenda.title,
        date: newAgenda.date,
        time: `${newAgenda.start_time} - ${newAgenda.end_time}`,
        site: newAgenda.site_location,
        pic: newAgenda.pic_name,
        category: newAgenda.category,
        description: newAgenda.description,
        actionType: 'dijadwalkan baru'
      }).catch(e => console.warn('[Agendas] Email notify error:', e.message));
    }

    return sendCreated(res, data || newAgenda, 'Agenda baru berhasil dijadwalkan.');
  } catch (err) {
    next(err);
  }
});

// PUT /api/agendas/:id â€” Update agenda (Admin & Superadmin only)
router.put('/:id', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      date,
      start_time,
      end_time,
      category,
      site_location,
      site_id,
      pic_name,
      status,
      description
    } = req.body;

    const updates = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) updates.title = title.trim();
    if (date !== undefined) updates.date = date;
    if (start_time !== undefined) updates.start_time = start_time;
    if (end_time !== undefined) updates.end_time = end_time;
    if (category !== undefined) updates.category = category;
    if (site_location !== undefined) updates.site_location = site_location;
    if (site_id !== undefined) updates.site_id = site_id;
    if (pic_name !== undefined) updates.pic_name = pic_name;
    if (status !== undefined) updates.status = status;
    if (description !== undefined) updates.description = description;

    const { data, error } = await supabase.from('agendas').update(updates).eq('id', id).select().single();

    if (error) {
      console.warn('[Agendas] Failed to update in Supabase:', error.message);
      if (localDb.isConnected()) {
        await localDb.query(
          `UPDATE agendas SET title = COALESCE($1, title), date = COALESCE($2, date),
           start_time = COALESCE($3, start_time), end_time = COALESCE($4, end_time),
           category = COALESCE($5, category), site_location = COALESCE($6, site_location),
           status = COALESCE($7, status), description = COALESCE($8, description),
           updated_at = NOW() WHERE id = $9`,
          [
            updates.title,
            updates.date,
            updates.start_time,
            updates.end_time,
            updates.category,
            updates.site_location,
            updates.status,
            updates.description,
            id
          ]
        );
      }
    }

    return sendSuccess(res, data || { id, ...updates }, 'Agenda berhasil diperbarui.');
  } catch (err) {
    next(err);
  }
});

// DELETE /api/agendas/:id â€” Delete agenda (Admin & Superadmin only)
router.delete('/:id', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('agendas').delete().eq('id', id);

    if (error) {
      console.warn('[Agendas] Failed to delete in Supabase:', error.message);
      if (localDb.isConnected()) {
        await localDb.query('DELETE FROM agendas WHERE id = $1', [id]);
      }
    }

    return sendSuccess(res, { id }, 'Agenda berhasil dihapus.');
  } catch (err) {
    next(err);
  }
});

export default router;
