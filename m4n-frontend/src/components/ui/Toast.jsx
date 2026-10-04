import { useState, useCallback } from 'react'
import { ToastContext } from './ToastContext.js'
import { IconCheckCircle, IconAlertCircle, IconX } from './Icons.jsx'

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(({ message, type = 'success', duration = 3500 }) => {
    const id = Date.now() + Math.random().toString(36).slice(2, 7)
    setToasts((prev) => [...prev, { id, message, type }])

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100%-3rem)] pointer-events-none"
        aria-live="polite"
        role="status"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success'
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3 p-3.5 rounded-lg border shadow-md bg-surface text-ink text-sm ${
                isSuccess
                  ? 'border-jade-border/80 bg-jade-soft/30'
                  : 'border-brand-border/80 bg-brand-soft/30'
              }`}
            >
              <span className={`shrink-0 ${isSuccess ? 'text-jade' : 'text-brand'}`}>
                {isSuccess ? (
                  <IconCheckCircle size={18} />
                ) : (
                  <IconAlertCircle size={18} />
                )}
              </span>
              <span className="flex-1 font-medium text-ink leading-snug">{toast.message}</span>
              <button
                type="button"
                className="shrink-0 p-1 rounded-md text-muted hover:text-ink hover:bg-surface-secondary transition-colors cursor-pointer"
                onClick={() => removeToast(toast.id)}
                aria-label="Đóng thông báo"
              >
                <IconX size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export default ToastProvider
