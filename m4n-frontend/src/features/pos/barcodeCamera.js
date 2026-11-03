const FORMATS = ['code_128', 'ean_13', 'ean_8', 'qr_code', 'upc_a']
const EMPTY_FRAME_ERRORS = ['NotFoundException', 'ChecksumException', 'FormatException']

async function createSoftwareDecoder() {
  const { BarcodeFormat, BrowserMultiFormatReader } = await import('@zxing/browser')
  const reader = new BrowserMultiFormatReader()
  reader.possibleFormats = [BarcodeFormat.CODE_128, BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.QR_CODE, BarcodeFormat.UPC_A]
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Canvas unavailable')
  return {
    async detect(video) {
      if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth
      if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight
      context.drawImage(video, 0, 0)
      try {
        return [{ rawValue: reader.decodeFromCanvas(canvas).getText() }]
      } catch (error) {
        // An unreadable/empty frame is expected while positioning the barcode.
        if (EMPTY_FRAME_ERRORS.includes(error.getKind?.())) return []
        throw error
      }
    },
  }
}

export async function createBarcodeDecoder() {
  let detector
  try {
    const NativeDetector = globalThis.BarcodeDetector
    const supported = await NativeDetector?.getSupportedFormats?.()
    if (supported && FORMATS.every((format) => supported.includes(format))) {
      detector = new NativeDetector({ formats: FORMATS })
    }
  } catch {
    // Some browsers expose the API but cannot construct a working detector.
  }
  if (!detector) return createSoftwareDecoder()
  return {
    async detect(video) {
      try {
        return await detector.detect(video)
      } catch {
        // A native implementation may advertise formats it cannot decode.
        detector = await createSoftwareDecoder()
        return detector.detect(video)
      }
    },
  }
}

export function cameraErrorMessage(error) {
  switch (error?.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Camera chưa được cấp quyền. Cho phép camera trong cài đặt trang web, rồi bấm “Thử lại camera”.'
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'Không tìm thấy camera. Hãy kết nối camera hoặc nhập mã sản phẩm bên dưới.'
    case 'NotReadableError':
    case 'TrackStartError':
      return 'Camera đang bận hoặc không truy cập được. Đóng ứng dụng đang dùng camera rồi thử lại.'
    case 'SecurityError':
      return 'Camera cần kết nối HTTPS hoặc localhost. Hãy mở trang bằng địa chỉ an toàn rồi thử lại.'
    case 'AbortError':
      return 'Camera đã ngắt kết nối. Kiểm tra thiết bị rồi bấm “Thử lại camera”.'
    default:
      return 'Không thể khởi động máy quét. Hãy thử lại camera hoặc nhập mã sản phẩm bên dưới.'
  }
}

// Own one stream and one decode loop. A successful read pauses until explicit resume.
export function startBarcodeCamera(video, { onReady, onCode, onError }) {
  let active = true
  let paused = false
  let stream
  let timer
  const trackListeners = []
  const stop = () => {
    active = false
    clearTimeout(timer)
    trackListeners.forEach(([track, listener]) => track.removeEventListener('ended', listener))
    stream?.getTracks().forEach((track) => track.stop())
    if (stream && video.srcObject === stream) {
      video.pause()
      video.srcObject = null
    }
  }
  const fail = (error) => {
    if (!active) return
    stop()
    onError(error)
  }
  const start = async () => {
    if (globalThis.isSecureContext === false) throw new DOMException('Secure context required', 'SecurityError')
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera unavailable')
    const decoder = await createBarcodeDecoder()
    if (!active) return
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
    })
    if (!active) { stream.getTracks().forEach((track) => track.stop()); return }
    stream.getVideoTracks().forEach((track) => {
      const ended = () => fail(new DOMException('Camera disconnected', 'AbortError'))
      track.addEventListener('ended', ended)
      trackListeners.push([track, ended])
    })
    video.srcObject = stream
    await video.play()
    if (!active) return
    onReady()
    const scan = async () => {
      if (!active) return
      try {
        if (!paused && document.visibilityState !== 'hidden' && video.readyState >= 2) {
          const codes = await decoder.detect(video)
          if (!active) return
          const value = codes.find((item) => item.rawValue?.trim())?.rawValue
          if (!paused && value) { paused = true; onCode(value) }
        }
      } catch (error) { fail(error); return }
      if (active) timer = setTimeout(scan, 250)
    }
    scan()
  }
  start().catch(fail)
  return { stop, pause: () => { paused = true }, resume: () => { paused = false } }
}
