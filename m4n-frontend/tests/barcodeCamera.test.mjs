import assert from 'node:assert/strict'
import test from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'
import zxing from '@zxing/library'
import { cameraErrorMessage, createBarcodeDecoder, startBarcodeCamera } from '../src/features/pos/barcodeCamera.js'

const FORMATS = ['code_128', 'ean_13', 'ean_8', 'qr_code', 'upc_a']
const deferred = () => Promise.withResolvers()

function environment(t, overrides = {}) {
  const track = new EventTarget()
  track.stopped = 0
  track.stop = () => { track.stopped++ }
  const stream = { getTracks: () => [track], getVideoTracks: () => [track] }
  const video = { srcObject: null, readyState: 4, play: async () => {}, pause: () => {} }
  class NativeDetector {
    static async getSupportedFormats() { return FORMATS }
    async detect() { return [{ rawValue: 'M4N-001' }] }
  }
  const values = {
    BarcodeDetector: NativeDetector,
    isSecureContext: true,
    navigator: { mediaDevices: { getUserMedia: async () => stream } },
    document: {
      visibilityState: 'visible',
      createElement: () => {
        let pixels
        const context = { drawImage: (frame) => { pixels = frame.pixels }, getImageData: () => ({ data: pixels }) }
        return { width: 0, height: 0, getContext: () => context }
      },
    },
    ...overrides,
  }
  for (const [key, value] of Object.entries(values)) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key)
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true })
    t.after(() => original ? Object.defineProperty(globalThis, key, original) : delete globalThis[key])
  }
  return { video, stream, track }
}

function frame(width, height, isBlack) {
  const pixels = new Uint8ClampedArray(width * height * 4).fill(255)
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (isBlack(x, y)) pixels.fill(0, (y * width + x) * 4, (y * width + x) * 4 + 3)
  }
  return { videoWidth: width, videoHeight: height, pixels }
}

function qrFrame() {
  const matrix = new zxing.QRCodeWriter().encode('M4N-001', zxing.BarcodeFormat.QR_CODE, 240, 240, new Map())
  return frame(240, 240, (x, y) => matrix.get(x, y))
}

test('software decoder reads QR without the browser BarcodeDetector API', async (t) => {
  environment(t, { BarcodeDetector: undefined })
  const decoder = await createBarcodeDecoder()
  assert.deepEqual(await decoder.detect(qrFrame()), [{ rawValue: 'M4N-001' }])
})

test('software decoder reads a fixed Code 128 B SKU barcode', async (t) => {
  environment(t, { BarcodeDetector: undefined })
  // M4N-001: Start B, seven data symbols, checksum 56, stop, with quiet zones.
  const widths = ['211214', '113123', '221231', '113321', '122132', '123122', '123122', '123221', '331121', '2331112']
  const bars = '0'.repeat(12) + widths.map(pattern => [...pattern].map((width, i) => (i % 2 ? '0' : '1').repeat(Number(width))).join('')).join('') + '0'.repeat(12)
  const decoder = await createBarcodeDecoder()
  const image = frame(bars.length * 3, 120, (x) => bars[Math.floor(x / 3)] === '1')
  assert.deepEqual(await decoder.detect(image), [{ rawValue: 'M4N-001' }])
})

test('partial native support falls back to software and reads EAN-13', async (t) => {
  class QrOnly { static async getSupportedFormats() { return ['qr_code'] } }
  environment(t, { BarcodeDetector: QrOnly })
  // EAN-13 4006381333931, including guard bars and quiet zones.
  const bars = '00000000000' + '101' + '0001101' + '0100111' + '0101111' + '0111101' + '0001001' + '0110011'
    + '01010' + '1000010' + '1000010' + '1000010' + '1110100' + '1000010' + '1100110' + '101' + '00000000000'
  const decoder = await createBarcodeDecoder()
  assert.deepEqual(await decoder.detect(frame(bars.length * 3, 120, x => bars[Math.floor(x / 3)] === '1')), [{ rawValue: '4006381333931' }])
})

test('a native runtime failure falls back to software; an empty frame is not a camera failure', async (t) => {
  let nativeCalls = 0
  class BrokenDetector {
    static async getSupportedFormats() { return FORMATS }
    async detect() { nativeCalls++; throw new DOMException('Unsupported', 'NotSupportedError') }
  }
  environment(t, { BarcodeDetector: BrokenDetector })
  const decoder = await createBarcodeDecoder()
  assert.deepEqual(await decoder.detect(qrFrame()), [{ rawValue: 'M4N-001' }])
  assert.deepEqual(await decoder.detect(frame(240, 240, () => false)), [])
  assert.equal(nativeCalls, 1)
})

test('camera reads once, pauses duplicate frames, and resumes only explicitly', { timeout: 3000 }, async (t) => {
  const { video, track } = environment(t)
  const codes = []
  const first = deferred()
  const second = deferred()
  const session = startBarcodeCamera(video, { onReady() {}, onError: first.reject, onCode: code => {
    codes.push(code)
    if (codes.length === 1) first.resolve()
    else second.resolve()
  } })
  t.after(session.stop)
  await first.promise
  await delay(550)
  assert.deepEqual(codes, ['M4N-001'])
  session.resume()
  await second.promise
  assert.deepEqual(codes, ['M4N-001', 'M4N-001'])
  session.stop()
  assert.equal(video.srcObject, null)
  assert.equal(track.stopped, 1)
})

test('pausing for manual lookup ignores a camera decode already in flight', { timeout: 3000 }, async (t) => {
  const entered = deferred()
  const detection = deferred()
  class SlowDetector {
    static async getSupportedFormats() { return FORMATS }
    detect() { entered.resolve(); return detection.promise }
  }
  const { video } = environment(t, { BarcodeDetector: SlowDetector })
  const codes = []
  const session = startBarcodeCamera(video, { onReady() {}, onError: entered.reject, onCode: code => codes.push(code) })
  t.after(session.stop)
  await entered.promise
  session.pause()
  detection.resolve([{ rawValue: 'M4N-001' }])
  await delay(300)
  assert.deepEqual(codes, [])
})

test('closing while permission is pending stops a late stream without starting playback', { timeout: 2000 }, async (t) => {
  const opened = deferred()
  const permission = deferred()
  let constraints
  const { video, stream, track } = environment(t, { navigator: { mediaDevices: { getUserMedia: value => {
    constraints = value; opened.resolve(); return permission.promise
  } } } })
  let ready = false
  const session = startBarcodeCamera(video, { onReady: () => { ready = true }, onCode: assert.fail, onError: opened.reject })
  t.after(session.stop)
  await opened.promise
  session.stop()
  permission.resolve(stream)
  await delay(0)
  assert.equal(constraints.audio, false)
  assert.deepEqual(constraints.video.facingMode, { ideal: 'environment' })
  assert.equal(track.stopped, 1)
  assert.equal(video.srcObject, null)
  assert.equal(ready, false)
})

test('closing during decoding discards the late code', { timeout: 2000 }, async (t) => {
  const entered = deferred()
  const detection = deferred()
  class SlowDetector {
    static async getSupportedFormats() { return FORMATS }
    detect() { entered.resolve(); return detection.promise }
  }
  const { video } = environment(t, { BarcodeDetector: SlowDetector })
  const codes = []
  const session = startBarcodeCamera(video, { onReady() {}, onCode: code => codes.push(code), onError: entered.reject })
  t.after(session.stop)
  await entered.promise
  session.stop()
  detection.resolve([{ rawValue: 'M4N-001' }])
  await delay(0)
  assert.deepEqual(codes, [])
})

test('permission denial has actionable guidance and does not start a scan', { timeout: 2000 }, async (t) => {
  const failure = deferred()
  const { video } = environment(t, { navigator: { mediaDevices: { getUserMedia: async () => { throw new DOMException('Denied', 'NotAllowedError') } } } })
  const session = startBarcodeCamera(video, { onReady: assert.fail, onCode: assert.fail, onError: failure.resolve })
  t.after(session.stop)
  assert.match(cameraErrorMessage(await failure.promise), /cấp quyền/)
  assert.equal(video.srcObject, null)
})

test('a playback failure releases the stream', { timeout: 2000 }, async (t) => {
  const failure = deferred()
  const { video, track } = environment(t)
  video.play = async () => { throw new DOMException('Playback denied', 'NotAllowedError') }
  const session = startBarcodeCamera(video, { onReady: assert.fail, onCode: assert.fail, onError: failure.resolve })
  t.after(session.stop)
  await failure.promise
  assert.equal(video.srcObject, null)
  assert.equal(track.stopped, 1)
})

test('a disconnected camera track stops scanning and releases the stream', { timeout: 2000 }, async (t) => {
  const ready = deferred()
  const failure = deferred()
  const { video, track } = environment(t)
  const session = startBarcodeCamera(video, { onReady: ready.resolve, onCode: assert.fail, onError: failure.resolve })
  t.after(session.stop)
  await ready.promise
  track.dispatchEvent(new Event('ended'))
  assert.match(cameraErrorMessage(await failure.promise), /ngắt kết nối/)
  assert.equal(video.srcObject, null)
  assert.equal(track.stopped, 1)
})

test('an insecure origin reports HTTPS/localhost guidance without requesting a camera', { timeout: 2000 }, async (t) => {
  const failure = deferred()
  const { video } = environment(t, { isSecureContext: false, navigator: { mediaDevices: { getUserMedia: assert.fail } } })
  const session = startBarcodeCamera(video, { onReady: assert.fail, onCode: assert.fail, onError: failure.resolve })
  t.after(session.stop)
  assert.match(cameraErrorMessage(await failure.promise), /HTTPS hoặc localhost/)
})
