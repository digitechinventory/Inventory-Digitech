// RBAC Role Hierarchy
// Superadmin > Admin > User
const ROLE_LEVELS = {
  'User': 1,
  'Admin': 2,
  'Superadmin': 3,
};

/**
 * Factory: create a middleware that requires a minimum role level
 * @param {'User'|'Admin'|'Superadmin'} minimumRole
 */
export function requireRole(minimumRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userLevel = ROLE_LEVELS[req.user.role] ?? 0;
    const requiredLevel = ROLE_LEVELS[minimumRole] ?? 99;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        error: `Access denied. Required role: ${minimumRole}. Your role: ${req.user.role}`,
        required: minimumRole,
        current: req.user.role
      });
    }

    next();
  };
}

/**
 * Middleware: only allow Superadmin
 */
export const superadminOnly = requireRole('Superadmin');

/**
 * Middleware: allow Admin and above
 */
export const adminOnly = requireRole('Admin');

/**
 * Middleware: allow any authenticated user
 */
export const userOnly = requireRole('User');

export default { requireRole, superadminOnly, adminOnly, userOnly };
