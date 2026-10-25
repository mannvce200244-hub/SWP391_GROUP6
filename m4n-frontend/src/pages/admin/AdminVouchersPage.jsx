import { useState, useEffect } from 'react'
import voucherService from '../../services/voucherService.js'
import useToast from '../../components/ui/useToast.js'
import { TicketPercent, Plus, Search, Pencil, Trash2, X, CircleCheck } from 'lucide-react'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'

function formatRate(rate) {
  if (!rate && rate !== 0) return '—'
  return `${Number(rate) * 100}%`
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
  ACTIVE: { label: 'Đang sử dụng', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  UPCOMING: { label: 'Sắp diễn ra', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  EXPIRED: { label: 'Đã hết hạn', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  EXHAUSTED: { label: 'Hết lượt', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  INACTIVE: { label: 'Đã tắt', className: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
}

const EMPTY_FORM = {
  code: '',
  discountRate: '',
  minimumOrderValue: '',
  description: '',
  isActive: true,
  validFrom: '',
  validUntil: '',
  usageLimit: '',
}

export default function AdminVouchersPage() {
  const { addToast } = useToast()
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [refreshKey, setRefreshKey] = useState(0)

  // Form
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let active = true
    voucherService
      .getAdminVouchers()
      .then((data) => {
        if (active) {
          setVouchers(data || [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Không thể tải dữ liệu voucher')
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [refreshKey])

  const reloadVouchers = () => {
    setLoading(true)
    setError(null)
    setRefreshKey((k) => k + 1)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  const openEdit = (voucher) => {
    setEditingId(voucher.id)
    setForm({
      code: voucher.code || '',
      discountRate: voucher.discountRate != null ? Number(voucher.discountRate) * 100 : '',
      minimumOrderValue: voucher.minimumOrderValue ?? '',
      description: voucher.description || '',
      isActive: voucher.isActive ?? true,
      validFrom: toLocalDateTimeInput(voucher.validFrom),
      validUntil: toLocalDateTimeInput(voucher.validUntil),
      usageLimit: voucher.usageLimit ?? '',
    })
    setFormOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingId) {
        await voucherService.updateVoucher(editingId, form)
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
      addToast({ message: err.message || 'Thao tác thất bại.', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await voucherService.deleteVoucher(deleteTarget.id)
      addToast({ message: `Đã xóa voucher "${deleteTarget.code}".`, type: 'success' })
      setDeleteTarget(null)
      reloadVouchers()
    } catch (err) {
      addToast({ message: err.message || 'Không thể xóa voucher.', type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  const filtered = vouchers.filter((v) => {
    if (statusFilter !== 'ALL' && getVoucherState(v) !== statusFilter) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (v.code && v.code.toLowerCase().includes(q)) || (v.description && v.description.toLowerCase().includes(q))
  })

  if (error && !loading && vouchers.length === 0) {
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
          <p className="text-sm text-secondary mt-0.5">{vouchers.length} voucher trong hệ thống</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-lg bg-[#A62F25] text-white hover:bg-[#84231D] transition-colors cursor-pointer"
        >
          <Plus size={16} />
          Tạo voucher
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-full max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo mã hoặc mô tả…" className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#E3E6E8] bg-white text-sm text-[#17191B] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#A62F25]/15 focus:border-[#A62F25]/40 transition-colors" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="min-w-44 px-3 py-2.5 rounded-lg border border-[#E3E6E8] bg-white text-sm text-[#17191B]">
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang sử dụng</option>
          <option value="UPCOMING">Sắp diễn ra</option>
          <option value="EXPIRED">Đã hết hạn</option>
          <option value="EXHAUSTED">Hết lượt</option>
          <option value="INACTIVE">Đã tắt</option>
        </select>
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
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-[#17191B]">{voucher.code}</td>
                    <td className="px-4 py-3 text-center font-semibold text-[#A62F25]">{formatRate(voucher.discountRate)}</td>
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
                        <button type="button" title="Sửa" onClick={() => openEdit(voucher)} className="p-1.5 rounded-lg text-zinc-400 hover:text-[#17191B] hover:bg-[#F6F7F8] transition-colors cursor-pointer"><Pencil size={15} /></button>
                        <button type="button" title="Xóa" onClick={() => setDeleteTarget(voucher)} className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"><Trash2 size={15} /></button>
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
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setFormOpen(false)} aria-hidden="true" />
          <form onSubmit={handleSubmit} className="relative bg-white rounded-2xl border border-[#E3E6E8] shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#17191B]">{editingId ? 'Sửa voucher' : 'Tạo voucher mới'}</h3>
              <button type="button" onClick={() => setFormOpen(false)} className="p-1 rounded-lg hover:bg-[#F6F7F8] cursor-pointer"><X size={18} className="text-zinc-400" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#17191B] mb-1">Bắt đầu</label>
                <input type="datetime-local" value={form.validFrom} onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-[#E3E6E8] bg-white text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#17191B] mb-1">Kết thúc</label>
                <input type="datetime-local" value={form.validUntil} min={form.validFrom || undefined} onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-[#E3E6E8] bg-white text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#17191B] mb-1">Số lượt sử dụng tối đa</label>
              <input type="number" min="1" step="1" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} placeholder="Để trống nếu không giới hạn" className="w-full px-3 py-2.5 rounded-lg border border-[#E3E6E8] bg-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#17191B] mb-1">Mã voucher</label>
              <input type="text" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} disabled={!!editingId} placeholder="VD: SALE50" className="w-full px-3 py-2.5 rounded-lg border border-[#E3E6E8] bg-white text-sm text-[#17191B] disabled:bg-[#F6F7F8] disabled:text-secondary focus:outline-none focus:ring-2 focus:ring-[#A62F25]/15 focus:border-[#A62F25]/40" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#17191B] mb-1">Giảm giá (%)</label>
                <input type="number" min="1" max="100" value={form.discountRate} onChange={(e) => setForm((f) => ({ ...f, discountRate: e.target.value }))} placeholder="10" className="w-full px-3 py-2.5 rounded-lg border border-[#E3E6E8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A62F25]/15 focus:border-[#A62F25]/40" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#17191B] mb-1">Đơn tối thiểu</label>
                <input type="number" min="0" value={form.minimumOrderValue} onChange={(e) => setForm((f) => ({ ...f, minimumOrderValue: e.target.value }))} placeholder="500000" className="w-full px-3 py-2.5 rounded-lg border border-[#E3E6E8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A62F25]/15 focus:border-[#A62F25]/40" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#17191B] mb-1">Mô tả</label>
              <input type="text" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Mô tả ngắn về voucher…" className="w-full px-3 py-2.5 rounded-lg border border-[#E3E6E8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#A62F25]/15 focus:border-[#A62F25]/40" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="voucher-active" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="rounded border-[#E3E6E8]" />
              <label htmlFor="voucher-active" className="text-sm text-[#17191B]">Đang hoạt động</label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg bg-white border border-[#E3E6E8] text-[#17191B] hover:bg-[#F6F7F8] transition-colors cursor-pointer">Hủy</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#A62F25] text-white hover:bg-[#84231D] disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer">
                {submitting ? 'Đang lưu…' : (editingId ? 'Cập nhật' : 'Tạo voucher')}
              </button>
            </div>
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
