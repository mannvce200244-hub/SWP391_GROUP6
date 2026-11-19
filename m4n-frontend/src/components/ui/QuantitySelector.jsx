import { useId, useRef, useState } from 'react'

export default function QuantitySelector({ disabled = false, max = 99, min = 1, onChange, value = 1, label = 'Số lượng sản phẩm' }) {
  const [draft, setDraft] = useState(null)
  const [message, setMessage] = useState('')
  const hintId = useId()
  const cancelled = useRef(false)
  const limit = Math.max(0, Number.isSafeInteger(max) ? max : 99)
  const commit = (next) => {
    if (disabled || limit < min) return
    const bounded = Math.max(min, Math.min(limit, next))
    setDraft(null)
    if (bounded !== value) onChange(bounded)
  }
  return (
    <div className="min-w-0">
      <div className="inline-flex h-11 items-center overflow-hidden rounded-lg border border-control-border bg-white">
        <button type="button" aria-label={`Giảm ${label.toLowerCase()}`} disabled={disabled || value <= min}
          onClick={() => commit(value - 1)}
          className="h-11 w-11 shrink-0 cursor-pointer text-ink hover:bg-surface-secondary disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-brand">−</button>
        <input type="text" inputMode="numeric" autoComplete="off" name="quantity" aria-label={label}
          aria-describedby={message ? hintId : undefined} disabled={disabled || limit < min}
          value={draft ?? String(value)}
          onFocus={() => { cancelled.current = false; setDraft(String(value)) }}
          onChange={(event) => {
            const raw = event.target.value
            if (!/^\d*$/.test(raw)) return
            if (raw === '') { setDraft(''); setMessage(''); return }
            const parsed = Number(raw)
            if (!Number.isSafeInteger(parsed) || parsed > limit) {
              setDraft(String(limit))
              setMessage(`Chỉ còn ${limit} sản phẩm.`)
            } else { setDraft(raw); setMessage('') }
          }}
          onBlur={() => {
            if (cancelled.current) { cancelled.current = false; setDraft(null); setMessage(''); return }
            commit(draft === null || draft === '' ? value : Number(draft))
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur() }
            if (event.key === 'Escape') { cancelled.current = true; event.currentTarget.blur() }
          }}
          className="h-11 w-12 border-x border-border bg-white text-center text-sm font-semibold tabular-nums text-ink focus-visible:outline-2 focus-visible:outline-brand" />
        <button type="button" aria-label={`Tăng ${label.toLowerCase()}`} disabled={disabled || value >= limit}
          onClick={() => commit(value + 1)}
          className="h-11 w-11 shrink-0 cursor-pointer text-ink hover:bg-surface-secondary disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-brand">+</button>
      </div>
      {message && <p id={hintId} role="status" className="mt-1 text-xs text-danger">{message}</p>}
    </div>
  )
}
