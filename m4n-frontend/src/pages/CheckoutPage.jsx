import { useEffect, useState } from 'react'
import useAuth from '../features/auth/useAuth.js'
import useCart from '../features/cart/useCart.js'
import useToast from '../components/ui/useToast.js'
import orderService from '../services/orderService.js'
import voucherService from '../services/voucherService.js'
import { CUSTOMER_ROUTES, navigateTo } from '../routes/customerRoutes.js'
import {
  IconArrowRight,
  IconCheck,
  IconChevronRight,
  IconInstrument,
  IconShield,
  IconShoppingBag,
} from '../components/ui/Icons.jsx'

function CheckoutPage() {
  const { user, isAuthenticated } = useAuth()
  const { cart, clearCart } = useCart()
  const { addToast } = useToast()

  const [formData, setFormData] = useState(() => ({
    customerName: user?.fullName || '',
    customerPhone: user?.phone || '',
    customerEmail: user?.email || '',
    shippingAddress: user?.address || '',
    notes: '',
  }))

  const [formErrors, setFormErrors] = useState({})
  const [paymentMethod, setPaymentMethod] = useState('COD')

  // Voucher state
  const [voucherCodeInput, setVoucherCodeInput] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState(null)
  const [voucherLoading, setVoucherLoading] = useState(false)
  const [voucherFeedback, setVoucherFeedback] = useState(null)

  // Preview & submission state
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState(null)

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

    async function fetchPreview() {
      if (!isAuthenticated) return

      try {
        setPreviewLoading(true)
        const codeToValidate = appliedVoucher ? appliedVoucher.code : null
        const res = await orderService.previewCheckout(codeToValidate)
        if (active) {
          setPreview(res)
        }
      } catch (err) {
        if (active) {
          setGeneralError(err.message || 'Không thể tải thông tin đơn hàng')
        }
      } finally {
        if (active) {
          setPreviewLoading(false)
        }
      }
    }

    fetchPreview()

    return () => {
      active = false
    }
  }, [isAuthenticated, appliedVoucher])

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
    if (!voucherCodeInput.trim()) {
      setVoucherFeedback({ type: 'error', message: 'Vui lòng nhập mã voucher' })
      return
    }

    try {
      setVoucherLoading(true)
      setVoucherFeedback(null)

      const subtotal = preview?.subtotal || cart?.totalAmount || 0
      const res = await voucherService.validateVoucher(voucherCodeInput, subtotal)

      if (res.isValid) {
        setAppliedVoucher(res)
        setVoucherFeedback({ type: 'success', message: res.message })
        addToast({
          message: `Đã áp dụng mã giảm giá: ${res.code}`,
          type: 'success',
        })
      } else {
        setVoucherFeedback({ type: 'error', message: res.message })
      }
    } catch (err) {
      setVoucherFeedback({
        type: 'error',
        message: err.message || 'Mã voucher không hợp lệ hoặc đã hết hạn',
      })
    } finally {
      setVoucherLoading(false)
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
  const validateForm = () => {
    const errors = {}
    if (!formData.customerName.trim()) {
      errors.customerName = 'Vui lòng nhập họ tên người nhận'
    }
    if (!formData.customerPhone.trim()) {
      errors.customerPhone = 'Vui lòng nhập số điện thoại'
    } else if (!/^[0-9+\s\-()]{8,20}$/.test(formData.customerPhone.trim())) {
      errors.customerPhone = 'Số điện thoại không hợp lệ'
    }
    if (!formData.customerEmail.trim()) {
      errors.customerEmail = 'Vui lòng nhập email nhận thông báo'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail.trim())) {
      errors.customerEmail = 'Email không đúng định dạng'
    }
    if (!formData.shippingAddress.trim()) {
      errors.shippingAddress = 'Vui lòng nhập địa chỉ giao nhận nhạc cụ'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Place Order handler
  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    setGeneralError(null)

    if (!validateForm()) {
      addToast({
        message: 'Vui lòng điền đầy đủ và chính xác thông tin nhận hàng.',
        type: 'error',
      })
      return
    }

    if (submitting) return

    try {
      setSubmitting(true)

      const payload = {
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerEmail: formData.customerEmail.trim(),
        shippingAddress: formData.shippingAddress.trim(),
        paymentMethod: paymentMethod,
        voucherCode: appliedVoucher ? appliedVoucher.code : null,
        notes: formData.notes.trim() || null,
      }

      const orderResponse = await orderService.placeOrder(payload)

      // Clear client cart state after successful order creation
      await clearCart()

      addToast({
        message: `Đặt hàng thành công! Mã đơn: ${orderResponse.orderCode}`,
        type: 'success',
      })

      // Redirect to customer order history
      navigateTo(CUSTOMER_ROUTES.orders)
    } catch (err) {
      setGeneralError(err.message || 'Không thể tạo đơn hàng lúc này. Vui lòng thử lại.')
      addToast({
        message: err.message || 'Đặt hàng thất bại. Vui lòng kiểm tra lại thông tin.',
        type: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const items = preview?.items || cart?.items || []
  const hasItems = items.length > 0

  if (!isAuthenticated) {
    return (
      <div className="w-full bg-surface-secondary/40 min-h-[calc(100vh-80px)] py-12">
        <div className="max-w-md mx-auto px-4 text-center bg-white rounded-3xl p-8 border border-border/80 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-soft text-brand flex items-center justify-center mx-auto">
            <IconShoppingBag size={28} />
          </div>
          <h2 className="text-xl font-black text-ink">Vui lòng đăng nhập để thanh toán</h2>
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

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-ink font-sans">
            Thanh toán an toàn
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Xác nhận thông tin giao nhận, phương thức thanh toán và kiểm tra tình trạng đơn hàng.
          </p>
        </div>

        {generalError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium flex items-center gap-3">
            <span>{generalError}</span>
          </div>
        )}

        {!hasItems && !previewLoading ? (
          <div className="rounded-[32px] bg-white border border-border/80 p-12 text-center shadow-sm max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-secondary text-subtle flex items-center justify-center mx-auto border border-border">
              <IconShoppingBag size={28} />
            </div>
            <h3 className="text-xl font-black text-ink">
              Giỏ hàng của bạn đang trống
            </h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Không có sản phẩm nào để thanh toán. Hãy chọn những nhạc cụ truyền thống yêu thích trước.
            </p>
            <button
              type="button"
              onClick={() => navigateTo(CUSTOMER_ROUTES.products)}
              className="inline-flex items-center gap-2 h-12 px-8 rounded-2xl bg-brand hover:bg-brand-hover text-white text-sm font-bold shadow-md shadow-brand/20 transition-all cursor-pointer"
            >
              <span>Khám phá nhạc cụ</span>
              <IconArrowRight size={15} />
            </button>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Customer Details, Voucher, Payment Method */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Card 1: Delivery Information */}
              <div className="rounded-[28px] bg-white border border-border/80 p-6 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <h2 className="text-base sm:text-lg font-black text-ink font-sans flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">1</span>
                    <span>Thông tin người nhận</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label htmlFor="customerName" className="block text-xs font-bold text-ink uppercase tracking-wider">
                      Họ và tên người nhận <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="customerName"
                      name="customerName"
                      type="text"
                      autoComplete="name"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      placeholder="Ví dụ: Nguyễn Văn Khách"
                      className={`w-full h-11 px-4 rounded-xl text-sm bg-surface-secondary/40 border transition-all focus:bg-white focus:outline-hidden ${
                        formErrors.customerName
                          ? 'border-rose-400 focus:border-rose-500 ring-2 ring-rose-100'
                          : 'border-border/80 focus:border-brand focus:ring-2 focus:ring-brand/10'
                      }`}
                    />
                    {formErrors.customerName && (
                      <p className="text-xs text-rose-500 font-medium mt-1">{formErrors.customerName}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label htmlFor="customerPhone" className="block text-xs font-bold text-ink uppercase tracking-wider">
                      Số điện thoại liên hệ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="customerPhone"
                      name="customerPhone"
                      type="tel"
                      autoComplete="tel"
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                      placeholder="0912 345 678"
                      className={`w-full h-11 px-4 rounded-xl text-sm bg-surface-secondary/40 border transition-all focus:bg-white focus:outline-hidden ${
                        formErrors.customerPhone
                          ? 'border-rose-400 focus:border-rose-500 ring-2 ring-rose-100'
                          : 'border-border/80 focus:border-brand focus:ring-2 focus:ring-brand/10'
                      }`}
                    />
                    {formErrors.customerPhone && (
                      <p className="text-xs text-rose-500 font-medium mt-1">{formErrors.customerPhone}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label htmlFor="customerEmail" className="block text-xs font-bold text-ink uppercase tracking-wider">
                      Email nhận hóa đơn <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="customerEmail"
                      name="customerEmail"
                      type="email"
                      autoComplete="email"
                      value={formData.customerEmail}
                      onChange={handleInputChange}
                      placeholder="khachhang@email.com"
                      className={`w-full h-11 px-4 rounded-xl text-sm bg-surface-secondary/40 border transition-all focus:bg-white focus:outline-hidden ${
                        formErrors.customerEmail
                          ? 'border-rose-400 focus:border-rose-500 ring-2 ring-rose-100'
                          : 'border-border/80 focus:border-brand focus:ring-2 focus:ring-brand/10'
                      }`}
                    />
                    {formErrors.customerEmail && (
                      <p className="text-xs text-rose-500 font-medium mt-1">{formErrors.customerEmail}</p>
                    )}
                  </div>

                  {/* Shipping Address */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label htmlFor="shippingAddress" className="block text-xs font-bold text-ink uppercase tracking-wider">
                      Địa chỉ nhận hàng chi tiết <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="shippingAddress"
                      name="shippingAddress"
                      type="text"
                      autoComplete="street-address"
                      value={formData.shippingAddress}
                      onChange={handleInputChange}
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                      className={`w-full h-11 px-4 rounded-xl text-sm bg-surface-secondary/40 border transition-all focus:bg-white focus:outline-hidden ${
                        formErrors.shippingAddress
                          ? 'border-rose-400 focus:border-rose-500 ring-2 ring-rose-100'
                          : 'border-border/80 focus:border-brand focus:ring-2 focus:ring-brand/10'
                      }`}
                    />
                    {formErrors.shippingAddress && (
                      <p className="text-xs text-rose-500 font-medium mt-1">{formErrors.shippingAddress}</p>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label htmlFor="notes" className="block text-xs font-bold text-ink uppercase tracking-wider">
                      Ghi chú đơn hàng (Tùy chọn)
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={2}
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Yêu cầu bảo quản đặc biệt, khung gỗ, giờ giao thuận tiện..."
                      className="w-full p-3 rounded-xl text-sm bg-surface-secondary/40 border border-border/80 focus:border-brand focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand/10 transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Voucher Application */}
              <div className="rounded-[28px] bg-white border border-border/80 p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <h2 className="text-base sm:text-lg font-black text-ink font-sans flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">2</span>
                    <span>Mã ưu đãi / Voucher M4N</span>
                  </h2>
                </div>

                {appliedVoucher ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <IconCheck size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-900">{appliedVoucher.code}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 font-semibold">
                            -{(appliedVoucher.discountRate * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-xs text-emerald-700 mt-0.5">
                          Giảm {appliedVoucher.discountAmountDisplay}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveVoucher}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline px-3 py-1.5 cursor-pointer"
                    >
                      Bỏ áp dụng
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={voucherCodeInput}
                        onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                        placeholder="Nhập mã voucher (ví dụ: M4N10)"
                        className="flex-1 h-11 px-4 rounded-xl text-sm font-mono uppercase bg-surface-secondary/40 border border-border/80 focus:border-brand focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand/10 transition-all"
                      />
                      <button
                        type="button"
                        onClick={handleApplyVoucher}
                        disabled={voucherLoading || !voucherCodeInput.trim()}
                        className="h-11 px-5 rounded-xl bg-charcoal hover:bg-black text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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

                    <div className="text-[11px] text-muted flex items-center gap-2">
                      <span className="font-semibold text-ink">Gợi ý mã:</span>
                      <button
                        type="button"
                        onClick={() => setVoucherCodeInput('M4N10')}
                        className="font-mono text-brand hover:underline cursor-pointer"
                      >
                        M4N10
                      </button>
                      <span>(Giảm 10% đơn từ 1.000.000₫)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 3: Payment Method */}
              <div className="rounded-[28px] bg-white border border-border/80 p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <h2 className="text-base sm:text-lg font-black text-ink font-sans flex items-center gap-2.5">
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
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Khuyên dùng
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-1">
                        Quý khách kiểm tra nhạc cụ, phiếu bảo hành và thanh toán tiền mặt trực tiếp cho nhân viên vận chuyển khi nhận hàng.
                      </p>
                    </div>
                  </label>

                  {/* Online Transfer Notice */}
                  <label className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all opacity-70 cursor-not-allowed ${
                    paymentMethod === 'ONLINE'
                      ? 'bg-brand-soft/20 border-brand ring-1 ring-brand'
                      : 'bg-surface-secondary/30 border-border/70'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="ONLINE"
                      disabled
                      checked={paymentMethod === 'ONLINE'}
                      onChange={() => setPaymentMethod('ONLINE')}
                      className="mt-1 text-brand focus:ring-brand cursor-not-allowed"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-ink">Thanh toán trực tuyến (Cổng thanh toán)</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-secondary text-subtle">
                          Đang cấu hình
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-1">
                        Cổng thanh toán tự động đang trong quá trình kết nối nghiệm thu. Quý khách vui lòng chọn hình thức COD hoặc liên hệ hotline để nhận hướng dẫn chuyển khoản.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

            </div>

            {/* Right Column: Order Summary & Place Order CTA */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              <div className="rounded-[28px] bg-white border border-border/80 p-6 sm:p-7 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <h3 className="text-base sm:text-lg font-black text-ink font-sans">
                    Chi tiết nhạc cụ đặt mua
                  </h3>
                  <span className="text-xs font-bold text-muted">
                    {preview?.totalItems || cart?.totalItems || 0} sản phẩm
                  </span>
                </div>

                {/* Items List */}
                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3.5 items-center pb-3 border-b border-border/40 last:border-0 last:pb-0">
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
                        <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                          <span>SL: <strong className="text-ink">{item.quantity}</strong></span>
                          <span>&bull;</span>
                          <span>Đơn giá: {item.unitPriceDisplay}</span>
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
                  <div className="flex items-center justify-between text-muted">
                    <span>Tạm tính tiền hàng:</span>
                    <span className="font-bold text-ink">
                      {preview?.subtotalDisplay || cart?.totalAmountDisplay}
                    </span>
                  </div>

                  {preview?.voucherApplied && (
                    <div className="flex items-center justify-between text-emerald-700">
                      <span>Mã giảm giá ({preview.voucherCode}):</span>
                      <span className="font-bold">
                        -{preview.discountAmountDisplay}
                      </span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-border/60 flex items-baseline justify-between">
                    <span className="text-sm font-black text-ink">Tổng thanh toán:</span>
                    <span className="text-2xl font-black text-brand font-sans">
                      {preview?.finalAmountDisplay || cart?.totalAmountDisplay}
                    </span>
                  </div>
                </div>

                {/* Business Explanation Note per Rule 34 */}
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
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
                  disabled={submitting || !hasItems}
                  className="w-full h-14 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold text-base shadow-lg shadow-brand/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {submitting ? (
                    <span>Đang tạo đơn hàng...</span>
                  ) : (
                    <>
                      <span>Đặt hàng ngay</span>
                      <IconChevronRight size={18} />
                    </>
                  )}
                </button>

                {/* Security and Packaging Assurance */}
                <div className="pt-2 flex flex-col gap-2 text-xs text-muted">
                  <div className="flex items-center gap-2">
                    <IconCheck size={14} className="text-brand shrink-0" />
                    <span>Kiểm tra hàng trước khi thanh toán tiền mặt</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconShield size={14} className="text-brand shrink-0" />
                    <span>Cam kết bảo hành âm thanh nứt gãy 12 tháng</span>
                  </div>
                </div>

              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  )
}

export default CheckoutPage
