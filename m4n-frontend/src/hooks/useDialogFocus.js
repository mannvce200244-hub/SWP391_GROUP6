import { useEffect, useEffectEvent, useRef } from 'react'

const FOCUSABLE = 'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
const openDialogs = []
let originalOverflow = ''

// Existing modal surfaces share keyboard containment and focus restoration.
export default function useDialogFocus(isOpen, onClose, isBusy = false) {
  const dialogRef = useRef(null)
  const closeDialog = useEffectEvent(() => {
    if (!isBusy) onClose?.()
  })

  useEffect(() => {
    if (!isOpen) return undefined
    const dialog = dialogRef.current
    if (!dialog) return undefined
    const previousFocus = document.activeElement
    if (openDialogs.length === 0) originalOverflow = document.body.style.overflow
    openDialogs.push(dialog)
    const controls = () => [...dialog.querySelectorAll(FOCUSABLE)]
      .filter((element) => element.getClientRects().length > 0)
    const focusFirst = () => (dialog.querySelector('[data-dialog-initial-focus]') || controls()[0] || dialog).focus()

    document.body.style.overflow = 'hidden'
    focusFirst()
    const focusFrame = requestAnimationFrame(focusFirst)
    const handleKeyDown = (event) => {
      if (openDialogs.at(-1) !== dialog) return
      if (event.key === 'Escape') {
        event.preventDefault()
        closeDialog()
      } else if (event.key === 'Tab') {
        const elements = controls()
        const first = elements[0]
        const last = elements.at(-1)
        if (!first) {
          event.preventDefault()
          dialog.focus()
        } else if (!dialog.contains(document.activeElement)) {
          event.preventDefault()
          first.focus()
        } else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    const containFocus = (event) => {
      if (openDialogs.at(-1) === dialog && !dialog.contains(event.target)) focusFirst()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('focusin', containFocus)
    return () => {
      cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('focusin', containFocus)
      const wasTop = openDialogs.at(-1) === dialog
      const index = openDialogs.indexOf(dialog)
      if (index >= 0) openDialogs.splice(index, 1)
      if (openDialogs.length === 0) document.body.style.overflow = originalOverflow
      if (wasTop && previousFocus?.isConnected) previousFocus.focus()
    }
  }, [isOpen])

  return dialogRef
}
