import db from './localDb.js';
import { getDatasetStore, persistDataset } from './projectDataService.js';

export const ALL_PROJECT_IDS = ['proj-famous', 'proj-wim', 'proj-ccm'];

export function getAuthoritiesMap() {
  const store = getDatasetStore();
  return store.project_authorities || {};
}

export function saveAuthoritiesMap(newMap) {
  const store = getDatasetStore();
  store.project_authorities = { ...newMap };
  persistDataset('project_authorities', store.project_authorities);
  return store.project_authorities;
}

export function normalizeProjectId(rawId) {
  if (!rawId) return null;
  const lower = String(rawId).trim().toLowerCase();
  if (lower === 'famous' || lower === 'proj-famous') return 'proj-famous';
  if (lower === 'wim' || lower === 'proj-wim') return 'proj-wim';
  if (lower === 'ccm' || lower === 'proj-ccm') return 'proj-ccm';
  return lower;
}

export function registerProjectId(projectId) {
  if (!projectId) return;
  const norm = normalizeProjectId(projectId);
  if (norm && !ALL_PROJECT_IDS.includes(norm)) {
    ALL_PROJECT_IDS.push(norm);
  }
}

export function getUserAllowedProjects(userId, role) {
  if (role === 'Superadmin') {
    return [...ALL_PROJECT_IDS];
  }
  const map = getAuthoritiesMap();
  const allowed = map[userId];
  if (Array.isArray(allowed)) {
    return allowed;
  }
  if (role === 'Admin') return ['proj-famous'];
  if (role === 'User') return ['proj-wim'];
  return [];
}

export function setUserAllowedProjects(userId, allowedProjects) {
  const map = getAuthoritiesMap();
  const cleaned = Array.isArray(allowedProjects)
    ? allowedProjects.map(normalizeProjectId).filter(Boolean)
    : [];
  const unique = Array.from(new Set(cleaned));
  map[userId] = unique;
  saveAuthoritiesMap(map);

  if (db.isConnected()) {
    db.query(
      `INSERT INTO project_authorities (user_id, allowed_projects, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (user_id) DO UPDATE SET allowed_projects = EXCLUDED.allowed_projects, updated_at = NOW()`,
      [userId, JSON.stringify(unique)]
    ).catch(() => {});
  }

  return map[userId];
}

export function checkUserProjectAccess(user, projectId) {
  if (!user) return false;
  if (user.role === 'Superadmin') return true;
  if (!projectId) return true;

  const normId = normalizeProjectId(projectId);
  const userAllowed = getUserAllowedProjects(user.id, user.role);
  return userAllowed.includes(normId);
}

/**
 * Express middleware to enforce project-specific access authorization
 */
export function requireProjectAccess(targetProjectResolver) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        error: 'Autentikasi diperlukan untuk mengakses data project.',
        code: 'AUTH_REQUIRED'
      });
    }

    if (req.user.role === 'Superadmin') {
      return next();
    }

    let targetProjectId = null;
    if (typeof targetProjectResolver === 'function') {
      targetProjectId = targetProjectResolver(req);
    } else if (typeof targetProjectResolver === 'string') {
      targetProjectId = targetProjectResolver;
    } else {
      targetProjectId = req.params.project_id || req.query.project_id || req.body?.project_id;
    }

    if (!targetProjectId) {
      return next();
    }

    const normId = normalizeProjectId(targetProjectId);
    const hasAccess = checkUserProjectAccess(req.user, normId);

    if (!hasAccess) {
      const projectName = normId === 'proj-famous' ? 'FAMOUS (Fleet Asset Management)'
        : normId === 'proj-wim' ? 'WIM (Weigh-In-Motion Scale System)'
        : normId === 'proj-ccm' ? 'CCM (Coal Crushing & Materials)'
        : normId;

      return res.status(403).json({
        success: false,
        statusCode: 403,
        error: `Akses ditolak. Akun Anda (${req.user.full_name || req.user.email} - Role: ${req.user.role}) belum memiliki hak otoritas untuk mengakses Project ${projectName}. Silakan hubungi Superadmin untuk mendapatkan hak akses.`,
        code: 'FORBIDDEN_PROJECT_ACCESS',
        project_id: normId,
        project_name: projectName,
        user_role: req.user.role,
        required_authority: 'Superadmin Approval'
      });
    }

    next();
  };
}
