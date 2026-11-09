// Kopieert de zxing-wasm die vue-qrcode-reader gebruikt naar public/, zodat de scanner
// niet van een externe CDN afhankelijk is (wordt na npm install uitgevoerd).
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const detectorDir = dirname(require.resolve('barcode-detector/package.json', { paths: [dirname(require.resolve('vue-qrcode-reader'))] }))
const candidates = [
  join(detectorDir, 'node_modules/zxing-wasm/dist/reader/zxing_reader.wasm'),
  join(dirname(require.resolve('zxing-wasm/package.json', { paths: [detectorDir] })), 'dist/reader/zxing_reader.wasm'),
]
const source = candidates.find(existsSync)
if (!source) {
  console.warn('[zxing] zxing_reader.wasm niet gevonden; scanner valt terug op de CDN.')
  process.exit(0)
}
mkdirSync('public/zxing', { recursive: true })
copyFileSync(source, 'public/zxing/zxing_reader.wasm')
console.log('[zxing] wasm gekopieerd naar public/zxing/')
