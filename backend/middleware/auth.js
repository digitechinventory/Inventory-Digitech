import { supabase } from '../services/supabase.js';

/**
 * Parse and validate a demo token (format: "demo.{base64payload}")
 */
function parseDemoToken(token) {
  if (!token.startsWith('demo.')) return null;
  try {
    const payload = JSON.parse(Buffer.from(token.slice(5), 'base64').toString());
    // exp is in milliseconds (Date.now() style)
    if (payload.exp && payload.exp < Date.now()) return null;
    if (!payload.demo) return null;
    return payload;
  } catch {
    return null;
  }
}

const DEMO_USERS = {
  'demo-user-001': {
    id: 'demo-user-001', email: 'arya-user@digitech.co.id',
    full_name: 'arya-user', role: 'User',
    site_id: 'site-bib-02', is_approved: true
  },
  'demo-admin-001': {
    id: 'demo-admin-001', email: 'arya-admin@digitech.co.id',
    full_name: 'arya-admin', role: 'Admin',
    site_id: 'site-bib-02', is_approved: true
  },
  'demo-sa-001': {
    id: 'demo-sa-001', email: 'arya-superadmin@digitech.co.id',
    full_name: 'arya-superadmin', role: 'Superadmin',
    site_id: null, is_approved: true
  }
};

function parseAppToken(token) {
  if (!token.startsWith('bearer.')) return null;
  try {
    const payload = JSON.parse(Buffer.from(token.slice(7), 'base64').toString());
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Middleware: Verify auth token from Authorization header.
 * Handles both Supabase JWTs, demo tokens (demo.{base64}), and bearer app tokens (bearer.{base64}).
 * Attaches req.user and req.role to the request.
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // ── Application bearer token path ────────────────────────────────────
    if (token.startsWith('bearer.')) {
      const payload = parseAppToken(token);
      if (!payload) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      let profile = null;
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', payload.id)
          .maybeSingle();
        profile = data;
      } catch (err) {
        console.warn('[Auth] Supabase profile fetch failed, using fallback:', err.message);
      }

      if (!profile && DEMO_USERS[payload.id]) {
        profile = DEMO_USERS[payload.id];
      }

      req.user = {
        id: payload.id,
        email: payload.email,
        role: profile?.role || payload.role || 'User',
        full_name: profile?.full_name || payload.full_name || payload.email,
        site_id: profile?.site_id || null,
        is_approved: profile?.is_approved ?? profile?.is_active ?? true,
      };
      req.isDemo = false;
      return next();
    }

    // ── Demo token path ─────────────────────────────────────────────────
    if (token.startsWith('demo.')) {
      const payload = parseDemoToken(token);
      if (!payload) {
        return res.status(401).json({ error: 'Invalid or expired demo token' });
      }
      const demoUser = DEMO_USERS[payload.id] || {
        id: payload.id,
        email: 'user@digitech.co.id',
        full_name: 'User Digitech',
        role: payload.role || 'User',
        site_id: 'site-bib-02',
        is_approved: true
      };
      req.user = demoUser;
      req.isDemo = true;
      return next();
    }

    // ── Supabase JWT path ────────────────────────────────────────────────
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      // Fetch user profile (role) from user_profiles table
      let profile = null;
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('role, full_name, site_id, is_approved')
          .eq('id', user.id)
          .maybeSingle();
        profile = data;
      } catch {}

      req.user = {
        id: user.id,
        email: user.email,
        role: profile?.role || 'User',
        full_name: profile?.full_name || user.email,
        site_id: profile?.site_id,
        is_approved: profile?.is_approved ?? true,
      };
      req.isDemo = false;
      return next();
    } catch {
      return res.status(401).json({ error: 'Token verification failed' });
    }

    next();
  } catch (err) {
    console.error('[Auth] middleware error:', err);
    res.status(500).json({ error: 'Authentication error' });
  }
}

/**
 * Optional auth: attaches user if token present, but doesn't block
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }
    await requireAuth(req, res, next);
  } catch {
    req.user = null;
    next();
  }
}
