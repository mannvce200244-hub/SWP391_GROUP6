import { useState } from 'react'
import {
  CheckCircle2,
  XCircle,
  QrCode,
  ShieldCheck,
  ArrowLeft,
  Building2,
  FileText,
  CreditCard,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
} from 'lucide-react'
import paymentService from '../services/paymentService.js'
import { formatCurrencyVND } from '../utils/currency.js'
import Button from '../components/ui/Button.jsx'

export default function MomoSimulatorPage() {
  const params = new URLSearchParams(window.location.search)
  const reference = params.get('reference') || ''
  const amount = params.get('amount') || '0'
  const orderInfo = params.get('orderInfo') || 'Thanh toán đơn hàng'
  const returnUrl = params.get('returnUrl') || ''

  const [loading, setLoading] = useState(false)
  const [outcome, setOutcome] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleCopyReference = () => {
    if (!reference) return
    navigator.clipboard.writeText(reference)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSimulate = async (success) => {
    if (loading || !reference) return
    setLoading(true)
    setError('')
    try {
      await paymentService.simulatePayment(reference, success)
      setOutcome(success ? 'success' : 'cancelled')
      setTimeout(() => {
        if (returnUrl) {
          window.location.assign(returnUrl)
        } else {
          window.location.assign('/account/orders')
        }
      }, 1200)
    } catch (err) {
      setError(
        err.message ||
          'Không thể gửi kết quả giả lập MoMo. Vui lòng kiểm tra lại dịch vụ.'
      )
      setLoading(false)
    }
  }

  if (!reference) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-sm border border-slate-200 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-slate-800">
            Thiếu thông tin thanh toán
          </h1>
          <p className="text-sm text-slate-600 mt-2 mb-6">
            Không tìm thấy mã tham chiếu giao dịch MoMo hợp lệ. Vui lòng quay lại
            đơn hàng.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.location.assign('/account/orders')}
          >
            Về đơn hàng của tôi
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 py-10 px-4 flex flex-col items-center justify-center">
      {/* Container */}
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header with MoMo Brand Style */}
        <header className="bg-[#A50064] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-black text-[#A50064] text-lg shadow-sm">
              momo
            </div>
            <div>
              <h1 className="font-bold text-base md:text-lg flex items-center gap-2">
                Cổng thanh toán MoMo Sandbox
                <span className="text-xs bg-pink-800/80 text-pink-100 px-2 py-0.5 rounded-full font-normal">
                  Mô phỏng thử nghiệm
                </span>
              </h1>
              <p className="text-xs text-pink-100">
                Thanh toán nhạc cụ truyền thống M4N
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Ký số HMAC-SHA256 chuẩn</span>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6">
          {error && (
            <div
              role="alert"
              className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2"
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {outcome && (
            <div
              role="status"
              className={`p-4 rounded-xl text-sm flex items-center gap-3 font-medium transition-all ${
                outcome === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {outcome === 'success' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
              )}
              <div>
                <p className="font-semibold text-base">
                  {outcome === 'success'
                    ? 'Thanh toán MoMo thành công!'
                    : 'Giao dịch đã được hủy theo yêu cầu'}
                </p>
                <p className="text-xs opacity-90">
                  Hệ thống đang chuyển hướng bạn về lại trang xác nhận đơn hàng...
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Order Information */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-4">
              <h2 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#A50064]" />
                Thông tin thanh toán
              </h2>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-slate-500 text-xs block">Số tiền cần thanh toán</span>
                  <span className="text-2xl font-bold text-[#A50064]">
                    {formatCurrencyVND(amount)}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/80 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 text-xs flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" /> Thụ hưởng:
                    </span>
                    <span className="font-medium text-right text-xs">
                      M4N Nhạc Cụ Truyền Thống
                    </span>
                  </div>

                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 text-xs">Nội dung:</span>
                    <span className="font-medium text-right text-xs max-w-[180px] truncate" title={orderInfo}>
                      {orderInfo}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500 text-xs">Mã tham chiếu:</span>
                    <button
                      type="button"
                      onClick={handleCopyReference}
                      className="inline-flex items-center gap-1 text-xs font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Sao chép mã tham chiếu"
                    >
                      {reference.slice(0, 10)}...
                      {copied ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Informational callout */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/70 text-xs text-slate-600 space-y-1">
                <p className="font-medium text-slate-700 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                  Mô phỏng Sandbox
                </p>
                <p className="text-[11px] leading-relaxed">
                  Cổng thanh toán MoMo Sandbox dùng cho môi trường kiểm thử và nghiệm thu.
                  Giao dịch sẽ được ghi nhận và cập nhật ngay lập tức vào cơ sở dữ liệu hệ thống M4N.
                </p>
              </div>
            </div>

            {/* Right Column: Simulated QR & Actions */}
            <div className="flex flex-col justify-between space-y-4">
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center">
                <div className="w-36 h-36 bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center mb-2">
                  <QrCode className="w-24 h-24 text-[#A50064]" />
                  <span className="text-[10px] font-mono font-medium text-slate-500">
                    MOMO QR SIMULATOR
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Quét mã QR qua App MoMo hoặc chọn kết quả mô phỏng bên dưới
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  type="button"
                  variant="primary"
                  className="w-full bg-[#D82D8B] hover:bg-[#A50064] text-white font-medium py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 border-none"
                  disabled={loading || Boolean(outcome)}
                  onClick={() => handleSimulate(true)}
                >
                  {loading && !outcome ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang xác nhận MoMo...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Xác nhận thanh toán thành công
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-slate-300 text-slate-700 hover:bg-slate-100 font-medium py-2.5 rounded-xl flex items-center justify-center gap-2"
                  disabled={loading || Boolean(outcome)}
                  onClick={() => handleSimulate(false)}
                >
                  <XCircle className="w-4 h-4 text-rose-500" />
                  Hủy thanh toán giao dịch
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-slate-100/80 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <button
            type="button"
            onClick={() => {
              if (returnUrl) window.location.assign(returnUrl)
              else window.location.assign('/account/orders')
            }}
            className="inline-flex items-center gap-1 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Quay lại đơn hàng
          </button>
          <span>MoMo Payment Gateway Emulator v2.0</span>
        </footer>
      </div>
    </main>
  )
}

