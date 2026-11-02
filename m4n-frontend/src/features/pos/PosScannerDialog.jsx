import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import useDialogFocus from '../../hooks/useDialogFocus.js'
import useToast from '../../components/ui/useToast.js'
import { lookupBarcode } from '../../services/posService.js'

export default function PosScannerDialog({ onClose, onProduct }) {
  const dialogRef = useDialogFocus(true, onClose)
  const videoRef = useRef(null)
  const manualPending = useRef(false)
  const activeRef = useRef(true)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [supported, setSupported] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    activeRef.current = true
    let active = true
    let stream
    let interval
    let cooldown
    let detecting = false
    const video = videoRef.current
    const start = async () => {
      let detector
      try {
        if (!window.BarcodeDetector) throw new Error('unsupported')
        const requested = ['code_128', 'ean_13', 'ean_8', 'qr_code', 'upc_a']
        const available = window.BarcodeDetector.getSupportedFormats
          ? await window.BarcodeDetector.getSupportedFormats()
          : requested
        const formats = window.BarcodeDetector.getSupportedFormats
          ? requested.filter((format) => available.includes(format))
          : requested
        if (!formats.length) throw new Error('unsupported')
        detector = new window.BarcodeDetector({ formats })
      } catch {
        if (active) setSupported(false)
      }
      if (!active) return
      if (!navigator.mediaDevices?.getUserMedia) {
        if (active) setCameraError('Trình duyệt không thể mở camera. Hãy nhập mã bên dưới hoặc dùng máy quét cầm tay.')
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (!active) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        video.srcObject = stream
      } catch (error) {
        if (active) setCameraError(error.name === 'NotAllowedError'
          ? 'Quyền camera bị từ chối. Bạn có thể cho phép camera trong cài đặt trình duyệt hoặc nhập mã bên dưới.'
          : 'Không thể mở camera. Hãy kiểm tra thiết bị hoặc nhập mã bên dưới.')
        return
      }
      if (!detector || !active) return
      interval = setInterval(async () => {
        if (!active || detecting || manualPending.current || video.readyState < 2) return
        detecting = true
        let scanned = false
        try {
          const codes = await detector.detect(video)
          const value = codes[0]?.rawValue
          if (!active || !value) return
          scanned = true
          const product = await lookupBarcode(value)
          if (active) onProduct(product?.data || product)
        } catch (error) {
          if (active && scanned) addToast({ message: error.message || 'Không tìm thấy sản phẩm với mã vừa quét.', type: 'error' })
        } finally {
          if (scanned && active) cooldown = setTimeout(() => { detecting = false }, 1800)
          else detecting = false
        }
      }, 250)
    }
    start()
    return () => {
      active = false
      activeRef.current = false
      clearInterval(interval)
      clearTimeout(cooldown)
      stream?.getTracks().forEach((track) => track.stop())
      if (video) video.srcObject = null
    }
  }, [onProduct, addToast])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!code.trim() || manualPending.current) return
    manualPending.current = true
    setLoading(true)
    try {
      const product = await lookupBarcode(code.trim())
      if (activeRef.current) {
        onProduct(product?.data || product)
        setCode('')
      }
    } catch (error) {
      if (activeRef.current) addToast({ message: error.message || 'Không tìm thấy sản phẩm với mã vừa nhập.', type: 'error' })
    } finally {
      manualPending.current = false
      if (activeRef.current) setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="pos-scanner-title" tabIndex={-1} className="bg-white rounded-2xl border border-border shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-border flex items-center justify-between bg-[#F6F7F8]">
          <h2 id="pos-scanner-title" className="text-sm font-bold text-ink">Quét mã vạch camera</h2>
          <button type="button" aria-label="Đóng máy quét" onClick={onClose} className="p-2 text-muted hover:text-ink"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4 text-xs">
          <div className="relative h-64 rounded-xl overflow-hidden bg-[#F6F7F8]">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute inset-x-8 inset-y-12 border-2 border-dashed border-brand rounded-lg pointer-events-none" />
          </div>
          {cameraError && <p role="alert" className="text-red-700">{cameraError}</p>}
          {!supported && <p className="text-secondary">Trình duyệt chưa hỗ trợ quét tự động. Hãy nhập mã bên dưới hoặc dùng máy quét USB / Bluetooth.</p>}
          <form onSubmit={handleSubmit} className="space-y-2">
            <label htmlFor="pos-scanner-code" className="block font-semibold">Mã vạch hoặc SKU</label>
            <div className="flex gap-2">
              <input id="pos-scanner-code" name="barcode" autoComplete="off" maxLength={100} value={code} onChange={(event) => setCode(event.target.value)} className="min-w-0 flex-1 px-3 py-2 rounded-xl border border-border bg-white font-mono" />
              <button type="submit" disabled={loading || !code.trim()} className="px-4 py-2 rounded-xl bg-brand text-white font-bold disabled:opacity-50">{loading ? 'Đang tìm…' : 'Thêm'}</button>
            </div>
          </form>
          <button type="button" onClick={onClose} className="w-full py-2 rounded-xl border border-border bg-[#F6F7F8] font-semibold">Đóng máy quét</button>
        </div>
      </div>
    </div>
  )
}
