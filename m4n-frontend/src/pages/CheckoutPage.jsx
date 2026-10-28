import { useEffect, useRef, useState } from 'react'
import LoadingState from '../components/ui/LoadingState.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import { formatCurrencyVND } from '../utils/currency.js'
import CheckoutRecipientFields from '../features/checkout/CheckoutRecipientFields.jsx'
import ShippingAddressFields from '../features/checkout/ShippingAddressFields.jsx'
import shippingService from '../services/shippingService.js'
import useAuth from '../features/auth/useAuth.js'
import useCart from '../features/cart/useCart.js'
import useToast from '../components/ui/useToast.js'
import orderService from '../services/orderService.js'
import paymentService from '../services/paymentService.js'
import { CUSTOMER_ROUTES, navigateTo } from '../routes/customerRoutes.js'
import {
  ArrowRight,
  Check,
  ChevronRight,
  Minus,
  Plus,
  Shield,
  ShoppingBag,
  Trash2,
} from 'lucide-react'
import { IconInstrument } from '../components/ui/Icons.jsx'
import SavedAddressPicker from '../features/checkout/SavedAddressPicker.jsx'
import { validateRecipient, recipientFromAddress, deliveryFromAddress } from '../features/checkout/recipientValidation.js'
import { isValidVietnameseMobile } from '../utils/phone.js'
import useDirectPurchase from '../features/checkout/useDirectPurchase.js'

function CheckoutPage() {
  const { user, isAuthenticated } = useAuth()
  const {
    cart,
    refreshCart,
    updateCartItem,
    removeCartItem,
    selectedCartItemIds,
    selectedCartItems,
    loading: savedCartLoading,
    error: savedCartError,
  } = useCart()
  const direct = useDirectPurchase()
  const { directPurchase } = direct
  const cartLoading = directPurchase ? direct.loading : savedCartLoading
  const cartError = direct.error || (directPurchase ? null : savedCartError)
  const checkoutSnapshot = directPurchase || cart
  const cartItemIds = directPurchase ? undefined : selectedCartItemIds
  const { addToast } = useToast()
  const selectionKey = directPurchase
    ? `direct:${directPurchase.productId}:${directPurchase.quantity}`
    : selectedCartItemIds.join(',')

  const [formData, setFormData] = useState(() => ({
    customerName: user?.fullName || '',
    customerPhone: user?.phone || '',
    customerEmail: user?.email || '',
    shippingAddress: user?.address || '',
    notes: '',
  }))

  const [formErrors, setFormErrors] = useState({})
  const [shippingOptions, setShippingOptions] = useState(null)
  const [shippingOptionsError, setShippingOptionsError] = useState('')
  const [shippingOptionsRetry, setShippingOptionsRetry] = useState(0)
  const [deliveryAddress, setDeliveryAddress] = useState({ provinceId: null, wardId: null, streetAddress: '' })
  const carrierEnabled = Boolean(shippingOptions?.carrierEnabled)
  const carrierAddress = carrierEnabled ? deliveryAddress : undefined
  const recipientName = carrierEnabled ? formData.customerName.trim() : undefined
  const recipientPhone = carrierEnabled ? formData.customerPhone.trim() : undefined
  const shippingKey = carrierEnabled ? JSON.stringify([deliveryAddress, recipientName, recipientPhone]) : 'local'
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [paymentOptions, setPaymentOptions] = useState(null)
  const [paymentOptionsError, setPaymentOptionsError] = useState('')
  const [optionsRetry, setOptionsRetry] = useState(0)

  // Voucher state
  const [voucherCodeInput, setVoucherCodeInput] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState(null)
  const [voucherLoading, setVoucherLoading] = useState(false)
  const [voucherFeedback, setVoucherFeedback] = useState(null)
  const [shippingCodeInput, setShippingCodeInput] = useState('')
  const [shippingVoucher, setShippingVoucher] = useState(null)
  const [shippingFeedback, setShippingFeedback] = useState('')

  // Preview & submission state
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState(null)
  const [previewRetry, setPreviewRetry] = useState(0)
  const previewSequence = useRef(0)
  const submissionPending = useRef(false)

  useEffect(() => {
    let active = true
    shippingService.getOptions().then((result) => {
      if (active) { setShippingOptions(result); setShippingOptionsError('') }
    }).catch((error) => { if (active) setShippingOptionsError(error.message || 'Không thể kiểm tra cấu hình vận chuyển.') })
    return () => { active = false }
  }, [shippingOptionsRetry])

  useEffect(() => {
    let active = true
    paymentService.getOptions()
      .then((result) => { if (active) { setPaymentOptions(result); setPaymentOptionsError('') } })
      .catch(() => { if (active) setPaymentOptionsError('Không thể kiểm tra cổng thanh toán. Bạn có thể tiếp tục bằng COD.') })
    return () => { active = false }
  }, [optionsRetry])

  // Prefill customer profile data if user loads asynchronously
  useEffect(() => {
    if (!user) return
    const timer = setTimeout(() => {
      setFormData((prev) => ({
        ...prev,
        customerName: prev.customerName || user.fullName || '',
        customerEmail: prev.customerEmail || user.email || '',
        customerPhone: prev.customerPhone || user.phone || '',
        shippingAddress: prev.shippingAddress || user.address || '',
      }))
    }, 0)
    return () => clearTimeout(timer)
  }, [user])

  // Load authoritative preview from backend
  useEffect(() => {
    let active = true
    const requestId = ++previewSequence.current

    async function fetchPreview() {
      setVoucherLoading(false)
      if (!isAuthenticated || !checkoutSnapshot || cartLoading || cartError || (!directPurchase && selectedCartItemIds.length === 0) || !shippingOptions
          || (carrierEnabled && (!shippingOptions.carrierAvailable || !deliveryAddress.provinceId || !deliveryAddress.wardId
            || !deliveryAddress.streetAddress.trim() || !recipientName || !isValidVietnameseMobile(recipientPhone)))) {
        setPreview(null)
        setPreviewLoading(false)
        return
      }

      try {
        setPreviewLoading(true)
        setGeneralError(null)
        setPreview(null)
        const codeToValidate = appliedVoucher ? appliedVoucher.code : null
        const res = await orderService.previewCheckout(codeToValidate, shippingVoucher, cartItemIds, carrierAddress, recipientName, recipientPhone, directPurchase)
        if (active && requestId === previewSequence.current) {
          setPreview({ ...res, cartSnapshot: checkoutSnapshot, selectionKey, shippingKey })
          if (codeToValidate && !res.voucherApplied) {
            setAppliedVoucher(null)
            setVoucherFeedback({ type: 'error', message: res.voucherMessage || 'Mã giảm giá không còn áp dụng cho giỏ hàng.' })
          }
          if (shippingVoucher && !res.shippingVoucherApplied) {
            setShippingVoucher(null)
            setShippingFeedback(res.shippingVoucherMessage || 'Voucher ship không còn áp dụng cho đơn này.')
          }
        }
      } catch (err) {
        if (active && requestId === previewSequence.current) {
          setGeneralError(err.message || 'Không thể tải thông tin đơn hàng')
        }
      } finally {
        if (active && requestId === previewSequence.current) {
          setPreviewLoading(false)
        }
      }
    }

    const timer = setTimeout(fetchPreview, carrierEnabled ? 350 : 0)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [isAuthenticated, appliedVoucher, shippingVoucher, checkoutSnapshot, cartLoading, cartError, previewRetry, selectionKey, selectedCartItemIds, cartItemIds, directPurchase,
    shippingOptions, carrierEnabled, deliveryAddress, carrierAddress, recipientName, recipientPhone, shippingKey])

  const handleQuantityChange = async (item, nextQuantity) => {
    if (nextQuantity < 1 || nextQuantity > 2147483647) return
    if (directPurchase) {
      direct.setQuantity(nextQuantity)
      return
    }
    const result = await updateCartItem(item.id, nextQuantity)
    if (!result.success) {
      addToast({ message: result.message || 'Không thể cập nhật số lượng.', type: 'error' })
    }
  }

  const handleRemoveItem = async (item) => {
    if (directPurchase) {
      navigateTo(CUSTOMER_ROUTES.productDetail(directPurchase.productId))
      return
    }
    const result = await removeCartItem(item.id)
    addToast({
      message: result.success
        ? `Đã xóa “${item.productName}” khỏi đơn hàng.`
        : result.message || 'Không thể xóa sản phẩm.',
      type: result.success ? 'success' : 'error',
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  // Voucher apply handler
  const handleApplyVoucher = async (e) => {
    e.preventDefault()
    if (voucherLoading || cartLoading || submitting || previewLoading) return
    if (!voucherCodeInput.trim()) {
      setVoucherFeedback({ type: 'error', message: 'Vui lòng nhập mã voucher' })
      return
    }

    const requestId = ++previewSequence.current
    try {
      setVoucherLoading(true)
      setVoucherFeedback(null)

      const res = await orderService.previewCheckout(voucherCodeInput.trim(), shippingVoucher, cartItemIds, carrierAddress, recipientName, recipientPhone, directPurchase)
      if (requestId !== previewSequence.current) return

      if (res.voucherApplied) {
        const applied = {
          code: res.voucherCode,
          message: res.voucherMessage || 'Mã giảm giá hợp lệ',
        }
        setAppliedVoucher(applied)
        setPreview({ ...res, cartSnapshot: checkoutSnapshot, selectionKey, shippingKey })
        setVoucherFeedback({ type: 'success', message: applied.message })
        addToast({
          message: `Đã áp dụng mã giảm giá: ${applied.code}`,
          type: 'success',
        })
      } else {
        setVoucherFeedback({
          type: 'error',
          message: res.voucherMessage || 'Mã voucher không hợp lệ hoặc đã hết hạn',
        })
      }
    } catch (err) {
      if (requestId !== previewSequence.current) return
      setVoucherFeedback({
        type: 'error',
        message: err.message || 'Mã voucher không hợp lệ hoặc đã hết hạn',
      })
    } finally {
      if (requestId === previewSequence.current) setVoucherLoading(false)
    }
  }

  // Remove voucher handler
  const handleRemoveVoucher = () => {
    setAppliedVoucher(null)
    setVoucherCodeInput('')
    setVoucherFeedback(null)
    addToast({
      message: 'Đã hủy áp dụng mã giảm giá',
      type: 'info',
    })
  }

  // Client-side validation before submission
  const handleApplyShippingVoucher = async () => {
    if (voucherLoading || cartLoading || submitting || previewLoading || !shippingCodeInput.trim()) return
    const requestId = ++previewSequence.current
    setVoucherLoading(true)
    setShippingFeedback('')
    try {
      const result = await orderService.previewCheckout(appliedVoucher?.code, shippingCodeInput.trim(), cartItemIds, carrierAddress, recipientName, recipientPhone, directPurchase)
      if (requestId !== previewSequence.current) return
      if (result.shippingVoucherApplied) {
        setShippingVoucher(result.shippingVoucherCode)
        setPreview({ ...result, cartSnapshot: checkoutSnapshot, selectionKey, shippingKey })
      }
      setShippingFeedback(result.shippingVoucherMessage || (result.shippingVoucherApplied ? 'Đã áp dụng voucher ship.' : 'Voucher ship không áp dụng cho đơn này.'))
    } catch (err) {
      if (requestId === previewSequence.current) setShippingFeedback(err.message || 'Không thể kiểm tra voucher ship.')
    } finally { if (requestId === previewSequence.current) setVoucherLoading(false) }
  }

  const validateForm = () => {
    const errors = validateRecipient(formData, carrierEnabled)

    setFormErrors(errors)
    document.getElementById(Object.keys(errors)[0])?.focus()
    return Object.keys(errors).length === 0
  }

  // Place Order handler
  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    if (submissionPending.current || cartLoading || cartError || previewLoading || voucherLoading || !preview || preview.cartSnapshot !== checkoutSnapshot || preview.selectionKey !== selectionKey || preview.shippingKey !== shippingKey) return
    setGeneralError(null)

    if (!validateForm()) {
      addToast({
        message: 'Vui lòng điền đầy đủ và chính xác thông tin nhận hàng.',
        type: 'error',
      })
      return
    }

    let placedOrder = null
    try {
      submissionPending.current = true
      setSubmitting(true)

      const payload = {
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerEmail: formData.customerEmail.trim(),
        shippingAddress: carrierEnabled ? deliveryAddress.streetAddress.trim() : formData.shippingAddress.trim(),
        deliveryAddress: carrierAddress,
        expectedShippingFee: preview.shippingFee,
        paymentMethod: paymentMethod,
        voucherCode: appliedVoucher ? appliedVoucher.code : null,
        shippingVoucherCode: shippingVoucher,
        notes: formData.notes.trim() || null,
        cartItemIds,
        directPurchase: directPurchase || undefined,
      }

      const orderResponse = await orderService.placeOrder(payload)
      placedOrder = orderResponse

      // Cart checkout removes purchased rows; direct purchase leaves the saved cart intact.
      await refreshCart()

      if (paymentMethod === 'MOMO') {
        const paymentUrl = await paymentService.start(orderResponse.id, paymentMethod)
        window.location.assign(paymentUrl)
        return
      }

      addToast({
        message: `Đặt hàng thành công! Mã đơn: ${orderResponse.orderCode}`,
        type: 'success',
      })

      // Redirect to customer order history
      navigateTo(CUSTOMER_ROUTES.orders)
    } catch (err) {
      if (placedOrder) {
        addToast({ message: `Đơn ${placedOrder.orderCode} đã tạo. Chưa mở được cổng thanh toán; kiểm tra trạng thái trước khi thanh toán tiếp.`, type: 'info' })
        navigateTo(`${CUSTOMER_ROUTES.paymentReturn}?orderId=${encodeURIComponent(placedOrder.id)}`)
        return
      }
      if (err.fieldErrors) setFormErrors(err.fieldErrors)
      if (err.status === 409 && carrierEnabled) {
        setPreview(null)
        setPreviewRetry((count) => count + 1)
      }
      setGeneralError(err.message || 'Không thể tạo đơn hàng lúc này. Vui lòng thử lại.')
      addToast({
        message: err.message || 'Đặt hàng thất bại. Vui lòng kiểm tra lại thông tin.',
        type: 'error',
      })
    } finally {
      submissionPending.current = false
      setSubmitting(false)
    }
  }

  const previewCurrent = !cartError && !cartLoading && preview?.cartSnapshot === checkoutSnapshot && preview?.selectionKey === selectionKey && preview?.shippingKey === shippingKey
  const items = (previewCurrent ? preview.items : directPurchase ? direct.items : selectedCartItems) || []
  const hasItems = items.length > 0
  const checkoutBusy = submitting || cartLoading || previewLoading || voucherLoading

  if (!isAuthenticated) {
    return (
      <div className="w-full bg-surface-secondary/40 min-h-[calc(100vh-80px)] py-12">
        <div className="max-w-md mx-auto px-4 text-center bg-white rounded-3xl p-8 border border-border/80 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-soft text-brand flex items-center justify-center mx-auto">
            <ShoppingBag size={28} />
          </div>
          <h2 className="text-xl font-bold text-ink">Vui lòng đăng nhập để thanh toán</h2>
          <p className="text-xs text-muted">
            Quý khách cần đăng nhập tài khoản M4N để bảo mật thông tin đơn hàng và theo dõi tiến độ giao nhận.
          </p>
          <button
            type="button"
            onClick={() => navigateTo(CUSTOMER_ROUTES.login)}
            className="w-full h-12 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold text-sm shadow-md shadow-brand/20 transition-all cursor-pointer"
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-surface-secondary/40 min-h-[calc(100vh-80px)] py-8 sm:py-12">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumbs & Header */}
        <div>
          <nav className="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            <button
              type="button"
              onClick={() => navigateTo(CUSTOMER_ROUTES.home)}
              className="hover:text-ink transition-colors cursor-pointer"
            >
              Trang chủ
            </button>
            <span className="text-subtle">/</span>
            <button
              type="button"
              onClick={() => navigateTo(CUSTOMER_ROUTES.cart)}
              className="hover:text-ink transition-colors cursor-pointer"
            >
              Giỏ hàng
            </button>
            <span className="text-subtle">/</span>
            <span className="text-brand font-bold">Thanh toán đơn hàng</span>
          </nav>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-sans">
            Thanh toán an toàn
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Xác nhận thông tin giao nhận, phương thức thanh toán và kiểm tra tình trạng đơn hàng.
          </p>
        </div>

        {generalError && (
          <div role="alert" className="p-4 rounded-2xl bg-white border border-danger-border text-danger text-sm font-medium flex items-center gap-3">
            <span>{generalError}</span>
            <button type="button" disabled={checkoutBusy} onClick={() => setPreviewRetry((current) => current + 1)} className="font-semibold underline">Thử lại</button>
          </div>
        )}

        {cartLoading && (directPurchase || !cart) ? (
          <LoadingState message="Đang tải sản phẩm đặt mua…" />
        ) : cartError ? (
          <div className="space-y-4">
            <ErrorState message={cartError} onRetry={directPurchase ? direct.retry : direct.error ? undefined : refreshCart} />
            {direct.error && <button type="button" className="font-semibold text-brand underline" onClick={() => navigateTo(CUSTOMER_ROUTES.products)}>Chọn lại sản phẩm</button>}
          </div>
        ) : !hasItems ? (
          <div className="rounded-[32px] bg-white border border-border/80 p-12 text-center shadow-sm max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-secondary text-subtle flex items-center justify-center mx-auto border border-border">
              <ShoppingBag size={28} />
            </div>
            <h3 className="text-xl font-bold text-ink">
              {cart?.items?.length ? 'Chưa chọn sản phẩm thanh toán' : 'Giỏ hàng của bạn đang trống'}
            </h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              {cart?.items?.length
                ? 'Quay lại giỏ hàng và chọn ít nhất một sản phẩm trước khi tiếp tục.'
                : 'Không có sản phẩm nào để thanh toán. Hãy chọn những nhạc cụ truyền thống yêu thích trước.'}
            </p>
            <button
              type="button"
              onClick={() => navigateTo(cart?.items?.length ? CUSTOMER_ROUTES.cart : CUSTOMER_ROUTES.products)}
              className="inline-flex items-center gap-2 h-12 px-8 rounded-2xl bg-brand hover:bg-brand-hover text-white text-sm font-bold shadow-md shadow-brand/20 transition-all cursor-pointer"
            >
              <span>{cart?.items?.length ? 'Quay lại giỏ hàng' : 'Khám phá nhạc cụ'}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} noValidate className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <fieldset disabled={submitting} className="contents">
            
            {/* Left Column: Customer Details, Voucher, Payment Method */}
            <div className="lg:col-span-7 space-y-6">
              
              <SavedAddressPicker disabled={submitting} onSelect={(address) => {
                setFormData(recipientFromAddress(address))
                setDeliveryAddress(deliveryFromAddress(address))
                setFormErrors({})
                setGeneralError(null)
              }} />
              <CheckoutRecipientFields value={formData} errors={formErrors} onChange={handleInputChange} carrierEnabled={carrierEnabled} />
              {shippingOptionsError && <div role="alert" className="bg-white p-4 text-danger">{shippingOptionsError}
                <button type="button" className="underline ml-2" onClick={() => setShippingOptionsRetry((count) => count + 1)}>Thử lại</button>
              </div>}
              {carrierEnabled && !shippingOptions.carrierAvailable && <p role="alert" className="bg-white p-4 text-danger">GHN chưa được cấu hình. Chưa thể tính phí và đặt hàng.</p>}
              {carrierEnabled && shippingOptions.carrierAvailable && <ShippingAddressFields value={deliveryAddress} onChange={setDeliveryAddress} disabled={submitting} />}

              {/* Card 2: Voucher Application */}
              <div className="rounded-[28px] bg-white border border-border/80 p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <h2 className="text-base sm:text-lg font-bold text-ink font-sans flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">2</span>
                    <span>Mã ưu đãi / Voucher M4N</span>
                  </h2>
                </div>

                {appliedVoucher ? (
                  <div className="p-4 rounded-2xl bg-surface-secondary border border-emerald-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-secondary text-emerald-700 flex items-center justify-center font-bold">
                        <Check size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-900">{appliedVoucher.code}</span>
                        </div>
                        <p className="text-xs text-emerald-700 mt-0.5">
                          {previewCurrent && preview?.voucherApplied
                            ? `Giảm ${formatCurrencyVND(preview.manualDiscountAmount ?? preview.discountAmount)}`
                            : 'Đang kiểm tra lại ưu đãi…'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={checkoutBusy}
                      onClick={handleRemoveVoucher}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline px-3 py-1.5 cursor-pointer"
                    >
                      Bỏ áp dụng
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label htmlFor="checkout-voucher" className="block text-xs font-semibold text-ink">Mã giảm giá</label>
                    <div className="flex gap-2">
                      <input
                        id="checkout-voucher"
                        maxLength={50}
                        spellCheck={false}
                        name="voucherCode"
                        aria-label="Mã giảm giá"
                        autoComplete="off"
                        disabled={checkoutBusy}
                        type="text"
                        value={voucherCodeInput}
                        onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                        placeholder="Nhập mã voucher (ví dụ: M4N10)"
                        className="flex-1 h-11 px-4 rounded-xl text-sm font-mono uppercase bg-surface-secondary/40 border border-border/80 focus:border-brand focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand/10 transition-all"
                      />
                      <button
                        type="button"
                        onClick={handleApplyVoucher}
                        disabled={checkoutBusy || !voucherCodeInput.trim()}
                        className="h-11 px-5 rounded-xl bg-[#17191B] hover:bg-black text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {voucherLoading ? 'Đang kiểm tra...' : 'Áp dụng'}
                      </button>
                    </div>

                    {voucherFeedback && (
                      <p className={`text-xs font-medium ${
                        voucherFeedback.type === 'success' ? 'text-emerald-600' : 'text-rose-500'
                      }`}>
                        {voucherFeedback.message}
                      </p>
                    )}

                  </div>
                )}
              </div>

              <div className="rounded-[28px] bg-white border border-border/80 p-6 space-y-3">
                <h2 className="text-base font-bold text-ink">Voucher phí vận chuyển</h2>
                <p className="text-xs text-muted">Dùng riêng với voucher giảm tiền hàng. Khi đủ ngưỡng freeship, mã ship không cần dùng và không bị trừ lượt.</p>
                {shippingVoucher ? <div className="flex flex-wrap gap-3 items-center"><strong className="font-mono">{shippingVoucher}</strong><button type="button" disabled={checkoutBusy} onClick={() => { setShippingVoucher(null); setShippingCodeInput(''); setShippingFeedback('') }} className="min-h-11 px-3 text-brand underline">Bỏ voucher ship</button></div> : <>
                  <label htmlFor="checkout-shipping-voucher" className="block text-xs font-semibold">Mã giảm ship</label>
                  <div className="flex gap-2"><input id="checkout-shipping-voucher" autoComplete="off" maxLength={50} value={shippingCodeInput} disabled={checkoutBusy} onChange={(event) => setShippingCodeInput(event.target.value.toUpperCase())} className="min-h-11 min-w-0 flex-1 px-3 border border-border rounded-xl font-mono text-sm" /><button type="button" disabled={checkoutBusy || !shippingCodeInput.trim()} onClick={handleApplyShippingVoucher} className="min-h-11 px-4 border border-border rounded-xl font-semibold text-sm disabled:opacity-50">Áp dụng</button></div>
                </>}
                {shippingFeedback && <p role="status" className="text-xs text-muted">{shippingFeedback}</p>}
              </div>

              {/* Card 3: Payment Method */}
              <div className="rounded-[28px] bg-white border border-border/80 p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <h2 className="text-base sm:text-lg font-bold text-ink font-sans flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">3</span>
                    <span>Phương thức thanh toán</span>
                  </h2>
                </div>

                <div className="space-y-3">
                  {/* COD Option */}
                  <label className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'COD'
                      ? 'bg-brand-soft/20 border-brand ring-1 ring-brand'
                      : 'bg-white border-border/80 hover:bg-surface-secondary/40'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                      className="mt-1 text-brand focus:ring-brand"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-ink">Thanh toán khi nhận hàng (COD)</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-secondary text-emerald-800">
                          Khuyên dùng
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-1">
                        Quý khách kiểm tra thông tin đơn hàng và thanh toán tiền mặt trực tiếp cho nhân viên vận chuyển khi nhận hàng.
                      </p>
                    </div>
                  </label>

                  {paymentOptionsError && <p role="alert" className="text-xs text-danger">{paymentOptionsError} <button type="button" className="underline" disabled={checkoutBusy} onClick={() => setOptionsRetry((value) => value + 1)}>Thử lại</button></p>}
                  <label className={`flex items-start gap-3.5 p-4 rounded-2xl border bg-white ${paymentMethod === 'MOMO' ? 'border-brand' : 'border-border'} ${paymentOptions?.momoAvailable ? 'cursor-pointer' : 'opacity-70'}`}>
                    <input type="radio" name="paymentMethod" value="MOMO" checked={paymentMethod === 'MOMO'}
                      disabled={!paymentOptions?.momoAvailable || checkoutBusy} onChange={() => setPaymentMethod('MOMO')} className="mt-1" />
                    <div className="flex-1">
                      <span className="text-sm font-bold text-ink">Thẻ quốc tế qua MoMo (Sandbox)</span>
                      <p className="text-xs text-muted mt-1">{paymentOptions?.momoAvailable
                        ? 'Nhập thông tin thẻ thử nghiệm trên trang MoMo. Hỗ trợ đơn từ 1.000 đến 10.000.000 đồng.'
                        : 'MoMo chưa được cấu hình. Vui lòng chọn COD.'}</p>
                    </div>
                  </label>
                </div>
              </div>

            </div>

            {/* Right Column: Order Summary & Place Order CTA */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              <div className="rounded-[28px] bg-white border border-border/80 p-6 sm:p-7 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <h3 className="text-base sm:text-lg font-bold text-ink font-sans">
                    Chi tiết nhạc cụ đặt mua
                  </h3>
                  <span className="text-xs font-bold text-muted">
                    {items.reduce((count, item) => count + item.quantity, 0)} sản phẩm
                  </span>
                </div>

                {/* Items List */}
                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.id ?? item.productId} className="flex gap-3.5 items-center pb-3 border-b border-border/40 last:border-0 last:pb-0">
                      <div className="w-14 h-14 rounded-xl bg-surface-secondary overflow-hidden shrink-0 border border-border/60">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-subtle">
                            <IconInstrument size={20} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-ink line-clamp-1">
                          {item.productName}
                        </h4>
                        <div className="text-xs text-muted mt-0.5">Đơn giá: {item.unitPriceDisplay}</div>
                        {Number(item.productDiscountAmount) > 0 && <div className="text-xs text-jade">Giá gốc: {formatCurrencyVND(item.originalUnitPrice)}</div>}
                        <div className="mt-2 flex items-center gap-1.5">
                          <button type="button" onClick={() => handleQuantityChange(item, item.quantity - 1)} disabled={checkoutBusy || item.quantity <= 1} aria-label={`Giảm số lượng ${item.productName}`} className="h-11 w-11 rounded-lg border border-border bg-white flex items-center justify-center disabled:opacity-40">
                            <Minus size={13} />
                          </button>
                          <span className="min-w-7 text-center text-xs font-bold text-ink">{item.quantity}</span>
                          <button type="button" disabled={checkoutBusy} onClick={() => handleQuantityChange(item, item.quantity + 1)} aria-label={`Tăng số lượng ${item.productName}`} className="h-11 w-11 rounded-lg border border-border bg-white flex items-center justify-center disabled:opacity-40">
                            <Plus size={13} />
                          </button>
                          <button type="button" disabled={checkoutBusy} onClick={() => handleRemoveItem(item)} aria-label={`Xóa ${item.productName}`} className="ml-1 h-11 w-11 rounded-lg text-danger hover:bg-surface-secondary flex items-center justify-center disabled:opacity-40">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-ink text-right shrink-0">
                        {item.subtotalDisplay}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calculation Summary */}
                <div className="space-y-2.5 pt-3 border-t border-border/60 text-sm">
                  {previewCurrent && Number(preview?.productDiscountAmount) > 0 && <div className="flex justify-between text-jade"><span>Đã giảm theo sản phẩm:</span><span>{formatCurrencyVND(preview.productDiscountAmount)}</span></div>}
                  <div className="flex items-center justify-between text-muted">
                    <span>Tạm tính tiền hàng:</span>
                    <span className="font-bold text-ink">
                      {previewCurrent ? preview.subtotalDisplay : 'Đang tính lại…'}
                    </span>
                  </div>

                  {previewCurrent && preview?.voucherApplied && (
                    <div className="flex items-center justify-between text-emerald-700">
                      <span>Mã giảm giá ({preview.voucherCode}):</span>
                      <span className="font-bold">
                        -{formatCurrencyVND(preview.manualDiscountAmount ?? preview.discountAmount)}
                      </span>
                    </div>
                  )}
                  {previewCurrent && Number(preview?.automaticDiscountAmount) > 0 && (
                    <div className="flex items-center justify-between text-jade">
                      <span>Ưu đãi tự động ({preview.automaticPromotionCode}):</span>
                      <span className="font-bold">-{formatCurrencyVND(preview.automaticDiscountAmount)}</span>
                    </div>
                  )}

                  {previewCurrent && <>
                    <div className="flex justify-between text-muted"><span>Phí vận chuyển gốc:</span><span>{formatCurrencyVND(preview.baseShippingFee ?? 0)}</span></div>
                    {Number(preview.shippingDiscountAmount) > 0 && <div className="flex justify-between text-jade"><span>{preview.freeShippingApplied ? 'Miễn phí vận chuyển:' : `Voucher ship (${preview.shippingVoucherCode}):`}</span><span>-{formatCurrencyVND(preview.shippingDiscountAmount)}</span></div>}
                    <div className="flex justify-between text-muted"><span>Phí vận chuyển phải trả:</span><span>{formatCurrencyVND(preview.shippingFee ?? 0)}</span></div>
                  </>}

                  <div className="pt-3 border-t border-border/60 flex items-baseline justify-between">
                    <span className="text-sm font-bold text-ink">Tổng thanh toán:</span>
                    <span className="text-2xl font-bold text-brand font-sans">
                      {previewCurrent ? preview.finalAmountDisplay : 'Đang tính lại…'}
                    </span>
                  </div>
                </div>

                {/* Business Explanation Note per Rule 34 */}
                <div className="p-3.5 rounded-2xl bg-[#F6F7F8] border border-amber-200/80 text-xs text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <span>Lưu ý về đơn hàng trực tuyến:</span>
                  </p>
                  <p className="text-amber-800 leading-relaxed">
                    Đơn hàng sẽ khởi tạo ở trạng thái <strong>Chờ xác nhận</strong>. M4N sẽ liên hệ và kiểm tra kỹ thuật âm sắc cùng tồn kho thực tế trước khi xác nhận đơn.
                  </p>
                </div>

                {/* Place Order Button */}
                <button
                  type="submit"
                  disabled={checkoutBusy || !hasItems || !previewCurrent}
                  className="w-full h-14 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold text-base shadow-lg shadow-brand/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {submitting ? (
                    <span>Đang tạo đơn hàng...</span>
                  ) : (
                    <>
                      <span>Đặt hàng ngay</span>
                      <ChevronRight size={18} />
                    </>
                  )}
                </button>

                {/* Security and Packaging Assurance */}
                <div className="pt-2 flex flex-col gap-2 text-xs text-muted">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-brand shrink-0" />
                    <span>Kiểm tra hàng trước khi thanh toán tiền mặt</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-brand shrink-0" />
                    <span>Tồn kho được xác nhận khi nhân viên xử lý đơn hàng.</span>
                  </div>
                </div>

              </div>
            </div>

            </fieldset>
          </form>
        )}

      </div>
    </div>
  )
}

export default CheckoutPage


