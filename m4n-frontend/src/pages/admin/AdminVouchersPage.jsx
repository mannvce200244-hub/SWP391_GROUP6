import { useState, useEffect, useRef } from 'react'
import voucherService from '../../services/voucherService.js'
import useToast from '../../components/ui/useToast.js'
import { TicketPercent, Plus, Search, Pencil, Trash2, X, CircleCheck } from 'lucide-react'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import useDialogFocus from '../../hooks/useDialogFocus.js'
import Pagination from '../../features/catalog/Pagination.jsx'

function formatRate(rate) {
  if (!rate && rate !== 0) return '—'
  return `${Number((Number(rate) * 100).toFixed(2))}%`
}

function formatCurrency(amount) {
  if (!amount && amount !== 0) return '—'
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫'
}

function toLocalDateTimeInput(value) {
  if (!value) return ''
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function formatDateTime(value) {
  return value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : 'Không giới hạn'
}

function getVoucherState(voucher) {
  const now = Date.now()
  if (!voucher.isActive) return 'INACTIVE'
  if (voucher.validFrom && now < new Date(voucher.validFrom).getTime()) return 'UPCOMING'
  if (voucher.validUntil && now > new Date(voucher.validUntil).getTime()) return 'EXPIRED'
  if (voucher.usageLimit != null && (voucher.usedCount || 0) >= voucher.usageLimit) return 'EXHAUSTED'
  return 'ACTIVE'
}

const VOUCHER_STATE_META = {
  ACTIVE: { label: 'Đang sử dụng', className: 'bg-[#F6F7F8] text-emerald-700 border-emerald-200' },
  UPCOMING: { label: 'Sắp diễn ra', className: 'bg-[#F6F7F8] text-sky-700 border-sky-200' },
  EXPIRED: { label: 'Đã hết hạn', className: 'bg-[#F6F7F8] text-rose-700 border-rose-200' },
  EXHAUSTED: { label: 'Hết lượt', className: 'bg-[#F6F7F8] text-rose-700 border-rose-200' },
  INACTIVE: { label: 'Đã tắt', className: 'bg-[#F6F7F8] text-zinc-600 border-zinc-200' },
}

const EMPTY_FORM = {
  code: '',
  discountRate: '',
  fixedDiscountAmount: '',
  minimumOrderValue: '',
  description: '',
  isActive: true,
  validFrom: '',
  validUntil: '',
  usageLimit: '',
  promotionType: 'MANUAL',
  minimumQuantity: '',
}

export default function AdminVouchersPage() {
  const { addToast } = useToast()
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(0)
  const [pageData, setPageData] = useState({ totalElements: 0, totalPages: 0 })
  const [refreshKey, setRefreshKey] = useState(0)

  // Form
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const editingDates = useRef(null)
  const [formError, setFormError] = useState('')
  const formRef = useDialogFocus(formOpen, () => setFormOpen(false), submitting)

  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const deletingRef = useRef(false)

  useEffect(() => {
    let active = true
    const timer = setTimeout(() => { voucherService
      .getAdminVouchers({ page, search, state: statusFilter, promotionType: typeFilter })
      .then((data) => {
        if (active) {
          const lastPage = Math.max(0, data.totalPages - 1)
          if (page > lastPage) { setPage(lastPage); return }
          setVouchers(data.content)
          setPageData(data)
          setError(null)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Không thể tải dữ liệu voucher')
          setLoading(false)
        }
      }) }, search ? 300 : 0)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [refreshKey, page, search, statusFilter, typeFilter])

  const reloadVouchers = () => {
    setLoading(true)
    setError(null)
    setRefreshKey((k) => k + 1)
  }

  const openCreate = () => {
    editingDates.current = null
    setFormError('')
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  const openEdit = (voucher) => {
    editingDates.current = { validFrom: voucher.validFrom, validUntil: voucher.validUntil }
    setFormError('')
    setEditingId(voucher.id)
    setForm({
      code: voucher.code || '',
      discountRate: voucher.discountRate != null ? Number((Number(voucher.discountRate) * 100).toFixed(2)) : '',
      fixedDiscountAmount: voucher.fixedDiscountAmount ?? '',
      minimumOrderValue: voucher.minimumOrderValue ?? '',
      description: voucher.description || '',
      isActive: voucher.isActive ?? true,
      validFrom: toLocalDateTimeInput(voucher.validFrom),
      validUntil: toLocalDateTimeInput(voucher.validUntil),
      usageLimit: voucher.usageLimit ?? '',
      promotionType: voucher.promotionType || 'MANUAL',
      minimumQuantity: voucher.minimumQuantity ?? '',
    })
    setFormOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submittingRef.current) return
    const rate = Number(form.discountRate)
    const minimum = Number(form.minimumOrderValue)
    const quantity = Number(form.minimumQuantity)
    const limit = Number(form.usageLimit)
    let message = ''
    if (!form.code.trim() || form.code.trim().length > 50) message = 'Mã chương trình cần từ 1 đến 50 ký tự.'
    else if (form.promotionType !== 'SHIPPING' && (!/^\d+(\.\d{1,2})?$/.test(String(form.discountRate)) || !Number.isFinite(rate) || rate < 0 || rate > 100)) message = 'Tỷ lệ giảm giá phải từ 0 đến 100%, tối đa 2 chữ số thập phân.'
    else if (form.promotionType === 'SHIPPING' && (!/^\d+$/.test(String(form.fixedDiscountAmount)) || Number(form.fixedDiscountAmount) <= 0 || Number(form.fixedDiscountAmount) > 9999999999999)) message = 'Tiền giảm ship phải là số nguyên dương, tối đa 9.999.999.999.999đ.'
    else if (!/^\d+(\.\d{1,2})?$/.test(String(form.minimumOrderValue)) || !Number.isFinite(minimum) || minimum < 0 || minimum > 9999999999999.99) message = 'Đơn tối thiểu không âm, tối đa 9.999.999.999.999,99đ và 2 chữ số thập phân.'
    else if (form.description.trim().length > 255) message = 'Mô tả tối đa 255 ký tự.'
    else if (form.minimumQuantity !== '' && (!Number.isInteger(quantity) || quantity < 1 || quantity > 2147483647)) message = 'Số lượng tối thiểu phải là số nguyên dương trong giới hạn hệ thống.'
    else if (form.usageLimit !== '' && (!Number.isInteger(limit) || limit < 1 || limit > 2147483647)) message = 'Số lượt sử dụng phải là số nguyên dương trong giới hạn hệ thống.'
    else if (form.validFrom && form.validUntil && new Date(form.validUntil) <= new Date(form.validFrom)) message = 'Thời gian kết thúc phải sau thời gian bắt đầu.'
    if (message) { setFormError(message); return }
    setFormError('')
    submittingRef.current = true
    setSubmitting(true)
    try {
      if (editingId) {
        const payload = { ...form }
        for (const field of ['validFrom', 'validUntil']) {
          if (form[field] === toLocalDateTimeInput(editingDates.current?.[field])) payload[field] = editingDates.current?.[field] || ''
        }
        await voucherService.updateVoucher(editingId, payload)
        addToast({ message: 'Đã cập nhật voucher.', type: 'success' })
      } else {
        await voucherService.createVoucher(form)
        addToast({ message: 'Đã tạo voucher mới.', type: 'success' })
      }
      setFormOpen(false)
      setForm(EMPTY_FORM)
      setEditingId(null)
      reloadVouchers()
    } catch (err) {
      setFormError(err.message || 'Không thể lưu chương trình. Vui lòng thử lại.')
      addToast({ message: err.message || 'Thao tác thất bại.', type: 'error' })
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || deletingRef.current) return
    deletingRef.current = true
    setDeleting(true)
    try {
      await voucherService.deleteVoucher(deleteTarget.id)
      addToast({ message: `Đã xóa voucher "${deleteTarget.code}".`, type: 'success' })
      setDeleteTarget(null)
      reloadVouchers()
    } catch (err) {
      addToast({ message: err.message || 'Không thể xóa voucher.', type: 'error' })
    } finally {
      deletingRef.current = false
      setDeleting(false)
    }
  }

  const filtered = vouchers

  if (error && !loading) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-rose-600 mb-3">{error}</p>
        <button type="button" onClick={reloadVouchers} className="px-4 py-2 text-sm font-medium rounded-lg bg-[#F6F7F8] hover:bg-[#E3E6E8] text-[#17191B] border border-[#E3E6E8] transition-colors cursor-pointer">Thử lại</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#17191B]">Quản lý Voucher</h2>
          <p className="text-sm text-secondary mt-0.5">{pageData.totalElements} chương trình phù hợp</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-lg bg-[#A62F25] text-white hover:bg-[#84231D] transition-colors cursor-pointer"
        >
          <Plus size={16} />
          Tạo chương trình
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-full max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" maxLength={200} aria-label="Tìm chương trình khuyến mãi" name="promotionSearch" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); setLoading(true) }} placeholder="Tìm theo mã hoặc mô tả…" className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#E3E6E8] bg-white text-sm text-[#17191B] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#A62F25]/15 focus:border-[#A62F25]/40 transition-colors" />
        </div>
        <select aria-label="Lọc trạng thái chương trình" name="promotionStatus" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); setLoading(true) }} className="min-w-44 px-3 py-2.5 rounded-lg border border-[#E3E6E8] bg-white text-sm text-[#17191B]">
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang sử dụng</option>
          <option value="UPCOMING">Sắp diễn ra</option>
          <option value="EXPIRED">Đã hết hạn</option>
          <option value="EXHAUSTED">Hết lượt</option>
          <option value="INACTIVE">Đã tắt</option>
        </select>
        <select aria-label="Lọc loại chương trình" value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); setPage(0); setLoading(true) }} className="min-h-11 px-3 rounded-lg border border-border bg-white text-sm"><option value="">Tất cả loại</option><option value="MANUAL">Voucher giá</option><option value="AUTOMATIC_ORDER">Tự động theo đơn</option><option value="SHIPPING">Voucher ship</option></select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-sm text-secondary">Đang tải voucher…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-[#E3E6E8]">
          <TicketPercent size={40} className="mx-auto text-zinc-300 mb-3" />
          <p className="text-sm text-secondary">{search ? 'Không tìm thấy voucher phù hợp.' : 'Chưa có voucher nào.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E3E6E8] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E3E6E8] bg-[#F6F7F8]">
                  <th className="text-left px-4 py-3 font-semibold text-[#17191B]">Mã Voucher</th>
                  <th className="text-center px-4 py-3 font-semibold text-[#17191B]">Giảm</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#17191B]">Đơn tối thiểu</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#17191B]">Thời gian</th>
                  <th className="text-center px-4 py-3 font-semibold text-[#17191B]">Lượt dùng</th>
                  <th className="text-center px-4 py-3 font-semibold text-[#17191B]">Trạng thái</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#17191B]">Mô tả</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#17191B]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((voucher) => (
                  <tr key={voucher.id} className="border-b border-[#F2F4F5] hover:bg-[#F6F7F8]/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-[#17191B]"><strong className="font-mono">{voucher.code}</strong><div className="mt-1 text-muted">{voucher.promotionType === 'AUTOMATIC_ORDER' ? 'Tự động' : voucher.promotionType === 'SHIPPING' ? 'Voucher ship' : 'Voucher nhập tay'}{voucher.minimumQuantity ? ` · Tối thiểu ${voucher.minimumQuantity} sản phẩm` : ''}</div></td>
                    <td className="px-4 py-3 text-center font-semibold text-[#A62F25]">{voucher.promotionType === 'SHIPPING' ? formatCurrency(voucher.fixedDiscountAmount) : formatRate(voucher.discountRate)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-secondary">{formatCurrency(voucher.minimumOrderValue)}</td>
                    <td className="px-4 py-3 text-xs text-secondary whitespace-nowrap">{formatDateTime(voucher.validFrom)}<br />đến {formatDateTime(voucher.validUntil)}</td>
                    <td className="px-4 py-3 text-center tabular-nums text-secondary">{voucher.usedCount || 0}/{voucher.usageLimit ?? '∞'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${VOUCHER_STATE_META[getVoucherState(voucher)].className}`}>
                        {getVoucherState(voucher) === 'ACTIVE' && <CircleCheck size={11} />}
                        {VOUCHER_STATE_META[getVoucherState(voucher)].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-secondary text-xs max-w-[200px] truncate">{voucher.description || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button type="button" aria-label="Sửa" title="Sửa" onClick={() => openEdit(voucher)} className="p-1.5 rounded-lg text-zinc-400 hover:text-[#17191B] hover:bg-[#F6F7F8] transition-colors cursor-pointer"><Pencil size={15} /></button>
                        <button type="button" aria-label="Xóa" title="Xóa" onClick={() => setDeleteTarget(voucher)} className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-[#F6F7F8] transition-colors cursor-pointer"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {!loading && !error && <Pagination currentPage={page + 1} totalPages={pageData.totalPages} onPageChange={(next) => { setPage(next - 1); setLoading(true) }} />}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => { if (!submitting) setFormOpen(false) }} aria-hidden="true" />
          <form ref={formRef} role="dialog" aria-modal="true" aria-labelledby="promotion-form-title" tabIndex={-1} onSubmit={handleSubmit} className="relative bg-white rounded-2xl border border-[#E3E6E8] shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 id="promotion-form-title" className="text-lg font-bold text-[#17191B]">{editingId ? 'Sửa chương trình' : 'Tạo chương trình giảm giá'}</h3>
              <button type="button" aria-label="Đóng hộp thoại" disabled={submitting} onClick={() => setFormOpen(false)} className="p-1 rounded-lg hover:bg-[#F6F7F8] cursor-pointer"><X size={18} className="text-zinc-400" /></button>
            </div>
            {formError && <p role="alert" className="text-sm text-danger">{formError}</p>}
            <fieldset disabled={submitting} className="contents">
            <div>
              <label htmlFor="promotion-type" className="block text-sm font-medium mb-1">Cách áp dụng</label>
              <select id="promotion-type" name="promotionType" value={form.promotionType} onChange={(event) => setForm((current) => ({ ...current, promotionType: event.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm">
                <option value="MANUAL">Voucher nhập tay</option>
                <option value="AUTOMATIC_ORDER">Khuyến mãi tự động theo đơn</option>
                <option value="SHIPPING">Voucher giảm phí vận chuyển</option>
              </select>
              <p className="mt-1 text-xs text-muted">Voucher giá và ưu đãi đơn lớn được cộng dồn. Voucher ship giảm riêng phí vận chuyển, không áp dụng POS. Loại chương trình đã sử dụng không thể đổi.</p>
            </div>
            <div>
              <label htmlFor="promotion-minimum-quantity" className="block text-sm font-medium mb-1">Số lượng tối thiểu (tùy chọn)</label>
              <input id="promotion-minimum-quantity" name="minimumQuantity" type="number" min="1" max="2147483647" step="1" value={form.minimumQuantity} onChange={(event) => setForm((current) => ({ ...current, minimumQuantity: event.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm" />
              <p className="mt-1 text-xs text-muted">Nếu có cả giá trị và số lượng tối thiểu, đơn cần đạt cả hai điều kiện.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="promotion-validFrom" className="block text-sm font-medium text-[#17191B] mb-1">Bắt đầu</label>
                <input type="datetime-local" id="promotion-validFrom" name="validFrom" value={form.validFrom} onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-[#E3E6E8] bg-white text-sm" />
              </div>
              <div>
                <label htmlFor="promotion-validUntil" className="block text-sm font-medium text-[#17191B] mb-1">Kết thúc</label>
                <input type="datetime-local" id="promotion-validUntil" name="validUntil" value={form.validUntil} min={form.validFrom || undefined} onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-[#E3E6E8] bg-white text-sm" />
              </div>
            </div>
            <div>
              <label htmlFor="promotion-usageLimit" className="block text-sm font-medium text-[#17191B] mb-1">Số lượt sử dụng tối đa</label>
              <input type="number" min="1" step="1" id="promotion-usageLimit" name="usageLimit" max="2147483647" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} placeholder="Để trống nếu không giới hạn" className="w-full px-3 py-2.5 rounded-lg border border-[#E3E6E8] bg-white text-sm" />
            </div>
            <div>
              <label htmlFor="promotion-code" className="block text-sm font-medium text-[#17191B] mb-1">Mã voucher</label>
              <input type="text" id="promotion-code" name="code" required maxLength={50} autoComplete="off" spellCheck={false} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} disabled={!!editingId} placeholder="VD: SALE50" className="w-full px-3 py-2.5 rounded-lg border border-[#E3E6E8] bg-white text-sm text-[#17191B] disabled:bg-[#F6F7F8] disabled:text-secondary focus:outline-none focus:ring-2 focus:ring-[#A62F25]/15 focus:border-[#A62F25]/40" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {form.promotionType === 'SHIPPING' ? <div>
                <label htmlFor="promotion-fixedDiscountAmount" className="block text-sm font-medium text-ink mb-1">Tiền giảm ship (đ)</label>
                <input id="promotion-fixedDiscountAmount" name="fixedDiscountAmount" type="number" required min="1" max="9999999999999" step="1" value={form.fixedDiscountAmount} onChange={(event) => setForm((current) => ({ ...current, fixedDiscountAmount: event.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm" />
              </div> : <div>
                <label htmlFor="promotion-discountRate" className="block text-sm font-medium text-[#17191B] mb-1">Giảm giá (%)</label>
                <input type="number" min="0" max="100" id="promotion-discountRate" name="discountRate" required step="0.01" value={form.discountRate} onChange={(e) => setForm((f) => ({ ...f, discountRate: e.target.value }))} placeholder="10" className="w-full px-3 py-2.5 rounded-lg border border-[#E3E6E8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A62F25]/15 focus:border-[#A62F25]/40" />
              </div>}
              <div>
                <label htmlFor="promotion-minimumOrderValue" className="block text-sm font-medium text-[#17191B] mb-1">Đơn tối thiểu</label>
                <input type="number" min="0" id="promotion-minimumOrderValue" name="minimumOrderValue" required value={form.minimumOrderValue} onChange={(e) => setForm((f) => ({ ...f, minimumOrderValue: e.target.value }))} placeholder="500000" className="w-full px-3 py-2.5 rounded-lg border border-[#E3E6E8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A62F25]/15 focus:border-[#A62F25]/40" />
              </div>
            </div>
            <div>
              <label htmlFor="promotion-description" className="block text-sm font-medium text-[#17191B] mb-1">Mô tả</label>
              <input type="text" id="promotion-description" name="description" maxLength={255} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Mô tả ngắn về voucher…" className="w-full px-3 py-2.5 rounded-lg border border-[#E3E6E8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A62F25]/15 focus:border-[#A62F25]/40" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="voucher-active" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="rounded border-[#E3E6E8]" />
              <label htmlFor="voucher-active" className="text-sm text-[#17191B]">Đang hoạt động</label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" disabled={submitting} onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg bg-white border border-[#E3E6E8] text-[#17191B] hover:bg-[#F6F7F8] transition-colors cursor-pointer">Hủy</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#A62F25] text-white hover:bg-[#84231D] disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer">
                {submitting ? 'Đang lưu…' : (editingId ? 'Cập nhật' : 'Tạo chương trình')}
              </button>
            </div>
            </fieldset>
          </form>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          isOpen
          title="Xóa voucher"
          description={`Bạn có chắc muốn xóa voucher "${deleteTarget.code}"?`}
          confirmLabel="Xóa"
          variant="danger"
          isLoading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
