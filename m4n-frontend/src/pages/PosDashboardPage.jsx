import { useState, useEffect, useRef, useCallback } from 'react'
import useAuth from '../features/auth/useAuth.js'
import useToast from '../components/ui/useToast.js'
import {
  searchProducts,
  lookupBarcode,
  previewSale,
  finalizeSale,
  downloadInvoicePdf,
} from '../services/posService.js'
import { formatCurrencyVND } from '../utils/currency.js'
import { isValidVietnameseMobile, sanitizeVietnameseMobile, VIETNAMESE_MOBILE_ERROR } from '../utils/phone.js'
import {
  Search,
  Trash2,
  Check,
  X,
  Package,
  CircleAlert,
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
  const [searchKeyword, setSearchKeyword] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)

  // Current POS Bill State
  const [billItems, setBillItems] = useState([])
  const [voucherCode, setVoucherCode] = useState('')
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
  const [saleNotes, setSaleNotes] = useState('')
  const [submittingSale, setSubmittingSale] = useState(false)

  // Camera Scanner Modal State
  const [scannerOpen, setScannerOpen] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [scannerSupported, setScannerSupported] = useState(true)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const scanLockRef = useRef(false)

  // Success Modal State
  const [successSale, setSuccessSale] = useState(null)

  // 1. Fetch Catalog (Debounced)
  const loadCatalog = useCallback(async (keyword) => {
    setLoadingCatalog(true)
    try {
      const res = await searchProducts(keyword)
      const data = res?.data || res
      setCatalog(Array.isArray(data) ? data : [])
    } catch {
      setCatalog([])
    } finally {
      setLoadingCatalog(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCatalog(searchKeyword)
    }, 250)
    return () => clearTimeout(timer)
  }, [searchKeyword, loadCatalog])

  // 2. Add product to Bill
  const handleAddToBill = useCallback((product) => {
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
  }, [addToast])

  // 3. Update quantity
  const handleUpdateQty = (productId, delta) => {
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
    setBillItems((prev) => prev.filter((billItem) => billItem.productId !== item.productId))
    addToast({ message: `Đã xóa "${item.name}" khỏi đơn hàng.`, type: 'success' })
  }

  // 5. Clear entire Bill
  const handleClearBill = () => {
    if (billItems.length === 0) return
    setBillItems([])
    setVoucherCode('')
    setVoucherState({ applied: false, discount: 0, message: '', loading: false })
    setAmountReceived('')
    addToast({ message: 'Đã xóa toàn bộ sản phẩm khỏi đơn hàng.', type: 'success' })
  }

  // 6. Manual Barcode / SKU Submission
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault()
    const code = barcodeInput.trim()
    if (!code) return

    setLookupLoading(true)
    try {
      const res = await lookupBarcode(code)
      const product = res?.data || res
      handleAddToBill(product)
      setBarcodeInput('')
    } catch (err) {
      addToast({
        message: err?.response?.data?.message || `Không tìm thấy sản phẩm với mã '${code}'.`,
        type: 'error',
      })
    } finally {
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

    setVoucherState((prev) => ({ ...prev, loading: true }))
    try {
      const res = await previewSale({
        items: billItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        voucherCode: voucherCode.trim(),
      })
      const data = res?.data || res
      if (data.voucherApplied) {
        setVoucherState({
          applied: true,
          discount: Number(data.discount) || 0,
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
      const msg = err?.response?.data?.message || 'Mã giảm giá không hợp lệ.'
      setVoucherState({ applied: false, discount: 0, message: msg, loading: false })
      addToast({ message: msg, type: 'error' })
    }
  }

  // Totals calculations
  const subtotal = billItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
  const discountAmount = voucherState.applied ? voucherState.discount : 0
  const finalAmount = Math.max(0, subtotal - discountAmount)

  const numReceived = Number.parseInt(amountReceived, 10) || 0
  const amountChange = paymentMethod === 'CASH' ? Math.max(0, numReceived - finalAmount) : 0
  const cashInsufficient = paymentMethod === 'CASH' && amountReceived && numReceived < finalAmount

  // Automatically update amountReceived when exact cash shortcut is clicked
  const handleSetExactCash = () => {
    setAmountReceived(finalAmount.toString())
  }

  // 8. Finalize Sale
  const handleFinalizeSale = async () => {
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

    setSubmittingSale(true)
    try {
      const res = await finalizeSale({
        items: billItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        voucherCode: voucherState.applied ? voucherCode : null,
        paymentMethod,
        amountReceived: paymentMethod === 'CASH' ? numReceived : finalAmount,
        customerName,
        customerPhone,
        notes: saleNotes,
      })
      const result = res?.data || res
      setSuccessSale(result)
      addToast({ message: `Bán hàng thành công! Hóa đơn #${result.invoiceCode}`, type: 'success' })
      // Reload catalog to reflect updated inventory in showroom
      loadCatalog(searchKeyword)
    } catch (err) {
      addToast({
        message: err?.response?.data?.message || 'Giao dịch không thành công. Vui lòng kiểm tra lại tồn kho.',
        type: 'error',
      })
    } finally {
      setSubmittingSale(false)
    }
  }

  // 9. Reset POS for new sale
  const handleNewSale = () => {
    setSuccessSale(null)
    setBillItems([])
    setVoucherCode('')
    setVoucherState({ applied: false, discount: 0, message: '', loading: false })
    setAmountReceived('')
    setCustomerName('')
    setCustomerPhone('')
    setSaleNotes('')
  }

  // 10. Camera Barcode Scanner Controls
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const handleOpenScanner = () => {
    setCameraError(null)
    setScannerSupported(typeof window !== 'undefined' && 'BarcodeDetector' in window)
    setScannerOpen(true)
  }

  useEffect(() => {
    if (!scannerOpen) {
      stopCameraStream()
      return
    }

    let isMounted = true

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      })
      .catch((err) => {
        if (isMounted) {
          setCameraError(
            err.name === 'NotAllowedError'
              ? 'Quyền truy cập camera bị từ chối. Vui lòng cho phép quyền camera trong cài đặt trình duyệt.'
              : 'Không thể kết nối đến camera thiết bị: ' + err.message
          )
        }
      })

    // Detection loop if BarcodeDetector is available
    let intervalId = null
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      const barcodeDetector = new window.BarcodeDetector({
        formats: ['code_128', 'ean_13', 'ean_8', 'qr_code', 'upc_a'],
      })

      intervalId = setInterval(async () => {
        if (!videoRef.current || scanLockRef.current || !videoRef.current.readyState || videoRef.current.readyState < 2) {
          return
        }
        try {
          const barcodes = await barcodeDetector.detect(videoRef.current)
          if (barcodes && barcodes.length > 0) {
            const code = barcodes[0].rawValue
            if (code) {
              scanLockRef.current = true
              lookupBarcode(code)
                .then((res) => {
                  const product = res?.data || res
                  handleAddToBill(product)
                  addToast({ message: `Quét mã thành công: ${product.name}`, type: 'success' })
                })
                .catch(() => {
                  addToast({ message: `Không tìm thấy nhạc cụ với mã vạch '${code}'.`, type: 'error' })
                })
                .finally(() => {
                  setTimeout(() => {
                    scanLockRef.current = false
                  }, 1800)
                })
            }
          }
        } catch {
          // ignore detection frame drops
        }
      }, 250)
    }

    return () => {
      isMounted = false
      if (intervalId) clearInterval(intervalId)
      stopCameraStream()
    }
  }, [scannerOpen, stopCameraStream, handleAddToBill, addToast])

  return (
    <div className="flex flex-col gap-4">
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
            onClick={handleOpenScanner}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
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
                onClick={handleClearBill}
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
                      onClick={() => handleUpdateQty(item.productId, -1)}
                      className="w-6 h-6 rounded-md border border-border bg-canvas hover:bg-surface-secondary text-ink font-bold flex items-center justify-center cursor-pointer transition-colors"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-bold text-ink font-mono">{item.quantity}</span>
                    <button
                      type="button"
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
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-brand font-mono uppercase text-ink placeholder:text-muted"
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
                      ? 'border-brand bg-brand/5 text-brand shadow-xs'
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
                      ? 'border-brand bg-brand/5 text-brand shadow-xs'
                      : 'border-border bg-surface text-muted hover:text-ink'
                  }`}
                >
                  <QrCode size={18} />
                  <span>Chuyển khoản QR</span>
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
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value.replace(/\D/g, ''))}
                  className={`w-full px-3 py-1.5 text-xs rounded-lg border font-mono font-bold text-ink focus:outline-none focus:ring-1 focus:ring-brand ${
                    cashInsufficient ? 'border-rose-400 bg-rose-50/30' : 'border-border bg-canvas'
                  }`}
                />
                <div className="flex justify-between items-center text-xs pt-1 border-t border-border/40">
                  <span className="text-muted">Tiền thừa trả khách:</span>
                  <span
                    className={`font-mono font-bold ${
                      cashInsufficient ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {cashInsufficient
                      ? 'Khách đưa thiếu ' + formatCurrencyVND(finalAmount - numReceived)
                      : formatCurrencyVND(amountChange)}
                  </span>
                </div>
              </div>
            )}

            {/* Customer Details (Optional) */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Tên khách (tùy chọn)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-brand text-ink placeholder:text-muted"
              />
              <input
                type="text"
                placeholder="SĐT khách (tùy chọn)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(sanitizeVietnameseMobile(e.target.value))}
                inputMode="numeric"
                maxLength={10}
                className="w-36 px-3 py-1.5 text-xs rounded-xl border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-brand text-ink placeholder:text-muted font-mono"
              />
            </div>

            {/* Checkout Action Button */}
            <button
              type="button"
              disabled={submittingSale || billItems.length === 0 || cashInsufficient}
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
      {scannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-border flex items-center justify-between bg-surface-secondary/40">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-sm font-bold text-ink">Quét mã vạch camera</h3>
              </div>
              <button
                type="button"
                onClick={() => setScannerOpen(false)}
                className="text-muted hover:text-ink transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4 text-xs">
              {/* Video Viewport */}
              <div className="relative w-full h-64 rounded-xl overflow-hidden bg-black flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                {/* Aiming Reticle */}
                <div className="absolute inset-x-8 inset-y-12 border-2 border-dashed border-emerald-400/80 rounded-lg pointer-events-none flex items-center justify-center">
                  <span className="text-xs text-white/90 bg-black/60 px-2 py-0.5 rounded font-mono">
                    Đặt mã vạch vào khung
                  </span>
                </div>
              </div>

              {cameraError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2">
                  <CircleAlert size={16} className="shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}

              {!scannerSupported && (
                <div className="p-3 rounded-xl bg-[#F6F7F8] border border-amber-200 text-amber-800 text-xs">
                  Trình duyệt chưa hỗ trợ tự động BarcodeDetector. Bạn có thể nhập mã vạch bằng tay bên dưới hoặc dùng máy quét USB / Bluetooth cầm tay.
                </div>
              )}

              {/* Manual code fallback on modal */}
              <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã vạch hoặc SKU..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-border bg-canvas focus:outline-none focus:ring-1 focus:ring-brand font-mono text-xs"
                />
                <button
                  type="submit"
                  disabled={lookupLoading || !barcodeInput.trim()}
                  className="px-4 py-2 rounded-xl bg-brand text-white font-bold text-xs shadow-xs hover:bg-brand/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {lookupLoading ? '...' : 'Thêm'}
                </button>
              </form>

              <button
                type="button"
                onClick={() => setScannerOpen(false)}
                className="w-full py-2 rounded-xl border border-border bg-canvas hover:bg-surface-secondary text-xs font-semibold text-ink transition-colors cursor-pointer"
              >
                Đóng máy quét
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Success Modal */}
      {successSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-6 bg-emerald-600 text-white flex flex-col items-center justify-center text-center gap-2">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Check size={28} className="text-white" />
              </div>
              <h3 className="text-xl font-bold">Thanh toán thành công!</h3>
              <span className="text-xs text-white/90">
                Đã trừ tồn kho showroom an toàn và tạo hóa đơn bán hàng.
              </span>
            </div>

            {/* Receipt Summary */}
            <div className="p-6 flex flex-col gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-canvas border border-border flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-muted">Mã hóa đơn:</span>
                  <span className="font-bold text-ink font-mono">{successSale.invoiceCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Tổng tiền thanh toán:</span>
                  <span className="font-bold text-brand font-mono text-sm">{formatCurrencyVND(successSale.finalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Phương thức:</span>
                  <span className="font-medium text-ink">
                    {successSale.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản QR'}
                  </span>
                </div>
                {successSale.paymentMethod === 'CASH' && successSale.amountReceived && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted">Tiền khách đưa:</span>
                      <span className="font-mono text-ink">{formatCurrencyVND(successSale.amountReceived)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Tiền thừa trả khách:</span>
                      <span className="font-mono">{formatCurrencyVND(successSale.amountChange)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-muted">Thu ngân:</span>
                  <span className="text-ink">{successSale.staffName || user?.fullName}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      addToast({ message: 'Đang chuẩn bị tải hóa đơn PDF...', type: 'info' })
                      await downloadInvoicePdf(successSale.invoiceId)
                      addToast({ message: 'Tải hóa đơn PDF thành công!', type: 'success' })
                    } catch (err) {
                      addToast({ message: err?.message || 'Không thể tải hóa đơn PDF', type: 'error' })
                    }
                  }}
                  className="py-2.5 px-4 rounded-xl border border-brand bg-brand/5 hover:bg-brand/10 text-brand font-bold text-center transition-colors cursor-pointer"
                >
                  Tải hóa đơn PDF
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-2.5 px-4 rounded-xl border border-border bg-canvas hover:bg-surface-secondary text-ink font-bold text-center transition-colors cursor-pointer"
                >
                  In hóa đơn
                </button>
              </div>

              <button
                type="button"
                onClick={handleNewSale}
                className="w-full py-3 rounded-xl bg-brand text-white font-bold text-sm shadow-md hover:bg-brand/90 transition-all cursor-pointer"
              >
                + Bắt đầu đơn hàng mới
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PosDashboardPage
