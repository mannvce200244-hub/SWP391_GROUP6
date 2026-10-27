import PosScannerDialog from '../features/pos/PosScannerDialog.jsx'
import PosReceiptDialog from '../features/pos/PosReceiptDialog.jsx'
import { useState, useEffect, useRef, useCallback } from 'react'
import useAuth from '../features/auth/useAuth.js'
import useToast from '../components/ui/useToast.js'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import usePosSalePreview from '../features/pos/usePosSalePreview.js'
import {
  searchProducts,
  lookupBarcode,
  previewSale,
  finalizeSale,
} from '../services/posService.js'
import { formatCurrencyVND } from '../utils/currency.js'
import { isValidVietnameseMobile, sanitizeVietnameseMobile, VIETNAMESE_MOBILE_ERROR } from '../utils/phone.js'
import {
  Search,
  Trash2,
  Check,
  X,
  Package,
  Store,
  Banknote,
  QrCode,
} from 'lucide-react'

function PosDashboardPage() {
  const { user } = useAuth()
  const { addToast } = useToast()

  // Catalog State
  const [catalog, setCatalog] = useState([])
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const catalogRequest = useRef(0)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)

  // Current POS Bill State
  const [billItems, setBillItems] = useState([])
  const [voucherCode, setVoucherCode] = useState('')
  const voucherPreviewVersionRef = useRef(0)
  const [voucherState, setVoucherState] = useState({
    applied: false,
    discount: 0,
    message: '',
    loading: false,
  })

  // Payment & Customer State
  const [paymentMethod, setPaymentMethod] = useState('CASH') // CASH, BANK_TRANSFER
  const [amountReceived, setAmountReceived] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [submittingSale, setSubmittingSale] = useState(false)
  const salePending = useRef(false)
  const billGeneration = useRef(0)
  const barcodePending = useRef(false)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)

  // Camera Scanner Modal State
  const [scannerOpen, setScannerOpen] = useState(false)
  // Success Modal State
  const [successSale, setSuccessSale] = useState(null)
  const salePreview = usePosSalePreview(billItems, voucherState.applied ? voucherCode.trim() : '')

  // 1. Fetch Catalog (Debounced)
  const loadCatalog = useCallback(async (keyword) => {
    const request = ++catalogRequest.current
    setLoadingCatalog(true)
    setCatalogError('')
    try {
      const res = await searchProducts(keyword)
      const data = res?.data || res
      if (request !== catalogRequest.current) return
      setCatalog(Array.isArray(data) ? data : [])
    } catch (error) {
      if (request === catalogRequest.current) setCatalogError(error.message || 'Không thể tải sản phẩm. Vui lòng thử lại.')
    } finally {
      if (request === catalogRequest.current) setLoadingCatalog(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCatalog(searchKeyword)
    }, 250)
    return () => {
      clearTimeout(timer)
      catalogRequest.current += 1
    }
  }, [searchKeyword, loadCatalog])

  // 2. Add product to Bill
  const handleAddToBill = useCallback((product) => {
    if (salePending.current || successSale) return
    voucherPreviewVersionRef.current += 1
    setVoucherState((previous) => previous.applied || previous.loading
      ? { applied: false, discount: 0, message: 'Hóa đơn đã thay đổi. Vui lòng áp dụng lại voucher.', loading: false }
      : previous)
    setBillItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id)
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          code: product.code,
          barcode: product.barcode,
          name: product.name,
          price: product.price,
          quantity: 1,
          primaryImage: product.primaryImage,
          availableQuantity: product.quantity,
        },
      ]
    })
    addToast({
      message: `Đã thêm '${product.name}' vào đơn hàng.`,
      type: 'info',
    })
  }, [addToast, successSale])

  // 3. Update quantity
  const handleUpdateQty = (productId, delta) => {
    voucherPreviewVersionRef.current += 1
    setVoucherState((previous) => previous.applied || previous.loading
      ? { applied: false, discount: 0, message: 'Hóa đơn đã thay đổi. Vui lòng áp dụng lại voucher.', loading: false }
      : previous)
    setBillItems((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const nextQty = item.quantity + delta
            return nextQty > 0 ? { ...item, quantity: nextQty } : item
          }
          return item
        })
        .filter((item) => item.quantity > 0)
    )
  }

  // 4. Remove item from Bill
  const handleRemoveItem = (item) => {
    voucherPreviewVersionRef.current += 1
    setVoucherState((previous) => previous.applied || previous.loading
      ? { applied: false, discount: 0, message: 'Hóa đơn đã thay đổi. Vui lòng áp dụng lại voucher.', loading: false }
      : previous)
    setBillItems((prev) => prev.filter((billItem) => billItem.productId !== item.productId))
    addToast({ message: `Đã xóa "${item.name}" khỏi đơn hàng.`, type: 'success' })
  }

  // 5. Clear entire Bill
  const handleClearBill = () => {
    if (billItems.length === 0) return
    billGeneration.current += 1
    salePreview.retry()
    voucherPreviewVersionRef.current += 1
    setBillItems([])
    setVoucherCode('')
    setVoucherState({ applied: false, discount: 0, message: '', loading: false })
    setAmountReceived('')
    setClearConfirmOpen(false)
    addToast({ message: 'Đã xóa toàn bộ sản phẩm khỏi đơn hàng.', type: 'success' })
  }

  // 6. Manual Barcode / SKU Submission
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault()
    const code = barcodeInput.trim()
    if (!code || barcodePending.current || salePending.current) return
    barcodePending.current = true
    const generation = billGeneration.current

    setLookupLoading(true)
    try {
      const res = await lookupBarcode(code)
      const product = res?.data || res
      if (generation !== billGeneration.current) return
      handleAddToBill(product)
      setBarcodeInput('')
    } catch (err) {
      if (generation !== billGeneration.current) return
      addToast({
        message: err.message || `Không tìm thấy sản phẩm với mã '${code}'.`,
        type: 'error',
      })
    } finally {
      barcodePending.current = false
      setLookupLoading(false)
    }
  }

  // 7. Preview & Voucher Application
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherState({ applied: false, discount: 0, message: '', loading: false })
      return
    }
    if (billItems.length === 0) {
      addToast({
        message: 'Vui lòng thêm sản phẩm vào đơn hàng trước khi áp dụng voucher.',
        type: 'error',
      })
      return
    }

    const previewVersion = ++voucherPreviewVersionRef.current
    setVoucherState((prev) => ({ ...prev, loading: true }))
    try {
      const res = await previewSale({
        items: billItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        voucherCode: voucherCode.trim(),
      })
      const data = res?.data || res
      if (previewVersion !== voucherPreviewVersionRef.current) return
      if (data.voucherApplied) {
        setVoucherState({
          applied: true,
          discount: Number(data.manualDiscountAmount) || 0,
          message: data.voucherMessage || 'Áp dụng mã giảm giá thành công!',
          loading: false,
        })
        addToast({ message: data.voucherMessage || 'Áp dụng mã giảm giá thành công!', type: 'success' })
      } else {
        setVoucherState({
          applied: false,
          discount: 0,
          message: data.voucherMessage || 'Voucher không đủ điều kiện áp dụng.',
          loading: false,
        })
        addToast({ message: data.voucherMessage || 'Voucher không đủ điều kiện.', type: 'error' })
      }
    } catch (err) {
      if (previewVersion !== voucherPreviewVersionRef.current) return
      const msg = err.message || 'Mã giảm giá không hợp lệ.'
      setVoucherState({ applied: false, discount: 0, message: msg, loading: false })
      addToast({ message: msg, type: 'error' })
    }
  }

  // Totals calculations
  const subtotal = salePreview.data?.subtotal ?? billItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
  const discountAmount = salePreview.data?.manualDiscountAmount ?? (voucherState.applied ? voucherState.discount : 0)
  const automaticDiscountAmount = salePreview.data?.automaticDiscountAmount ?? 0
  const finalAmount = salePreview.data?.finalAmount ?? Math.max(0, subtotal - discountAmount - automaticDiscountAmount)

  const numReceived = Number.parseInt(amountReceived, 10) || 0
  const amountChange = paymentMethod === 'CASH' ? Math.max(0, numReceived - finalAmount) : 0
  const cashInsufficient = paymentMethod === 'CASH' && Boolean(amountReceived) && numReceived < finalAmount

  // Automatically update amountReceived when exact cash shortcut is clicked
  const handleSetExactCash = () => {
    setAmountReceived(finalAmount.toString())
  }

  // 8. Finalize Sale
  const handleFinalizeSale = async () => {
    if (salePending.current || successSale || salePreview.loading || salePreview.error || !salePreview.data || salePreview.data.stockWarnings?.length) return
    if (billItems.length === 0) {
      addToast({ message: 'Vui lòng chọn ít nhất một nhạc cụ để thanh toán.', type: 'error' })
      return
    }

    if (paymentMethod === 'CASH') {
      if (!amountReceived || numReceived < finalAmount) {
        addToast({
          message: `Số tiền khách đưa (${formatCurrencyVND(numReceived)}) chưa đủ để thanh toán đơn hàng (${formatCurrencyVND(finalAmount)}).`,
          type: 'error',
        })
        return
      }
    }

    if (customerPhone && !isValidVietnameseMobile(customerPhone)) {
      addToast({ message: VIETNAMESE_MOBILE_ERROR, type: 'error' })
      return
    }

    salePending.current = true
    setSubmittingSale(true)
    try {
      const res = await finalizeSale({
        items: billItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        voucherCode: voucherState.applied ? voucherCode : null,
        paymentMethod,
        amountReceived: paymentMethod === 'CASH' ? numReceived : finalAmount,
        customerName,
        customerPhone,

      })
      const result = res?.data || res
      billGeneration.current += 1
      setSuccessSale(result)
      addToast({ message: `Bán hàng thành công! Hóa đơn #${result.invoiceCode}`, type: 'success' })
      // Reload catalog to reflect updated inventory in showroom
      loadCatalog(searchKeyword)
    } catch (err) {
      addToast({
        message: err.message || 'Giao dịch không thành công. Vui lòng kiểm tra lại tồn kho.',
        type: 'error',
      })
    } finally {
      salePending.current = false
      setSubmittingSale(false)
    }
  }

  // 9. Reset POS for new sale
  const handleNewSale = () => {
    billGeneration.current += 1
    salePreview.retry()
    voucherPreviewVersionRef.current += 1
    setSuccessSale(null)
    setBillItems([])
    setVoucherCode('')
    setVoucherState({ applied: false, discount: 0, message: '', loading: false })
    setAmountReceived('')
    setCustomerName('')
    setCustomerPhone('')
  }

  return (
    <div className="flex flex-col gap-4">
      <fieldset disabled={submittingSale || Boolean(successSale)} className="contents">
      {/* Top POS Action Toolbar */}
      <div className="bg-surface rounded-2xl border border-border p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Product Search */}
        <div className="relative flex-1 max-w-lg">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            name="posProductSearch"
            aria-label="Tìm nhạc cụ tại quầy"
            autoComplete="off"
            placeholder="Tìm nhạc cụ (tên, mã sản phẩm, phân loại)…"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="box-border w-full min-w-0 pl-9.5 pr-4 py-2 text-xs rounded-xl border border-border bg-canvas focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-[border-color,box-shadow] text-ink placeholder:text-muted"
          />
          {searchKeyword && (
            <button
              type="button"
              aria-label="Xóa từ khóa tìm kiếm"
              onClick={() => setSearchKeyword('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Center/Right: Fast Barcode Entry & Camera Scan Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Fast Barcode Input */}
          <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Nhập mã vạch / SKU..."
              name="barcode" aria-label="Mã vạch hoặc SKU" maxLength={100}
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-border bg-canvas focus:outline-none focus:ring-1 focus:ring-brand text-ink placeholder:text-muted w-44 font-mono"
            />
            <button
              type="submit"
              disabled={lookupLoading || !barcodeInput.trim()}
              className="px-3 py-2 rounded-xl bg-surface-secondary border border-border hover:border-brand text-xs font-bold text-ink hover:text-brand transition-colors disabled:opacity-50 cursor-pointer"
            >
              {lookupLoading ? '...' : '+ Thêm'}
            </button>
          </form>

          {/* Camera Scanner Trigger */}
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#F6F7F8] border border-emerald-300 text-emerald-700 hover:bg-[#F6F7F8] text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Quét Camera</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column POS Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Product Catalog Grid (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-ink uppercase tracking-wider">
              Danh mục nhạc cụ showroom ({catalog.length})
            </span>
            <span className="text-xs text-muted">Bấm vào nhạc cụ để thêm vào hóa đơn</span>
          </div>

          {loadingCatalog ? (
            <div className="bg-surface rounded-2xl border border-border p-12 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
              <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              <span className="text-xs text-muted">Đang tải sản phẩm showroom...</span>
            </div>
          ) : catalogError ? (
            <div role="alert" className="p-6 bg-white border border-border rounded-xl text-sm text-danger">
              <p>{catalogError}</p>
              <button type="button" onClick={() => loadCatalog(searchKeyword)} className="mt-2 underline">Thử lại</button>
            </div>
          ) : catalog.length === 0 ? (
            <div className="bg-surface rounded-2xl border border-border p-12 text-center flex flex-col items-center justify-center gap-2 shadow-xs">
              <Package size={32} className="text-muted/60" />
              <p className="text-sm font-bold text-ink">Không tìm thấy sản phẩm phù hợp</p>
              <p className="text-xs text-muted">Thử nhập từ khóa khác hoặc quét mã vạch trực tiếp.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {catalog.map((prod) => {
                const isOutOfStock = prod.quantity <= 0
                return (
                  <button
                    key={prod.id}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => handleAddToBill(prod)}
                    className={`bg-surface rounded-xl border border-border p-3 flex flex-col justify-between text-left shadow-xs hover:shadow-md hover:border-brand/60 transition-all group cursor-pointer ${
                      isOutOfStock ? 'opacity-60 cursor-not-allowed bg-canvas' : ''
                    }`}
                  >
                    <div className="flex flex-col gap-2 w-full">
                      {/* Image */}
                      <div className="w-full aspect-4/3 rounded-lg overflow-hidden bg-surface-secondary relative">
                        {prod.primaryImage ? (
                          <img
                            src={prod.primaryImage}
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted">
                            <Package size={24} />
                          </div>
                        )}
                        <span
                          className={`absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded text-xs font-semibold ${
                            prod.quantity > 5
                              ? 'bg-emerald-600/90 text-white'
                              : prod.quantity > 0
                              ? 'bg-brand text-white'
                              : 'bg-rose-600/90 text-white'
                          }`}
                        >
                          {prod.quantity > 0 ? `Còn ${prod.quantity}` : 'Hết hàng'}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex flex-col">
                        <span className="text-xs text-muted font-mono">{prod.code}</span>
                        <h4 className="text-xs font-bold text-ink line-clamp-2 leading-tight group-hover:text-brand transition-colors mt-0.5">
                          {prod.name}
                        </h4>
                      </div>
                    </div>

                    {/* Price & Add */}
                    <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-brand font-mono">
                        {formatCurrencyVND(prod.price)}
                      </span>
                      <span className="w-6 h-6 rounded-md bg-surface-secondary text-ink group-hover:bg-brand group-hover:text-white flex items-center justify-center text-xs font-bold transition-colors">
                        +
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column: Current Bill & Payment Panel (5 cols) */}
        <div className="lg:col-span-5 bg-surface rounded-2xl border border-border shadow-xs flex flex-col overflow-hidden sticky top-20">
          {/* Bill Header */}
          <div className="p-4 border-b border-border bg-surface-secondary/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Hóa đơn hiện tại</h3>
              <span className="px-2 py-0.5 rounded-full bg-brand text-white text-xs font-semibold">
                {billItems.length} món
              </span>
            </div>
            {billItems.length > 0 && (
              <button
                type="button"
                onClick={() => setClearConfirmOpen(true)}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
              >
                Xóa tất cả
              </button>
            )}
          </div>

          {/* Bill Items List */}
          <div className="p-4 flex flex-col gap-2.5 max-h-72 overflow-y-auto divide-y divide-border/60">
            {billItems.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center gap-2">
                <Store size={32} className="text-muted/40" />
                <p className="text-xs font-bold text-ink">Chưa có sản phẩm nào</p>
                <p className="text-xs text-muted">
                  Bấm vào sản phẩm bên trái hoặc quét mã vạch để thêm vào hóa đơn.
                </p>
              </div>
            ) : (
              billItems.map((item) => (
                <div key={item.productId} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {item.primaryImage ? (
                      <img
                        src={item.primaryImage}
                        alt={item.name}
                        className="w-10 h-10 rounded-lg object-cover border border-border shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-surface-secondary border border-border flex items-center justify-center text-muted shrink-0">
                        <Package size={16} />
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-ink truncate">{item.name}</span>
                      <span className="text-xs text-muted font-mono">{formatCurrencyVND(item.price)}</span>
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      aria-label={`Giảm số lượng ${item.name}`}
                      onClick={() => handleUpdateQty(item.productId, -1)}
                      className="w-6 h-6 rounded-md border border-border bg-canvas hover:bg-surface-secondary text-ink font-bold flex items-center justify-center cursor-pointer transition-colors"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-bold text-ink font-mono">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label={`Tăng số lượng ${item.name}`}
                      onClick={() => handleUpdateQty(item.productId, 1)}
                      className="w-6 h-6 rounded-md border border-border bg-canvas hover:bg-surface-secondary text-ink font-bold flex items-center justify-center cursor-pointer transition-colors"
                    >
                      +
                    </button>
                  </div>

                  {/* Line Total & Remove */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-ink font-mono min-w-16 text-right">
                      {formatCurrencyVND(item.price * item.quantity)}
                    </span>
                    <button
                      type="button"
                      aria-label={`Xóa ${item.name} khỏi hóa đơn`}
                      onClick={() => handleRemoveItem(item)}
                      className="text-muted hover:text-rose-600 transition-colors p-1 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Voucher & Pricing Section */}
          <div className="p-4 border-t border-border bg-canvas/40 flex flex-col gap-3 text-xs">
            {/* Voucher Input */}
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Mã voucher (ví dụ: M4N10)..."
                name="voucherCode" aria-label="Mã voucher" maxLength={50}
                value={voucherCode}
                onChange={(e) => {
                  voucherPreviewVersionRef.current += 1
                  setVoucherCode(e.target.value.toUpperCase())
                  setVoucherState((previous) => previous.applied || previous.loading
                    ? { applied: false, discount: 0, message: 'Mã voucher đã thay đổi. Vui lòng áp dụng lại.', loading: false }
                    : previous)
                }}
                className="min-w-0 flex-1 px-3 py-1.5 text-xs rounded-xl border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-brand font-mono uppercase text-ink placeholder:text-muted"
              />
              <button
                type="button"
                disabled={voucherState.loading || !voucherCode.trim() || billItems.length === 0}
                onClick={handleApplyVoucher}
                className="px-3 py-1.5 rounded-xl bg-surface-secondary border border-border hover:border-brand text-xs font-bold text-ink hover:text-brand transition-colors disabled:opacity-50 cursor-pointer"
              >
                {voucherState.loading ? '...' : 'Áp dụng'}
              </button>
            </div>

            {voucherState.message && (
              <span
                className={`text-xs font-semibold ${
                  voucherState.applied ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {voucherState.message}
              </span>
            )}

            {/* Financial Breakdown */}
            <div className="flex flex-col gap-1 pt-2 border-t border-border/60">
              <div className="flex justify-between text-muted">
                <span>Tạm tính:</span>
                <span className="font-mono text-ink">{formatCurrencyVND(subtotal)}</span>
              </div>
              {voucherState.applied && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Giảm giá voucher:</span>
                  <span className="font-mono">-{formatCurrencyVND(discountAmount)}</span>
                </div>
              )}
              {Number(automaticDiscountAmount) > 0 && <div className="flex justify-between text-success"><span>Khuyến mãi tự động ({salePreview.data?.automaticPromotionCode}):</span><span>-{formatCurrencyVND(automaticDiscountAmount)}</span></div>}
              {salePreview.data?.stockWarnings?.length > 0 && <div role="alert" className="text-danger space-y-1">{salePreview.data.stockWarnings.map((warning, index) => <p key={index}>{typeof warning === 'string' ? warning : warning.message}</p>)}</div>}
              {salePreview.loading && <p role="status" className="text-muted">Đang tính hóa đơn…</p>}
              {salePreview.error && <div role="alert" className="text-danger"><p>{salePreview.error}</p><button type="button" onClick={salePreview.retry} className="underline">Thử lại</button></div>}
              <div className="flex justify-between items-baseline pt-1 border-t border-border text-sm font-bold text-ink">
                <span>TỔNG CỘNG:</span>
                <span className="text-lg font-bold text-brand font-mono">{formatCurrencyVND(finalAmount)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-border/60">
              <span className="font-bold text-xs text-ink uppercase tracking-wider">Phương thức thanh toán</span>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    paymentMethod === 'CASH'
                      ? 'border-brand bg-[#F6F7F8] text-brand shadow-xs'
                      : 'border-border bg-surface text-muted hover:text-ink'
                  }`}
                >
                  <Banknote size={18} />
                  <span>Tiền mặt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('BANK_TRANSFER')}
                  className={`py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    paymentMethod === 'BANK_TRANSFER'
                      ? 'border-brand bg-[#F6F7F8] text-brand shadow-xs'
                      : 'border-border bg-surface text-muted hover:text-ink'
                  }`}
                >
                  <QrCode size={18} />
                  <span>Chuyển khoản</span>
                </button>
              </div>
            </div>

            {/* Cash Calculations */}
            {paymentMethod === 'CASH' && (
              <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-surface border border-border">
                <div className="flex items-center justify-between">
                  <label htmlFor="amount-received-input" className="font-semibold text-muted text-xs">Tiền khách đưa:</label>
                  <button
                    type="button"
                    disabled={!salePreview.data || salePreview.loading || Boolean(salePreview.error)}
                    onClick={handleSetExactCash}
                    className="text-xs font-bold text-brand hover:underline cursor-pointer"
                  >
                    [Đúng số tiền]
                  </button>
                </div>
                <input
                  id="amount-received-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="Nhập số tiền khách đưa..."
                  value={amountReceived ? new Intl.NumberFormat('vi-VN').format(Number(amountReceived)) : ''}
                  onChange={(e) => setAmountReceived(e.target.value.replace(/\D/g, '').slice(0, 15))}
                  className={`w-full px-3 py-1.5 text-xs rounded-lg border font-mono font-bold text-ink focus:outline-none focus:ring-1 focus:ring-brand ${
                    cashInsufficient ? 'border-rose-400 bg-[#F6F7F8]' : 'border-border bg-canvas'
                  }`}
                />
                <div className="flex justify-between items-center text-xs pt-1 border-t border-border/40">
                  <span className="text-muted">{cashInsufficient ? 'Tiền khách còn thiếu:' : 'Tiền thừa trả khách:'}</span>
                  <span
                    className={`font-mono font-bold ${
                      cashInsufficient ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {cashInsufficient
                      ? formatCurrencyVND(finalAmount - numReceived)
                      : formatCurrencyVND(amountChange)}
                  </span>
                </div>
              </div>
            )}

            {/* Customer Details (Optional) */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Tên khách (tùy chọn)"
                name="customerName" aria-label="Tên khách hàng (tùy chọn)" autoComplete="name" maxLength={100}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="min-w-0 flex-1 px-3 py-1.5 text-xs rounded-xl border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-brand text-ink placeholder:text-muted"
              />
              <input
                type="text"
                placeholder="SĐT khách (tùy chọn)"
                name="customerPhone" aria-label="Số điện thoại khách hàng (tùy chọn)" autoComplete="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(sanitizeVietnameseMobile(e.target.value))}
                inputMode="numeric"
                maxLength={10}
                className="w-full sm:w-36 px-3 py-1.5 text-xs rounded-xl border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-brand text-ink placeholder:text-muted font-mono"
              />
            </div>

            {/* Checkout Action Button */}
            <button
              type="button"
              disabled={submittingSale || billItems.length === 0 || cashInsufficient || salePreview.loading || Boolean(salePreview.error) || !salePreview.data || Boolean(salePreview.data?.stockWarnings?.length)}
              onClick={handleFinalizeSale}
              className="w-full mt-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {submittingSale ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang hoàn tất giao dịch...</span>
                </>
              ) : (
                <>
                  <Check size={18} />
                  <span>HOÀN TẤT THANH TOÁN ({formatCurrencyVND(finalAmount)})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Camera Scanner Modal */}
      </fieldset>
      <ConfirmDialog isOpen={clearConfirmOpen} title="Xóa toàn bộ hóa đơn đang nhập?" description="Các sản phẩm và voucher trong hóa đơn này sẽ được xóa." confirmLabel="Xóa hóa đơn" onConfirm={handleClearBill} onCancel={() => setClearConfirmOpen(false)} variant="danger" />
      {scannerOpen && <PosScannerDialog onClose={() => setScannerOpen(false)} onProduct={handleAddToBill} />}

      {successSale && <PosReceiptDialog sale={successSale} staffName={user?.fullName} onNewSale={handleNewSale} />}
    </div>
  )
}

export default PosDashboardPage
