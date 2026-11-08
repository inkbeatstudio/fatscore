// Сканер штрихкодів. На Android Chrome є вбудований BarcodeDetector,
// на iPhone (Safari) його немає — тоді вантажимо бібліотеку zxing-wasm (лише коли відкривають сканер).
type Detector = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };
const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];

let detector: Detector | null = null;
export async function getDetector(): Promise<Detector> {
  if (detector) return detector;
  const Native = (window as any).BarcodeDetector;
  if (Native) {
    try {
      const supported: string[] = await Native.getSupportedFormats();
      if (FORMATS.some(f => supported.includes(f))) {
        detector = new Native({ formats: FORMATS.filter(f => supported.includes(f)) });
        return detector!;
      }
    } catch { /* падаємо на бібліотеку */ }
  }
  const mod = await import('barcode-detector/ponyfill');
  mod.prepareZXingModule({
    overrides: { locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? new URL('zxing_reader.wasm', document.baseURI).href : prefix + path) }
  });
  detector = new mod.BarcodeDetector({ formats: FORMATS as any }) as unknown as Detector;
  return detector!;
}

export async function startCamera(video: HTMLVideoElement) {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
  video.srcObject = stream;
  video.setAttribute('playsinline', 'true');
  video.muted = true;
  await video.play();
  return stream;
}
export function stopCamera(stream?: MediaStream | null) { stream?.getTracks().forEach(t => t.stop()); }
export const cameraSupported = () => !!navigator.mediaDevices?.getUserMedia && window.isSecureContext;
