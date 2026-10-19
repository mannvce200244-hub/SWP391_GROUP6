export function hasRolePermission(userRole, allowedRoles = []) {
  if (!userRole) return false
  if (allowedRoles.includes(userRole)) return true
  if (userRole === 'SUPER_ADMIN' && allowedRoles.includes('ADMIN')) return true
  return false
}

export function isBackOfficeAdmin(userRole) {
  return userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
}
