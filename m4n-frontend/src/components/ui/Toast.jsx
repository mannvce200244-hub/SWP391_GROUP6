import { useState, useCallback, useEffect, useRef } from 'react'
import { ToastContext } from './ToastContext.js'
import {
  CircleCheck,
  CircleX,
  TriangleAlert,
  Info,
  X,
} from 'lucide-react'

const TOAST_THEMES = {
  success: {
    border: 'border-success-border',
    accent: 'bg-success',
    text: 'text-success',
    Icon: CircleCheck,
  },
  error: {
    border: 'border-danger-border',
    accent: 'bg-danger',
    text: 'text-danger',
    Icon: CircleX,
  },
  warning: {
    border: 'border-coral-border',
    accent: 'bg-coral',
    text: 'text-coral',
    Icon: TriangleAlert,
  },
  info: {
    border: 'border-brand-border',
    accent: 'bg-brand',
    text: 'text-brand',
    Icon: Info,
  },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  useEffect(() => {
    const pendingTimers = timers.current
    return () => {
      pendingTimers.forEach(clearTimeout)
      pendingTimers.clear()
    }
  }, [])

  const addToast = useCallback(({ message, type = 'success', duration = 3500 }) => {
    const id = Date.now() + Math.random().toString(36).slice(2, 7)
    setToasts((prev) => [...prev, { id, message, type }])

    if (duration > 0) {
      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
        timers.current.delete(id)
      }, duration)
      timers.current.set(id, timer)
    }
  }, [])

  const removeToast = useCallback((id) => {
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div
        className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[100] flex flex-col gap-2.5 max-w-sm w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] pointer-events-none"
        aria-label="Thông báo hệ thống"
      >
        {toasts.map((toast) => {
          const theme = TOAST_THEMES[toast.type] || TOAST_THEMES.info
          const ToastIcon = theme.Icon
          return (
            <div
              key={toast.id}
              role={toast.type === 'error' ? 'alert' : 'status'}
              aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
              aria-atomic="true"
              className={`pointer-events-auto relative flex items-center gap-3 overflow-hidden rounded-lg border bg-white px-3.5 pb-3.5 pt-4 text-sm text-ink shadow-md ${theme.border}`}
            >
              <span
                className={`absolute inset-x-0 top-0 h-1 ${theme.accent}`}
                aria-hidden="true"
              />
              <span className={`shrink-0 ${theme.text}`} aria-hidden="true">
                <ToastIcon size={18} />
              </span>
              <span className="flex-1 font-medium text-ink leading-snug">{toast.message}</span>
              <button
                type="button"
                className="shrink-0 p-1 rounded-md text-muted hover:text-ink hover:bg-surface-secondary transition-colors cursor-pointer"
                onClick={() => removeToast(toast.id)}
                aria-label="Đóng thông báo"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export default ToastProvider
