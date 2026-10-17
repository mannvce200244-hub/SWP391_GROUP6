import { useState, useEffect, useRef } from 'react'
import notificationService from '../../services/notificationService.js'
import useAuth from '../../features/auth/useAuth.js'
import {
  IconBell,
  IconMessageSquare,
  IconPackage,
  IconShield,
} from '../ui/Icons.jsx'

export function NotificationBell() {
  const { isAuthenticated } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    let active = true
    if (isAuthenticated) {
      notificationService
        .getUnreadCount()
        .then((count) => {
          if (active) setUnreadCount(count)
        })
        .catch(() => {})

      const interval = setInterval(() => {
        notificationService
          .getUnreadCount()
          .then((count) => {
            if (active) setUnreadCount(count)
          })
          .catch(() => {})
      }, 30000)

      return () => {
        active = false
        clearInterval(interval)
      }
    }
  }, [isAuthenticated])

  useEffect(() => {
    let active = true
    if (isOpen && isAuthenticated) {
      notificationService
        .getRecentNotifications()
        .then((data) => {
          if (active) {
            setNotifications(Array.isArray(data) ? data : [])
            setIsLoading(false)
          }
        })
        .catch(() => {
          if (active) {
            setNotifications([])
            setIsLoading(false)
          }
        })
    }
    return () => {
      active = false
    }
  }, [isOpen, isAuthenticated])

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
    if (isRead) return
    try {
      await notificationService.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      // Ignored
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {
      // Ignored
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="relative p-2 rounded-lg text-ink hover:text-brand hover:bg-surface-secondary transition-colors cursor-pointer"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={`Thông báo hệ thống, ${unreadCount} chưa đọc`}
        title="Thông báo"
      >
        <IconBell size={20} className="w-5 h-5" />

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-border shadow-xl py-3 z-50 animate-in fade-in zoom-in-95">
          <div className="px-4 pb-2.5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-ink text-sm">Thông báo</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className="text-xs text-brand hover:underline font-medium cursor-pointer"
                onClick={handleMarkAllAsRead}
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border/50">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-muted">
                Đang tải thông báo...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted flex flex-col items-center gap-2">
                <IconBell size={24} className="text-muted/70" />
                <span>Bạn không có thông báo mới nào.</span>
              </div>
            ) : (
              notifications.map((n) => {
                const ItemIcon =
                  n.type === 'CHAT'
                    ? IconMessageSquare
                    : n.type === 'ORDER'
                    ? IconPackage
                    : n.type === 'SECURITY'
                    ? IconShield
                    : IconBell
                return (
                  <div
                    key={n.id}
                    onClick={() => handleMarkAsRead(n.id, n.isRead)}
                    className={`p-3.5 transition-colors cursor-pointer flex gap-3 items-start ${
                      n.isRead ? 'bg-white hover:bg-slate-50' : 'bg-jade-soft/20 hover:bg-jade-soft/40'
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
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
