import { useState, useEffect } from 'react'
import notificationService from '../../services/notificationService.js'
import { Check } from 'lucide-react'
import LoadingState from '../../components/ui/LoadingState.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import ErrorState from '../../components/ui/ErrorState.jsx'
import useToast from '../../components/ui/useToast.js'

function StaffNotificationsPage() {
  const { addToast } = useToast()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true

    notificationService.getRecentNotifications()
      .then((data) => {
        if (!active) return
        const list = Array.isArray(data) ? data : data?.content || []
        setNotifications(list)
        return notificationService.getUnreadCount()
      })
      .then((count) => {
        if (active) {
          setUnreadCount(count || 0)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Không thể tải thông báo.')
          setLoading(false)
        }
      })

    return () => { active = false }
  }, [refreshKey])

  const handleMarkRead = async (notif) => {
    if (notif.read || notif.isRead) return
    try {
      await notificationService.markAsRead(notif.id)
      setUnreadCount((c) => Math.max(0, c - 1))
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true, isRead: true } : n))
      )
    } catch {
      // silent
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setUnreadCount(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })))
      addToast({ message: 'Đã đánh dấu tất cả thông báo là đã đọc.', type: 'info' })
    } catch (err) {
      addToast({ message: err.message || 'Lỗi khi cập nhật thông báo.', type: 'error' })
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Thông báo</h1>
          <p className="text-sm text-muted mt-1">
            Thông báo hệ thống liên quan đến đơn hàng, hỗ trợ và các hoạt động vận hành.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-white text-sm font-medium text-ink hover:bg-surface-secondary transition-colors cursor-pointer"
          >
            <Check size={14} />
            Đã đọc tất cả
          </button>
        )}
      </div>

      {loading ? (
        <LoadingState message="Đang tải thông báo..." />
      ) : error ? (
        <ErrorState
          title="Không thể tải thông báo"
          message={error}
          onRetry={() => setRefreshKey((k) => k + 1)}
        />
      ) : notifications.length === 0 ? (
        <EmptyState
          title="Không có thông báo"
          description="Bạn chưa nhận được thông báo nào."
        />
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden divide-y divide-border">
          {notifications.map((n) => {
            const isRead = n.read || n.isRead
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => handleMarkRead(n)}
                className={`w-full text-left p-4 flex items-start gap-3 hover:bg-surface-secondary/50 transition-colors cursor-pointer ${
                  !isRead ? 'bg-jade-soft/30' : ''
                }`}
              >
                <span
                  className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${
                    !isRead ? 'bg-jade' : 'bg-transparent border border-border'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!isRead ? 'font-semibold text-ink' : 'font-medium text-secondary'}`}>
                    {n.title || n.message || 'Thông báo mới'}
                  </p>
                  {n.title && n.message && (
                    <p className="text-xs text-muted mt-0.5 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                  )}
                  {n.createdAt && (
                    <span className="text-xs text-muted mt-1 block">
                      {new Date(n.createdAt).toLocaleString('vi-VN')}
                    </span>
                  )}
                </div>
                {!isRead && (
                  <span className="text-xs text-jade font-medium shrink-0 mt-1">Mới</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default StaffNotificationsPage
