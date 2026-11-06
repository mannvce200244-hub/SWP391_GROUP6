import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { Camera, CameraOff, ScanLine, X } from 'lucide-react'
import useDialogFocus from '../../hooks/useDialogFocus.js'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import { lookupBarcode } from '../../services/posService.js'
import { cameraErrorMessage, startBarcodeCamera } from './barcodeCamera.js'

export default function PosScannerDialog({ onClose, onProduct }) {
  const dialogRef = useDialogFocus(true, closeScanner)
  const videoRef = useRef(null)
  const sessionRef = useRef(null)
  const pendingRef = useRef(false)
  const activeRef = useRef(false)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [scanPaused, setScanPaused] = useState(false)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [cameraState, setCameraState] = useState({ status: 'starting', message: '' })
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    activeRef.current = true
    return () => { activeRef.current = false }
  }, [])

  async function findProduct(rawCode) {
    if (pendingRef.current) return
    sessionRef.current?.pause()
    setScanPaused(true)
    const value = rawCode.trim()
    if (!value || value.length > 100) {
      setResult({ type: 'error', message: 'Vui lòng dùng mã vạch hoặc SKU từ 1 đến 100 ký tự.' })
      return
    }
    pendingRef.current = true
    setLoading(true)
    setResult(null)
    setCode(value)
    try {
      const response = await lookupBarcode(value)
      const product = response?.data || response
      if (!activeRef.current) return
      if (!product?.id) throw new Error('Chưa đọc được thông tin sản phẩm. Vui lòng thử lại.')
      onProduct(product)
      setResult({ type: 'success', message: `Đã thêm 1 × ${product.name} vào hóa đơn.`, code: value })
      setCode('')
    } catch (error) {
      if (activeRef.current) setResult({ type: 'error', message: error.message || 'Không tìm thấy sản phẩm. Kiểm tra mã rồi thử lại.' })
    } finally {
      pendingRef.current = false
      if (activeRef.current) setLoading(false)
    }
  }

  const onDetected = useEffectEvent((value) => { void findProduct(value) })
  useEffect(() => {
    if (!cameraEnabled) return undefined
    const session = startBarcodeCamera(videoRef.current, {
      onReady: () => setCameraState({ status: 'ready', message: '' }),
      onCode: onDetected,
      onError: (error) => setCameraState({ status: 'error', message: cameraErrorMessage(error) }),
    })
    sessionRef.current = session
    return () => {
      session.stop()
      if (sessionRef.current === session) sessionRef.current = null
    }
  }, [cameraEnabled, retryKey])

  function retryCamera() {
    setCameraState({ status: 'starting', message: '' })
    setResult(null)
    setScanPaused(false)
    setCameraEnabled(true)
    setRetryKey((value) => value + 1)
  }

  function resumeScan() {
    setResult(null)
    setScanPaused(false)
    setCode('')
    sessionRef.current?.resume()
  }

  function closeScanner() {
    activeRef.current = false
    sessionRef.current?.stop()
    onClose()
  }

  const cameraReady = cameraEnabled && cameraState.status === 'ready'
  const cameraError = cameraEnabled && cameraState.status === 'error'
  const statusText = loading ? 'Đang tìm sản phẩm…'
    : !cameraEnabled ? 'Camera đã tắt'
      : cameraState.status === 'starting' ? 'Đang mở camera…'
        : cameraError ? 'Camera chưa sẵn sàng'
          : scanPaused ? 'Đã tạm dừng quét' : 'Đưa mã vạch vào khung để quét'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="pos-scanner-title" aria-describedby="pos-scanner-description" tabIndex={-1}
        className="w-full max-w-lg max-h-[90dvh] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-white shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-border p-4">
          <h2 id="pos-scanner-title" className="text-base font-bold text-ink">Quét mã vạch bằng camera</h2>
          <Button variant="secondary" size="lg" className="w-12 shrink-0 p-0!" aria-label="Đóng máy quét" onClick={closeScanner}><X size={28} className="shrink-0" aria-hidden="true" /></Button>
        </header>
        <div className="space-y-4 p-5">
          <p id="pos-scanner-description" className="text-sm text-muted">Đưa mã vạch trên sản phẩm vào khung, giữ rõ nét và đủ sáng. Mỗi lượt quét thêm 1 sản phẩm vào hóa đơn.</p>
          <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-surface-secondary">
            <video ref={videoRef} autoPlay playsInline muted aria-label="Hình ảnh camera quét mã sản phẩm" className="h-full w-full object-contain" />
            {cameraReady ? <div aria-hidden="true" className="pointer-events-none absolute inset-x-8 inset-y-10 rounded-lg border-2 border-dashed border-brand" />
              : <div className="absolute inset-0 flex items-center justify-center text-muted" aria-hidden="true">{cameraEnabled && !cameraError ? <Camera size={36} /> : <CameraOff size={36} />}</div>}
          </div>
          <p role="status" className="text-sm font-medium text-ink">{statusText}</p>
          {cameraError && <p role="alert" className="text-sm text-danger">{cameraState.message}</p>}
          <div className="flex flex-wrap gap-2">
            {cameraReady && scanPaused && <Button variant="secondary" disabled={loading} onClick={resumeScan}><ScanLine size={17} aria-hidden="true" />Quét tiếp</Button>}
            {(!cameraEnabled || cameraError) ? <Button variant="secondary" disabled={loading} onClick={retryCamera}>{cameraError ? 'Thử lại camera' : 'Bật camera'}</Button>
              : <Button variant="secondary" onClick={() => { sessionRef.current?.stop(); setCameraEnabled(false) }}>Tắt camera</Button>}
          </div>
          <form noValidate onSubmit={(event) => { event.preventDefault(); void findProduct(code) }} className="space-y-3 border-t border-border pt-4">
            <Input id="pos-scanner-code" name="barcode" label="Nhập mã" autoComplete="off" spellCheck={false} maxLength={100}
              value={code} onChange={(event) => { setCode(event.target.value); if (result?.type === 'error') setResult(null) }} disabled={loading}
              error={result?.type === 'error' ? result.message : undefined}
              aria-describedby={result?.type === 'success' ? 'pos-scanner-feedback' : undefined} />
            <Button type="submit" disabled={!code.trim()} loading={loading} loadingLabel="Đang tìm sản phẩm…" className="w-full">Thêm vào hóa đơn</Button>
          </form>
          {result?.type === 'success' && <div id="pos-scanner-feedback" role="status" className="rounded-lg border border-border bg-surface-secondary p-3 text-sm break-words text-jade">
            <p className="font-medium">{result.message}</p>
            {result.code && <p className="mt-1 text-xs text-muted">Mã: <span translate="no" className="font-mono">{result.code}</span></p>}
            {cameraReady && <p className="mt-1 text-xs text-muted">Bấm “Quét tiếp” để đọc mã khác hoặc thêm một sản phẩm nữa.</p>}
          </div>}
          <p className="text-xs text-muted">Hình ảnh được xử lý trên thiết bị, không tải lên máy chủ.</p>
        </div>
      </div>
    </div>
  )
}
