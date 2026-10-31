import { useId } from 'react'
import useDialogFocus from '../../hooks/useDialogFocus.js'
import Button from './Button.jsx'
import { TriangleAlert } from 'lucide-react'

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
  const dialogRef = useDialogFocus(isOpen, onCancel, isLoading)
  const titleId = useId()
  const descriptionId = useId()

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
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        ref={dialogRef}
      >
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center flex-shrink-0 ${variant === 'danger' ? 'text-danger border border-danger-border' : 'text-brand border border-brand-border'}`}>
            <TriangleAlert size={20} aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-1.5 flex-grow">
            <h2 id={titleId} className="text-base font-bold text-ink">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="text-sm text-muted leading-relaxed">
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
            data-dialog-initial-focus
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
