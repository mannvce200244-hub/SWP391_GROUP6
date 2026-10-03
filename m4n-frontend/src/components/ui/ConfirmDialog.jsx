import { useEffect, useRef } from 'react'
import Button from './Button.jsx'
import { IconAlertCircle } from './Icons.jsx'

/**
 * Accessible confirmation modal replacing window.confirm().
 */
export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  onConfirm,
  onCancel,
  variant = 'danger',
  isLoading = false,
}) {
  const dialogRef = useRef(null)
  const cancelButtonRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    // Focus cancel button on open for safe default
    const timer = setTimeout(() => {
      cancelButtonRef.current?.focus()
    }, 50)

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    // Prevent background scrolling
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen, isLoading, onCancel])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 transition-opacity duration-150"
      onClick={() => !isLoading && onCancel()}
    >
      <div
        className="relative w-full max-w-md bg-surface rounded-xl border border-border p-6 shadow-xl flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        onClick={(e) => e.stopPropagation()}
        ref={dialogRef}
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-brand-soft text-brand">
            <IconAlertCircle size={22} />
          </div>
          <div className="flex flex-col gap-1.5 flex-grow">
            <h2 id="confirm-dialog-title" className="text-base font-bold text-ink">
              {title}
            </h2>
            {description && (
              <p id="confirm-dialog-desc" className="text-sm text-muted leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="quiet"
            onClick={onCancel}
            disabled={isLoading}
            ref={cancelButtonRef}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant}
            onClick={onConfirm}
            loading={isLoading}
            loadingLabel="Đang xử lý…"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
