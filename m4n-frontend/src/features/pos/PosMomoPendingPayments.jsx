import { useEffect, useState } from 'react'
import Button from '../../components/ui/Button.jsx'
import posMomoService from '../../services/posMomoService.js'
import { formatCurrencyVND } from '../../utils/currency.js'

export default function PosMomoPendingPayments({ onSelect }) {
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    posMomoService.recent(page)
      .then((result) => { if (active) { setData(result); setError('') } })
      .catch((err) => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [page, retry])
  const pageInfo = data?.page || data
  const rows = data?.content || []
  return (
    <details className="rounded-xl border border-border bg-white p-4">
      <summary className="cursor-pointer text-sm font-semibold text-ink">Giao dịch MoMo chưa xuất hóa đơn</summary>
      <div className="mt-3 space-y-3" aria-busy={loading}>
        {loading && <p role="status" className="text-sm text-muted">Đang tải giao dịch…</p>}
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        {!loading && !error && rows.length === 0 && <p className="text-sm text-muted">Không có giao dịch.</p>}
        {!error && rows.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 text-sm">
          <div className="min-w-0 flex-1"><p className="font-medium">{formatCurrencyVND(item.amount)}</p><p className="mt-1 text-xs text-muted">{item.message}</p><p className="mt-1 break-all font-mono text-xs text-muted">{item.id}</p></div>
          <Button variant="secondary" onClick={() => onSelect(item.id)}>Xem giao dịch</Button>
        </div>)}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" disabled={loading} onClick={() => { setLoading(true); setRetry((n) => n + 1) }}>Tải lại</Button>
          {pageInfo?.totalPages > 1 && <>
            <Button variant="ghost" disabled={loading || page === 0} onClick={() => { setLoading(true); setPage((n) => n - 1) }}>Trước</Button>
            <span className="text-xs">Trang {page + 1} / {pageInfo.totalPages}</span>
            <Button variant="ghost" disabled={loading || page + 1 >= pageInfo.totalPages} onClick={() => { setLoading(true); setPage((n) => n + 1) }}>Sau</Button>
          </>}
        </div>
      </div>
    </details>
  )
}
