import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ALL_PROJECT_IDS = ['proj-famous', 'proj-wim', 'proj-ccm'];

const DEFAULT_AUTHORITIES = {
  'demo-sa-001': ['proj-wim', 'proj-famous', 'proj-ccm'],
  'demo-admin-001': ['proj-famous'],
  'demo-user-001': ['proj-wim'],
  'user-pending-001': []
};

function getStoragePath() {
  const candidates = [
    path.join(__dirname, '..', 'data', 'project_authorities.json'),
    path.join(process.cwd(), 'backend', 'data', 'project_authorities.json'),
    path.join(process.cwd(), 'data', 'project_authorities.json')
  ];
  return candidates.find(c => fs.existsSync(c)) || candidates[0];
}

let memoryAuthorities = { ...DEFAULT_AUTHORITIES };

// Initialize authorities from disk if exists
try {
  const filePath = getStoragePath();
  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    memoryAuthorities = { ...DEFAULT_AUTHORITIES, ...JSON.parse(raw) };
  } else {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(DEFAULT_AUTHORITIES, null, 2), 'utf-8');
  }
} catch (e) {
  console.warn('[ProjectAuthorityService] Failed reading authorities file, using memory fallback:', e.message);
}

export function getAuthoritiesMap() {
  try {
    const filePath = getStoragePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      memoryAuthorities = { ...DEFAULT_AUTHORITIES, ...JSON.parse(raw) };
    }
  } catch (e) {}
  return memoryAuthorities;
}

export function saveAuthoritiesMap(newMap) {
  memoryAuthorities = { ...newMap };
  try {
    const filePath = getStoragePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(memoryAuthorities, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[ProjectAuthorityService] Failed saving authorities file:', e.message);
  }
  return memoryAuthorities;
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
  // Superadmin always has unrestricted access to all projects
  if (role === 'Superadmin') {
    return [...ALL_PROJECT_IDS];
  }
  const map = getAuthoritiesMap();
  const allowed = map[userId];
  if (Array.isArray(allowed)) {
    return allowed;
  }
  // Default fallback if not yet configured:
  // Admin gets FAMOUS, User gets WIM (if not specified)
  if (role === 'Admin') return ['proj-famous'];
  if (role === 'User') return ['proj-wim'];
  return [];
}

export function setUserAllowedProjects(userId, allowedProjects) {
  const map = getAuthoritiesMap();
  const cleaned = Array.isArray(allowedProjects)
    ? allowedProjects.map(normalizeProjectId).filter(Boolean)
    : [];
  map[userId] = Array.from(new Set(cleaned));
  saveAuthoritiesMap(map);
  return map[userId];
}

export function checkUserProjectAccess(user, projectId) {
  if (!user) return false;
  if (user.role === 'Superadmin') return true;
  if (!projectId) return true; // If no project specified, general access

  const normId = normalizeProjectId(projectId);
  const userAllowed = getUserAllowedProjects(user.id, user.role);
  return userAllowed.includes(normId);
}

/**
 * Express middleware to enforce project-specific access authorization
 * @param {Function|string} [targetProjectResolver] - Function (req) => projectId or hardcoded projectId
 */
export function requireProjectAccess(targetProjectResolver) {
  return (req, res, next) => {
    // 1. Authenticate user must exist
    if (!req.user) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        error: 'Autentikasi diperlukan untuk mengakses data project.',
        code: 'AUTH_REQUIRED'
      });
    }

    // 2. Superadmin always passes
    if (req.user.role === 'Superadmin') {
      return next();
    }

    // 3. Resolve target project ID
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
