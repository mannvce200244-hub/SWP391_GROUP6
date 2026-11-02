export function extractContent(page) {
  return Array.isArray(page?.content) ? page.content : Array.isArray(page) ? page : []
}

export function mergeMessages(current, received) {
  const byId = new Map(current.map((message) => [message.id, message]))
  received.forEach((message) => byId.set(message.id, message))
  return [...byId.values()].sort((left, right) => {
    const dateDifference = (Date.parse(left.createdAt) || 0) - (Date.parse(right.createdAt) || 0)
    return dateDifference || Number(left.id) - Number(right.id)
  })
}

export function hasMessageGap(current, received) {
  const previousLatest = current.at(-1)
  return Boolean(previousLatest &&
    received.some((message) => Number(message.id) > Number(previousLatest.id)) &&
    !received.some((message) => message.id === previousLatest.id))
}

export function formatMessageTime(value) {
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(date)
}

export function formatActivity(value) {
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) return 'Chưa có tin nhắn'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(date)
}
