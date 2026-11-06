import { useEffect, useState } from 'react'
import authService from './authService.js'
import Button from '../../components/ui/Button.jsx'

export default function GoogleLoginButton({ disabled, paymentOrderId }) {
  const [state, setState] = useState('loading')
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    authService.getGoogleLoginOptions({ signal: controller.signal })
      .then((options) => { if (!controller.signal.aborted) setState(options.available ? 'available' : 'unavailable') })
      .catch((err) => { if (err.name !== 'AbortError' && !controller.signal.aborted) setState('error') })
    return () => controller.abort()
  }, [retry])

  useEffect(() => {
    const restore = (event) => { if (event.persisted) setState((current) => current === 'redirecting' ? 'available' : current) }
    window.addEventListener('pageshow', restore)
    return () => window.removeEventListener('pageshow', restore)
  }, [])

  const startLogin = () => {
    if (disabled || state !== 'available') return
    setError('')
    setState('redirecting')
    try {
      authService.startGoogleLogin(paymentOrderId)
    } catch {
      setState('available')
      setError('Không thể mở đăng nhập Google. Vui lòng thử lại.')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-muted"><span className="h-px flex-1 bg-border" /><span>Hoặc</span><span className="h-px flex-1 bg-border" /></div>
      <Button type="button" variant="secondary" className="w-full min-h-12 bg-white" onClick={startLogin}
        disabled={disabled || state !== 'available'} loading={state === 'redirecting'} loadingLabel="Đang mở Google…"
        aria-describedby="google-login-help">
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z" fill="#4285F4"/><path d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.97-3.38.97-2.61 0-4.83-1.76-5.62-4.13H3.04v2.59A10 10 0 0 0 12 22Z" fill="#34A853"/><path d="M6.38 13.92A6 6 0 0 1 6.07 12c0-.67.11-1.32.31-1.92V7.49H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.51l3.34-2.59Z" fill="#FBBC05"/><path d="M12 5.95c1.47 0 2.78.51 3.82 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.96 5.49l3.34 2.59C7.17 7.71 9.39 5.95 12 5.95Z" fill="#EA4335"/></svg>
        Đăng nhập bằng Google
      </Button>
      <p id="google-login-help" aria-live="polite" className="text-xs leading-relaxed text-center text-secondary">
        {error || (state === 'loading' ? 'Đang kiểm tra đăng nhập Google…' : state === 'unavailable' ? 'Đăng nhập Google tạm thời chưa khả dụng.' : state === 'error' ? 'Chưa kết nối được dịch vụ đăng nhập Google.' : 'Dành cho tài khoản khách hàng.')}
      </p>
      {state === 'error' && <button type="button" disabled={disabled} onClick={() => { setState('loading'); setRetry((value) => value + 1) }} className="block mx-auto min-h-11 px-3 text-sm text-brand underline focus-visible:outline-2 focus-visible:outline-brand cursor-pointer">Thử lại</button>}
    </div>
  )
}
