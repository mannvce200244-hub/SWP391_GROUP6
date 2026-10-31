import { useEffect, useRef, useState } from 'react'
import Input from '../../components/ui/Input.jsx'
import Button from '../../components/ui/Button.jsx'

export default function EmailOtpField({ id, challenge, code, onCodeChange, error, disabled, isResending, onResend }) {
  const [now, setNow] = useState(Date.now)
  const inputRef = useRef(null)
  const remaining = Math.max(0, Math.ceil((Date.parse(challenge.resendAt) - now) / 1000))
  const countdown = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`
  const expired = now >= Date.parse(challenge.expiresAt)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    const refresh = () => setNow(Date.now())
    window.addEventListener('focus', refresh)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  useEffect(() => {
    inputRef.current?.focus()
  }, [challenge.challengeId])

  return (
    <section aria-label="Xác thực email" className="flex flex-col gap-3 rounded-xl border border-border bg-surface-secondary p-4">
      <p role="status" className="text-sm text-muted leading-relaxed">{expired
        ? 'Mã OTP đã hết hạn. Vui lòng gửi lại mã để tiếp tục.'
        : `${challenge.message} Mã có hiệu lực 10 phút.`}</p>
      <Input ref={inputRef} id={id} name="code" label="Mã OTP email" type="text"
        inputMode="numeric" autoComplete="one-time-code" maxLength={6} spellCheck={false}
        className="text-lg tracking-[0.3em] tabular-nums"
        value={code} error={error} disabled={disabled}
        onChange={(event) => onCodeChange(event.target.value)} required />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-muted">Chưa nhận được mã?</span>
        <Button type="button" variant="secondary" disabled={disabled || remaining > 0}
          loading={isResending} loadingLabel="Đang gửi lại…" onClick={onResend}>
          {remaining > 0 ? <span className="tabular-nums">Gửi lại sau {countdown}</span> : 'Gửi lại mã'}
        </Button>
      </div>
      <p className="text-xs text-muted leading-relaxed">Kiểm tra cả thư rác. Khi gửi lại, chỉ mã trong email mới nhất có hiệu lực.</p>
    </section>
  )
}
