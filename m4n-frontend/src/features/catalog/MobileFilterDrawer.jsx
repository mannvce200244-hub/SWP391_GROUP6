import { useEffect, useRef } from 'react'
import { IconX } from '../../components/ui/Icons.jsx'
import ProductFilters from './ProductFilters.jsx'

function MobileFilterDrawer({
  busy = false,
  isOpen = false,
  onApply,
  onChange,
  onClose,
  onReset,
  value,
}) {
  const drawerRef = useRef(null)

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleApplyAndClose = (normalizedFilters) => {
    onApply(normalizedFilters)
    onClose()
  }

  const handleResetAndClose = () => {
    onReset()
    onClose()
  }

  return (
    <div
      aria-labelledby="mobile-filter-drawer-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div
        ref={drawerRef}
        className="relative w-full max-w-sm h-full bg-surface shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-secondary/30 shrink-0">
          <div className="flex items-center gap-2">
            <span className="resonance-motif" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </span>
            <h2 className="text-base font-bold text-ink" id="mobile-filter-drawer-title">
              Bộ lọc sản phẩm
            </h2>
          </div>
          <button
            aria-label="Đóng bảng bộ lọc"
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-secondary transition-colors cursor-pointer"
            onClick={onClose}
            type="button"
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5">
          <ProductFilters
            busy={busy}
            isDrawer={true}
            onApply={handleApplyAndClose}
            onChange={onChange}
            onReset={onReset}
            value={value}
          />
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-border bg-surface flex items-center gap-3 shrink-0">
          <button
            className="flex-1 h-10 px-4 rounded-md border border-control-border text-ink text-xs font-semibold hover:bg-surface-secondary transition-colors cursor-pointer text-center"
            disabled={busy}
            onClick={handleResetAndClose}
            type="button"
          >
            Đặt lại
          </button>
          <button
            className="flex-1 h-10 px-4 rounded-md bg-brand text-white text-xs font-semibold hover:bg-brand-hover active:bg-brand-deep transition-all duration-150 shadow-xs cursor-pointer text-center"
            disabled={busy}
            onClick={() => handleApplyAndClose(value)}
            type="button"
          >
            Xem kết quả
          </button>
        </div>
      </div>
    </div>
  )
}

export default MobileFilterDrawer
