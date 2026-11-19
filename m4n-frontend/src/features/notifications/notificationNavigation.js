import { navigateTo } from '../../routes/customerRoutes.js'

export const OPEN_CUSTOMER_CHAT_EVENT = 'm4n:open-customer-chat'

export function notificationDestination(notification, role) {
  const link = notification.link
  if (notification.type === 'CHAT' && role === 'CUSTOMER') {
    const id = typeof link === 'string' ? new URLSearchParams(link.split('?')[1]).get('chat') : null
    return { chatId: /^\d+$/.test(id ?? '') ? Number(id) : null, openChat: true }
  }
  if (notification.type === 'CHAT' && role === 'ONLINE_STAFF' && !link?.startsWith('/staff/chat')) {
    return { path: '/staff/chat' }
  }
  if (typeof link !== 'string' || !link.startsWith('/') || link.startsWith('//') || link.includes('\\')
      || [...link].some((character) => character.charCodeAt(0) <= 32)) return null
  return { path: link }
}

export function openNotification(notification, role) {
  const destination = notificationDestination(notification, role)
  if (destination?.openChat) {
    window.dispatchEvent(new CustomEvent(OPEN_CUSTOMER_CHAT_EVENT, { detail: { conversationId: destination.chatId } }))
  } else if (destination?.path) navigateTo(destination.path)
}
