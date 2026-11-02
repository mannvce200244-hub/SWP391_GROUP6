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
  const [completedRequestKey, setCompletedRequestKey] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [draftTarget, setDraftTarget] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null)

  // Bulk Restock Request Mode (Ý 2)
  const [restockMode, setRestockMode] = useState(false)
  const [selectedRestockItems, setSelectedRestockItems] = useState({})
  const [warehouseEmail, setWarehouseEmail] = useState('kho@m4n.vn')
  const [restockNote, setRestockNote] = useState('')
  const [sentEmailPreview, setSentEmailPreview] = useState(null)

  const { view, page, type, status, keyword, product } = filters
  const requestKey = JSON.stringify([view, page, type, status, keyword, product?.id, refreshKey])
  const pending = loading || completedRequestKey !== requestKey

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
      } finally { if (active) { setCompletedRequestKey(requestKey); setLoading(false) } }
    }
    load()
    return () => { active = false }
  }, [view, page, type, status, keyword, product, requestKey])

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

  const toggleRestockItem = (item) => {
    setSelectedRestockItems((prev) => {
      const next = { ...prev }
      if (next[item.productId]) {
        delete next[item.productId]
      } else {
        next[item.productId] = {
          productId: item.productId,
          code: item.productCode,
          name: item.productName,
          currentStock: item.quantity || 0,
          requestedQuantity: 10,
        }
      }
      return next
    })
  }

  const updateRestockQuantity = (item, value) => {
    const parsed = Math.max(1, Math.min(9999, Number(value) || 1))
    setSelectedRestockItems((prev) => ({
      ...prev,
      [item.productId]: {
        productId: item.productId,
        code: item.productCode,
        name: item.productName,
        currentStock: item.quantity || 0,
        requestedQuantity: parsed,
      },
    }))
  }

  const toggleSelectAllPage = () => {
    const allSelected = items.length > 0 && items.every((item) => Boolean(selectedRestockItems[item.productId]))
    setSelectedRestockItems((prev) => {
      const next = { ...prev }
      if (allSelected) {
        items.forEach((item) => { delete next[item.productId] })
      } else {
        items.forEach((item) => {
          if (!next[item.productId]) {
            next[item.productId] = {
              productId: item.productId,
              code: item.productCode,
              name: item.productName,
              currentStock: item.quantity || 0,
              requestedQuantity: 10,
            }
          }
        })
      }
      return next
    })
  }

  const handleSendRestockEmail = () => {
    const selectedList = Object.values(selectedRestockItems)
    if (selectedList.length === 0) {
      addToast({ type: 'error', message: 'Vui lòng tích chọn ít nhất 1 sản phẩm cần nhập thêm hàng.' })
      return
    }
    const emailTrimmed = warehouseEmail.trim()
    if (!emailTrimmed || !emailTrimmed.includes('@')) {
      addToast({ type: 'error', message: 'Vui lòng nhập địa chỉ email nhân viên kho hợp lệ.' })
      return
    }

    const totalQty = selectedList.reduce((sum, it) => sum + Number(it.requestedQuantity || 0), 0)
    const subject = `[M4N Kho] Yêu cầu nhập thêm hàng (${selectedList.length} mã nhạc cụ - Tổng ${totalQty} SP)`
    const body = [
      'Kính gửi Bộ phận Kho / Cung ứng M4N,',
      '',
      'Hệ thống Quản trị M4N gửi yêu cầu nhập bổ sung tồn kho cho các nhạc cụ sau:',
      '',
      ...selectedList.map(
        (it, idx) =>
          `${idx + 1}. [${it.code}] ${it.name} — Tồn hiện tại: ${it.currentStock} | Số lượng yêu cầu nhập thêm: +${it.requestedQuantity}`
      ),
      '',
      `Tổng số mã sản phẩm: ${selectedList.length}`,
      `Tổng số lượng yêu cầu nhập: ${totalQty} sản phẩm`,
      restockNote.trim() ? `Ghi chú từ Quản trị: ${restockNote.trim()}` : '',
      '',
      'Trân trọng,',
      'Ban Quản trị Hệ thống M4N',
    ].filter(Boolean).join('\n')

    setSentEmailPreview({ to: emailTrimmed, subject, body })
    addToast({
      type: 'success',
      message: `Đã khởi tạo phiếu yêu cầu nhập thêm ${selectedList.length} sản phẩm gửi tới ${emailTrimmed}.`,
    })
  }

  const selectedRestockList = Object.values(selectedRestockItems)
  const totalRequestedRestockQty = selectedRestockList.reduce((sum, it) => sum + Number(it.requestedQuantity || 0), 0)

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink">Kho hàng</h2>
          <p className="mt-1 text-sm text-muted">Nhập thêm hàng theo lô, kiểm nhận QC và theo dõi chi phí thực nhận. Tạo sản phẩm mới không làm tăng tồn kho.</p>
        </div>
        {view === 'balance' && (
          <Button
            variant={restockMode ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => {
              setRestockMode((prev) => !prev)
              setSentEmailPreview(null)
            }}
          >
            {restockMode ? 'Đóng chế độ yêu cầu nhập hàng' : 'Yêu cầu nhập thêm hàng'}
          </Button>
        )}
      </header>
      <nav aria-label="Các mục quản lý kho" className="flex flex-wrap gap-2">
        {VIEWS.map((item) => <Button key={item.id} variant="secondary" size="sm" aria-current={view === item.id ? 'page' : undefined}
          className={view === item.id ? 'border-brand text-brand font-semibold' : ''} onClick={() => changeView(item.id)}>{item.label}</Button>)}
      </nav>

      {view === 'balance' && restockMode && (
        <div className="rounded-xl border border-brand bg-white p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-ink">Tích chọn sản phẩm & Gửi mail yêu cầu nhập thêm cho nhân viên kho</h3>
              <p className="text-xs text-muted">Đã chọn <strong>{selectedRestockList.length}</strong> sản phẩm · Tổng số lượng yêu cầu: <strong>{totalRequestedRestockQty}</strong></p>
            </div>
            {selectedRestockList.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedRestockItems({})}>
                Bỏ chọn tất cả
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <Input
              id="inventory-warehouse-email"
              label="Email nhân viên kho"
              type="email"
              value={warehouseEmail}
              onChange={(e) => setWarehouseEmail(e.target.value)}
              placeholder="kho@m4n.vn"
            />
            <Input
              id="inventory-restock-note"
              label="Ghi chú yêu cầu"
              value={restockNote}
              onChange={(e) => setRestockNote(e.target.value)}
              placeholder="Ghi chú đợt nhập hàng…"
            />
            <Button onClick={handleSendRestockEmail} disabled={selectedRestockList.length === 0}>
              Gửi mail yêu cầu nhập thêm
            </Button>
          </div>
          {sentEmailPreview && (
            <div className="rounded-lg border border-border bg-[#F6F7F8] p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span>Nội dung gửi tới: <strong>{sentEmailPreview.to}</strong></span>
                <a
                  href={`mailto:${encodeURIComponent(sentEmailPreview.to)}?subject=${encodeURIComponent(sentEmailPreview.subject)}&body=${encodeURIComponent(sentEmailPreview.body)}`}
                  className="font-semibold text-brand underline"
                >
                  Mở ứng dụng Mail để gửi
                </a>
              </div>
              <pre className="text-xs bg-white p-2.5 rounded border border-border whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">
                {sentEmailPreview.body}
              </pre>
            </div>
          )}
        </div>
      )}

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
      <section className="rounded-xl border border-border bg-white overflow-hidden" aria-label={VIEWS.find((item) => item.id === view).label} aria-busy={pending}>
        {pending ? <LoadingState message="Đang tải dữ liệu kho…" /> : error ? <ErrorState message={error} onRetry={reload} />
          : items.length === 0 ? <EmptyState title="Không có dữ liệu phù hợp" message={view === 'balance' ? 'Thử đổi từ khóa hoặc trạng thái kho.' : 'Thử đổi bộ lọc. Phiếu mới và biến động kho sẽ xuất hiện tại đây.'} />
            : view === 'balance' ? (
              <InventoryBalanceTable
                items={items}
                onDraft={setDraftTarget}
                onHistory={historyFor}
                restockMode={restockMode}
                selectedRestockItems={selectedRestockItems}
                onToggleRestockItem={toggleRestockItem}
                onUpdateRestockQuantity={updateRestockQuantity}
                onToggleSelectAllPage={toggleSelectAllPage}
              />
            )
              : view === 'documents' ? <StockDocumentsTable items={items} onConfirm={setConfirmTarget} onHistory={historyFor} /> : <InventoryMovementsTable items={items} />}
        {!pending && !error && items.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
          <p className="text-xs text-muted tabular-nums">{totalElements.toLocaleString('vi-VN')} bản ghi · Trang {page + 1} / {totalPages}</p>
          <div className="flex gap-2"><Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}>Trước</Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages - 1} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Sau</Button></div>
        </div>}
      </section>
      {draftTarget && <StockDraftDialog product={draftTarget} onClose={() => setDraftTarget(null)} onCreated={created} />}
      {confirmTarget && <StockConfirmationDialog document={confirmTarget} onClose={() => setConfirmTarget(null)} onConfirmed={confirmed}
        onStale={() => { setConfirmTarget(null); reload(); addToast({ type: 'error', message: 'Phiếu đã được cập nhật bởi người khác. Danh sách đã được tải lại.' }) }} />}
    </div>
  )
}
