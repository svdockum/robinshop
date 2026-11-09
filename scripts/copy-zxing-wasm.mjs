// Kopieert de zxing-wasm die vue-qrcode-reader gebruikt naar public/, zodat de scanner
// niet van een externe CDN afhankelijk is (wordt na npm install uitgevoerd).
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'

const candidates = [
  'node_modules/vue-qrcode-reader/node_modules/barcode-detector/node_modules/zxing-wasm/dist/reader/zxing_reader.wasm',
  'node_modules/vue-qrcode-reader/node_modules/zxing-wasm/dist/reader/zxing_reader.wasm',
  'node_modules/barcode-detector/node_modules/zxing-wasm/dist/reader/zxing_reader.wasm',
]
const source = candidates.find(existsSync)
if (!source) {
  console.warn('[zxing] zxing_reader.wasm niet gevonden; de scanner laadt hem dan van de CDN.')
  process.exit(0)
}
mkdirSync('public/zxing', { recursive: true })
copyFileSync(source, 'public/zxing/zxing_reader.wasm')
console.log(`[zxing] ${source} → public/zxing/zxing_reader.wasm`)
