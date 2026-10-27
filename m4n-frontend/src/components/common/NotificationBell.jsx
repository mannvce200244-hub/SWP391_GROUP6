import { useState, useEffect, useRef } from 'react'
import notificationService from '../../services/notificationService.js'
import useAuth from '../../features/auth/useAuth.js'
import useToast from '../ui/useToast.js'
import {
  Bell,
  MessageSquare,
  Package,
  Shield,
} from 'lucide-react'

function NotificationBellContent() {
  const { isAuthenticated } = useAuth()
  const { addToast } = useToast()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [markingAll, setMarkingAll] = useState(false)
  const pendingReads = useRef(new Set())
  const markingAllRef = useRef(false)
  const mutationRevision = useRef(0)
  const countRequest = useRef(0)
  const containerRef = useRef(null)

  useEffect(() => notificationService.subscribeReadChanges(() => {
    mutationRevision.current += 1
    countRequest.current += 1
    setRefreshKey((key) => key + 1)
  }), [])

  useEffect(() => {
    let active = true
    if (isAuthenticated) {
      const refreshCount = () => {
        if (pendingReads.current.size || markingAllRef.current) return
        const revision = mutationRevision.current
        const request = ++countRequest.current
        notificationService
          .getUnreadCount()
          .then((count) => {
            if (active && request === countRequest.current && revision === mutationRevision.current) setUnreadCount(count)
          })
          .catch(() => { if (active && revision === mutationRevision.current) setError('Không thể cập nhật thông báo. Vui lòng thử lại.') })
      }
      refreshCount()
      const interval = setInterval(refreshCount, 30000)

      return () => {
        active = false
        clearInterval(interval)
      }
    }
  }, [isAuthenticated, refreshKey])

  useEffect(() => {
    let active = true
    if (isOpen && isAuthenticated) {
      if (pendingReads.current.size || markingAllRef.current) return undefined
      const revision = mutationRevision.current
      notificationService
        .getRecentNotifications()
        .then((data) => {
          if (active && revision === mutationRevision.current) {
            setNotifications(Array.isArray(data) ? data : [])
            setError('')
            setIsLoading(false)
          }
        })
        .catch(() => {
          if (active && revision === mutationRevision.current) {
            setError('Không thể tải thông báo. Vui lòng thử lại.')
            setIsLoading(false)
          }
        })
    }
    return () => {
      active = false
    }
  }, [isOpen, isAuthenticated, refreshKey])

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleMarkAsRead = async (id, isRead) => {
    if (isRead || pendingReads.current.has(id) || markingAllRef.current) return
    pendingReads.current.add(id)
    mutationRevision.current += 1
    try {
      await notificationService.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
    } catch (error) {
      addToast({ message: error.message || 'Không thể đánh dấu thông báo đã đọc.', type: 'error' })
    } finally {
      pendingReads.current.delete(id)
      mutationRevision.current += 1
      setRefreshKey((key) => key + 1)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (markingAllRef.current || pendingReads.current.size) return
    markingAllRef.current = true
    mutationRevision.current += 1
    setMarkingAll(true)
    try {
      await notificationService.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (error) {
      addToast({ message: error.message || 'Không thể đánh dấu tất cả đã đọc.', type: 'error' })
    } finally {
      markingAllRef.current = false
      mutationRevision.current += 1
      setRefreshKey((key) => key + 1)
      setMarkingAll(false)
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="relative p-2 rounded-lg text-ink hover:text-brand hover:bg-surface-secondary transition-colors cursor-pointer"
        onClick={() => {
          if (!isOpen) setIsLoading(true)
          setIsOpen((prev) => !prev)
        }}
        aria-expanded={isOpen}
        aria-label={`Thông báo hệ thống, ${unreadCount} chưa đọc`}
        title="Thông báo"
      >
        <Bell size={20} aria-hidden="true" />

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-2xl border border-border shadow-xl py-3 z-50 animate-in fade-in zoom-in-95">
          <div className="px-4 pb-2.5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-ink text-sm">Thông báo</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-surface-secondary text-red-700 text-xs font-semibold">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className="text-xs text-brand hover:underline font-medium cursor-pointer"
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border/50" aria-live="polite" aria-busy={isLoading}>
            {isLoading ? (
              <div className="py-8 text-center text-xs text-muted">
                Đang tải thông báo…
              </div>
            ) : error ? (
              <div className="p-4 text-sm text-danger" role="alert">
                <p>{error}</p>
                <button type="button" className="mt-2 underline" onClick={() => { setIsLoading(true); setRefreshKey((key) => key + 1) }}>Thử lại</button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted flex flex-col items-center gap-2">
                <Bell size={24} className="text-muted/70" />
                <span>Bạn không có thông báo mới nào.</span>
              </div>
            ) : (
              notifications.map((n) => {
                const ItemIcon =
                  n.type === 'CHAT'
                    ? MessageSquare
                    : n.type === 'ORDER'
                    ? Package
                    : n.type === 'SECURITY'
                    ? Shield
                    : Bell
                return (
                  <button
                    type="button"
                    key={n.id}
                    onClick={() => handleMarkAsRead(n.id, n.isRead)}
                    className={`w-full text-left p-3.5 transition-colors cursor-pointer flex gap-3 items-start ${
                      n.isRead ? 'bg-white hover:bg-surface-secondary' : 'bg-surface-secondary hover:bg-white'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-surface-secondary text-secondary border border-border/80">
                      <ItemIcon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-1">
                        <p className={`text-xs font-bold truncate ${n.isRead ? 'text-zinc-700' : 'text-ink'}`}>
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-brand shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-zinc-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <span className="text-xs text-muted block mt-1">
                        {n.createdAt ? new Date(n.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : ''}
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function NotificationBell() {
  const { user, isAuthenticated } = useAuth()
  return isAuthenticated ? <NotificationBellContent key={user?.id} /> : null
}

export default NotificationBell
