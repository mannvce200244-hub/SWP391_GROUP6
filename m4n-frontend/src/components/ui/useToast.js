import { useContext } from 'react'
import { ToastContext } from './ToastContext.js'

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    return {
      addToast: () => {},
      removeToast: () => {},
    }
  }
  return context
}

export default useToast
