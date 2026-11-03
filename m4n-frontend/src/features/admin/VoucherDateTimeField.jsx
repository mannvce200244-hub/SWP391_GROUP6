import { useRef } from 'react'
import { formatVoucherDateTime } from './voucherPeriod.js'

export default function VoucherDateTimeField({ name, label, hint, value, onChange, invalid, describedBy, minimum }) {
  const inputRef = useRef(null)
  const id = `promotion-${name}`
  const inputClass = 'w-full min-w-0 min-h-11 px-3 py-2.5 rounded-lg border border-border bg-white text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'
  const summary = formatVoucherDateTime(value)
  const minimumSummary = formatVoucherDateTime(minimum)

  return (
    <div className="min-w-0 rounded-xl border border-border bg-white p-3">
      <label htmlFor={id} className="block mb-2 text-sm font-semibold text-ink">{label} áp dụng</label>
      <input
        ref={inputRef} id={id} name={name} type="datetime-local" lang="vi-VN" step="60" autoComplete="off"
        value={value} onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid || undefined} aria-describedby={`${id}-selected${minimumSummary ? ` ${id}-minimum` : ''} ${describedBy || ''}`} className={`${inputClass} tabular-nums`}
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p id={`${id}-selected`} className="text-xs leading-relaxed text-secondary">{summary || hint}</p>
        {value && <button type="button" aria-label={`Xóa thời gian ${label.toLocaleLowerCase('vi-VN')}`} onClick={() => { onChange(''); inputRef.current?.focus() }} className="shrink-0 min-h-11 px-2 -my-1 text-xs font-medium text-secondary hover:text-ink hover:bg-surface-secondary rounded-lg focus-visible:outline-2 focus-visible:outline-brand cursor-pointer">Xóa</button>}
      </div>
      {minimumSummary && <p id={`${id}-minimum`} aria-live="polite" className="mt-2 text-xs leading-relaxed text-ink">Sớm nhất: <strong>{minimumSummary}</strong></p>}
    </div>
  )
}
