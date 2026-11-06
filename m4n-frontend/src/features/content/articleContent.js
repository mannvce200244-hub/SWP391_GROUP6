export const ARTICLE_TYPES = Object.freeze({ ARTICLE: 'Bài viết văn hóa', GUIDE: 'Hướng dẫn sử dụng & bảo quản' })
export const ARTICLE_STATUSES = Object.freeze({ DRAFT: 'Bản nháp', PUBLISHED: 'Đã xuất bản' })

const dateFormatter = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeZone: 'Asia/Ho_Chi_Minh' })

export function formatArticleDate(value) {
  const date = new Date(value)
  return value && !Number.isNaN(date.getTime()) ? dateFormatter.format(date) : ''
}

export function isArticleMediaUrl(value) {
  if (!value?.trim()) return true
  const clean = value.trim()
  if (/\s|\\/.test(clean)) return false
  try {
    const url = new URL(clean)
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password && (url.port === '' || Number(url.port) > 0)
  } catch {
    return false
  }
}

export function validateArticleForm(form) {
  const errors = {}
  if (!form.title.trim()) errors.title = 'Vui lòng nhập tiêu đề.'
  else if (form.title.length > 200) errors.title = 'Tiêu đề tối đa 200 ký tự.'
  if (form.summary.length > 500) errors.summary = 'Tóm tắt tối đa 500 ký tự.'
  if (!form.content.trim()) errors.content = 'Vui lòng nhập nội dung.'
  else if (form.content.length > 30000) errors.content = 'Nội dung tối đa 30.000 ký tự.'
  if (!ARTICLE_TYPES[form.type]) errors.type = 'Vui lòng chọn loại nội dung.'
  for (const field of ['imageUrl', 'videoUrl']) {
    if (form[field].length > 500) errors[field] = 'URL tối đa 500 ký tự.'
    else if (!isArticleMediaUrl(form[field])) errors[field] = 'Vui lòng nhập URL HTTPS hợp lệ, không chứa thông tin đăng nhập.'
  }
  return errors
}
