import { useEffect, useRef, useState } from 'react'
import pricingService from '../../services/pricingService.js'
import ShippingSettingsForm from '../../features/pricing/ShippingSettingsForm.jsx'
import ProductPromotionEditor from '../../features/pricing/ProductPromotionEditor.jsx'
import Pagination from '../../features/catalog/Pagination.jsx'
import Button from '../../components/ui/Button.jsx'
import LoadingState from '../../components/ui/LoadingState.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import ErrorState from '../../components/ui/ErrorState.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import useToast from '../../components/ui/useToast.js'

export default function AdminPricingPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [isActive, setIsActive] = useState('')
  const [retry, setRetry] = useState(0)
  const [editor, setEditor] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const pending = useRef(false)
  const { addToast } = useToast()

  useEffect(() => {
    let active = true
    pricingService.listPromotions({ page, isActive }).then((result) => {
      if (!active) return
      const lastPage = Math.max(0, result.totalPages - 1)
      if (page > lastPage) { setPage(lastPage); return }
      setData(result)
      setError('')
      setLoading(false)
    }).catch((err) => { if (active) { setError(err.message || 'Không thể tải chương trình.'); setLoading(false) } })
    return () => { active = false }
  }, [page, isActive, retry])

  const reload = () => { setLoading(true); setRetry((value) => value + 1) }
  async function remove() {
    if (pending.current || !deleteTarget) return
    pending.current = true
    setDeleting(true)
    try {
      await pricingService.deletePromotion(deleteTarget.id, deleteTarget.version)
      setDeleteTarget(null)
      addToast({ type: 'success', message: 'Đã xóa chương trình. Giá đã lưu trong đơn cũ không thay đổi.' })
      reload()
    } catch (err) {
      setDeleteTarget(null)
      addToast({ type: 'error', message: err.message || 'Không thể xóa chương trình. Tải lại danh sách và kiểm tra.' })
      reload()
    } finally { pending.current = false; setDeleting(false) }
  }

  return (
    <div className="space-y-6">
      <header><h1 className="text-2xl font-bold text-ink">Giá sản phẩm & vận chuyển</h1><p className="text-sm text-muted mt-2">Cấu hình được áp dụng khi tính đơn mới; số tiền trong đơn/hóa đơn đã tạo được giữ nguyên.</p></header>
      <ShippingSettingsForm />
      <section className="rounded-xl border border-border bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Chương trình giảm theo sản phẩm</h2><Button onClick={() => setEditor({ promotion: null })}>Tạo chương trình</Button></div>
        <p className="text-sm text-muted">Một sản phẩm chỉ áp mức giảm cao nhất của các chương trình đang trong thời hạn. Voucher và ưu đãi đơn lớn tính trên tiền hàng sau giảm này.</p>
        <label className="text-sm flex items-center gap-3">Trạng thái bật
          <select value={isActive} onChange={(event) => { setIsActive(event.target.value); setPage(0); setLoading(true) }} className="border border-border rounded-md bg-white min-h-11 px-3">
            <option value="">Tất cả</option><option value="true">Đã bật</option><option value="false">Đã tắt</option>
          </select>
        </label>
        {loading ? <LoadingState message="Đang tải chương trình…" /> : error ? <ErrorState message={error} onRetry={reload} /> : !data?.content.length ? <EmptyState title="Chưa có chương trình" message="Tạo chương trình để giảm giá theo sản phẩm." /> : <>
          <div className="overflow-x-auto"><table className="w-full text-sm text-left min-w-[640px]">
            <thead><tr className="bg-[#F6F7F8]"><th scope="col" className="p-3">Chương trình / sản phẩm</th><th scope="col" className="p-3">Mức giảm</th><th scope="col" className="p-3">Thời gian</th><th scope="col" className="p-3">Thao tác</th></tr></thead>
            <tbody>{data.content.map((item) => <tr key={item.id} className="border-b border-border">
              <td className="p-3 max-w-72 break-words"><strong>{item.name}</strong><p className="text-muted mt-1">{item.productName} · #{item.productId}</p><p className="text-xs mt-1">{item.isActive ? 'Đã bật' : 'Đã tắt'}</p></td>
              <td className="p-3 tabular-nums">{Number((Number(item.discountRate) * 100).toFixed(2))}%</td>
              <td className="p-3 text-xs">{item.validFrom ? new Date(item.validFrom).toLocaleString('vi-VN') : 'Không giới hạn bắt đầu'}<br />{item.validUntil ? new Date(item.validUntil).toLocaleString('vi-VN') : 'Không giới hạn kết thúc'}</td>
              <td className="p-3"><div className="flex gap-2"><Button variant="secondary" onClick={() => setEditor({ promotion: item })}>Sửa</Button><Button variant="quiet" onClick={() => setDeleteTarget(item)}>Xóa</Button></div></td>
            </tr>)}</tbody>
          </table></div>
          <p className="text-xs text-muted">{data.totalElements} chương trình</p>
          <Pagination currentPage={page + 1} totalPages={data.totalPages} onPageChange={(next) => { setPage(next - 1); setLoading(true) }} />
        </>}
      </section>
      {editor && <ProductPromotionEditor promotion={editor.promotion} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); addToast({ type: 'success', message: 'Đã lưu chương trình.' }); reload() }} />}
      <ConfirmDialog isOpen={Boolean(deleteTarget)} title="Xóa chương trình giảm sản phẩm?" description={deleteTarget ? `Xóa “${deleteTarget.name}”. Giá trong đơn cũ được giữ nguyên.` : ''} isLoading={deleting} onConfirm={remove} onCancel={() => setDeleteTarget(null)} confirmLabel="Xóa chương trình" />
    </div>
  )
}
