import { CUSTOMER_ROUTES } from './customerRoutes.js'

export function hasRolePermission(userRole, allowedRoles = []) {
  if (!userRole) return false
  if (allowedRoles.includes(userRole)) return true
  if (userRole === 'SUPER_ADMIN' && allowedRoles.includes('ADMIN')) return true
  return false
}

export function isBackOfficeAdmin(userRole) {
  return userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
}

export function isStaffOrAdmin(userRole) {
  return ['ADMIN', 'SUPER_ADMIN', 'ONLINE_STAFF', 'POS_STAFF'].includes(userRole)
}

export function getWorkbenchInfo(userRole) {
  switch (userRole) {
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return {
        path: CUSTOMER_ROUTES.admin,
        label: 'Bảng điều khiển Quản trị',
        shortLabel: 'Quản trị',
      }
    case 'ONLINE_STAFF':
      return {
        path: CUSTOMER_ROUTES.staff,
        label: 'Bàn làm việc Nhân viên',
        shortLabel: 'Bàn làm việc',
      }
    case 'POS_STAFF':
      return {
        path: CUSTOMER_ROUTES.pos,
        label: 'Bàn làm việc POS',
        shortLabel: 'POS',
      }
    default:
      return null
  }
}
