import { useEffect, useState } from 'react'
import { getInventory, getInventoryMovements, getStockDocuments } from '../../services/inventoryService.js'
import useToast from '../../components/ui/useToast.js'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import LoadingState from '../../components/ui/LoadingState.jsx'
import ErrorState from '../../components/ui/ErrorState.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import StockDraftDialog from '../../components/admin/StockDraftDialog.jsx'
import StockConfirmationDialog from '../../components/admin/StockConfirmationDialog.jsx'
import { InventoryBalanceTable, InventoryMovementsTable, StockDocumentsTable } from '../../components/admin/InventoryTables.jsx'

const VIEWS = [{ id: 'balance', label: 'Tồn kho hiện tại' }, { id: 'documents', label: 'Phiếu kho' }, { id: 'movements', label: 'Lịch sử biến động' }]
const STOCK_STATUSES = [['', 'Tất cả trạng thái'], ['IN_STOCK', 'Còn hàng'], ['LOW_STOCK', 'Sắp hết'], ['OUT_OF_STOCK', 'Hết hàng']]
const DOCUMENT_STATUSES = [['', 'Tất cả trạng thái'], ['DRAFT', 'Chờ xác nhận'], ['CONFIRMED', 'Đã xác nhận']]
const DOCUMENT_TYPES = [['', 'Tất cả loại phiếu'], ['RECEIPT', 'Phiếu nhập'], ['ISSUE', 'Phiếu xuất']]
const MOVEMENT_TYPES = [...DOCUMENT_TYPES, ['IMPORT', 'Nhập kho cũ'], ['ORDER_CONFIRMATION', 'Xác nhận đơn online'], ['POS_SALE', 'Bán tại quầy'], ['ORDER_CANCELLATION', 'Hoàn kho khi hủy đơn']]

function readFilters() {
  const params = new URLSearchParams(window.location.search)
  const view = VIEWS.some((item) => item.id === params.get('view')) ? params.get('view') : 'balance'
  const statuses = view === 'balance' ? STOCK_STATUSES : DOCUMENT_STATUSES
  const types = view === 'documents' ? DOCUMENT_TYPES : MOVEMENT_TYPES
  const page = Number(params.get('page'))
  const productId = Number(params.get('productId'))
  return {
    view, page: Number.isSafeInteger(page) && page >= 0 ? page : 0,
    status: statuses.some(([value]) => value === params.get('status')) ? params.get('status') : '',
    type: types.some(([value]) => value === params.get('type')) ? params.get('type') : '',
    keyword: params.get('keyword') || '',
    product: Number.isSafeInteger(productId) && productId > 0 ? { id: productId, name: params.get('productName') || `Sản phẩm #${productId}` } : null,
  }
}

export default function AdminInventoryPage() {
  const { addToast } = useToast()
  const [filters, setFilters] = useState(readFilters)
  const [search, setSearch] = useState(() => readFilters().keyword)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [draftTarget, setDraftTarget] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null)
  const { view, page, type, status, keyword, product } = filters

  useEffect(() => {
    const restoreFilters = () => { const next = readFilters(); setFilters(next); setSearch(next.keyword) }
    window.addEventListener('popstate', restoreFilters)
    return () => window.removeEventListener('popstate', restoreFilters)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('view', view)
    if (page) params.set('page', page)
    if (status) params.set('status', status)
    if (type && view !== 'balance') params.set('type', type)
    if (keyword && view === 'balance') params.set('keyword', keyword)
    if (product && view !== 'balance') { params.set('productId', product.id); params.set('productName', product.name) }
    window.history.replaceState(window.history.state, '', `${window.location.pathname}?${params}`)
  }, [view, page, status, type, keyword, product])

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const request = { page, size: 15, productId: product?.id, type, status }
        const response = view === 'balance' ? await getInventory({ page, size: 15, keyword, status })
          : view === 'documents' ? await getStockDocuments(request) : await getInventoryMovements(request)
        if (!active) return
        if (page > 0 && page >= response.totalPages) {
          setFilters((current) => ({ ...current, page: Math.max(0, response.totalPages - 1) }))
          return
        }
        setItems(response.content)
        setTotalPages(Math.max(1, response.totalPages))
        setTotalElements(response.totalElements)
      } catch (failure) {
        if (active) setError(failure.message || 'Không thể tải dữ liệu kho. Vui lòng thử lại.')
      } finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [view, page, type, status, keyword, product, refreshKey])

  const reload = () => setRefreshKey((current) => current + 1)
  const changeView = (next) => setFilters((current) => ({ ...current, view: next, page: 0, status: '', type: '' }))
  const historyFor = (item) => setFilters((current) => ({ ...current, view: 'movements', page: 0, type: '', status: '', product: { id: item.productId, name: item.productName } }))

  function created(document) {
    setDraftTarget(null)
    setFilters((current) => ({ ...current, view: 'documents', page: 0, type: '', status: 'DRAFT', product: { id: document.productId, name: document.productName } }))
    reload()
    addToast({ type: 'success', message: `Đã tạo phiếu #${document.id}. Phiếu đang chờ xác nhận; tồn kho chưa thay đổi.` })
  }

  function confirmed(document) {
    setConfirmTarget(null)
    reload()
    addToast({ type: 'success', message: `Đã xác nhận phiếu #${document.id}. Tồn kho: ${document.quantityBefore.toLocaleString('vi-VN')} → ${document.quantityAfter.toLocaleString('vi-VN')}.` })
  }

  return (
    <div className="space-y-6">
      <header><h2 className="text-xl font-semibold text-ink">Kho hàng</h2>
        <p className="mt-1 text-sm text-muted">Theo dõi tồn kho, xác nhận phiếu nhập/xuất và kiểm tra nguồn biến động.</p>
      </header>
      <nav aria-label="Các mục quản lý kho" className="flex flex-wrap gap-2">
        {VIEWS.map((item) => <Button key={item.id} variant="secondary" size="sm" aria-current={view === item.id ? 'page' : undefined}
          className={view === item.id ? 'border-brand text-brand font-semibold' : ''} onClick={() => changeView(item.id)}>{item.label}</Button>)}
      </nav>
      <div className="flex flex-wrap items-end gap-3">
        {view === 'balance' ? <>
          <form onSubmit={(event) => { event.preventDefault(); setFilters((current) => ({ ...current, page: 0, keyword: search.trim() })) }} className="flex items-end gap-2 flex-1 min-w-64 max-w-lg">
            <Input id="inventory-search" name="keyword" label="Tìm sản phẩm" autoComplete="off" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên hoặc mã sản phẩm…" />
            <Button variant="secondary" type="submit">Tìm</Button>
          </form>
          <div className="w-full sm:w-48"><Select id="inventory-status" name="status" label="Trạng thái kho" value={status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, page: 0 }))}>
            {STOCK_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select></div>
        </> : <>
          <div className="w-full sm:w-60"><Select id="inventory-type" name="type" label={view === 'documents' ? 'Loại phiếu' : 'Loại biến động'} value={type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value, page: 0 }))}>
            {(view === 'documents' ? DOCUMENT_TYPES : MOVEMENT_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select></div>
          {view === 'documents' && <div className="w-full sm:w-48"><Select id="document-status" name="status" label="Trạng thái phiếu" value={status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, page: 0 }))}>
            {DOCUMENT_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select></div>}
          {product && <div className="flex items-center gap-2 min-w-0 max-w-full"><p className="text-sm break-words">Sản phẩm: <strong>{product.name}</strong></p>
            <Button variant="ghost" size="sm" className="shrink-0" onClick={() => setFilters((current) => ({ ...current, product: null, page: 0 }))}>Tất cả sản phẩm</Button>
          </div>}
        </>}
        <Button variant="secondary" size="sm" onClick={reload} disabled={loading}>Làm mới</Button>
      </div>
      <section className="rounded-xl border border-border bg-white overflow-hidden" aria-label={VIEWS.find((item) => item.id === view).label} aria-busy={loading}>
        {loading ? <LoadingState message="Đang tải dữ liệu kho…" /> : error ? <ErrorState message={error} onRetry={reload} />
          : items.length === 0 ? <EmptyState title="Không có dữ liệu phù hợp" message={view === 'balance' ? 'Thử đổi từ khóa hoặc trạng thái kho.' : 'Thử đổi bộ lọc. Phiếu mới và biến động kho sẽ xuất hiện tại đây.'} />
            : view === 'balance' ? <InventoryBalanceTable items={items} onDraft={(item, documentType) => setDraftTarget({ product: item, type: documentType })} onHistory={historyFor} />
              : view === 'documents' ? <StockDocumentsTable items={items} onConfirm={setConfirmTarget} onHistory={historyFor} /> : <InventoryMovementsTable items={items} />}
        {!loading && !error && items.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
          <p className="text-xs text-muted tabular-nums">{totalElements.toLocaleString('vi-VN')} bản ghi · Trang {page + 1} / {totalPages}</p>
          <div className="flex gap-2"><Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}>Trước</Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages - 1} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Sau</Button></div>
        </div>}
      </section>
      {draftTarget && <StockDraftDialog {...draftTarget} onClose={() => setDraftTarget(null)} onCreated={created} />}
      {confirmTarget && <StockConfirmationDialog document={confirmTarget} onClose={() => setConfirmTarget(null)} onConfirmed={confirmed}
        onStale={() => { setConfirmTarget(null); reload(); addToast({ type: 'error', message: 'Phiếu đã được cập nhật bởi người khác. Danh sách đã được tải lại.' }) }} />}
    </div>
  )
}
