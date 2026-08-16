// Trim onnxruntime-web: keep only the wasm files needed for Node.js (simd-threaded)
// Runs automatically after `npm install` (Vercel re-installs on every deploy)
const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'node_modules', 'onnxruntime-web', 'dist');
if (!fs.existsSync(dist)) { console.log('[trim-ort] dist not found, skip'); process.exit(0); }

const KEEP = new Set([
  'ort-wasm-simd-threaded.mjs',
  'ort-wasm-simd-threaded.wasm',
  'ort.node.min.mjs',
  'ort.min.mjs',
  'ort.wasm.min.mjs',
  'ort.bundle.min.mjs',
  'ort.wasm.bundle.min.mjs',
  'ort.node.bundle.min.mjs',
]);
let removed = 0, freed = 0;
for (const f of fs.readdirSync(dist)) {
  if (KEEP.has(f)) continue;
  // always drop sourcemaps + non-Node variants
  if (f.endsWith('.map')) { const s = fs.statSync(path.join(dist, f)).size; fs.unlinkSync(path.join(dist, f)); removed++; freed += s; continue; }
  if (/\.(jsep|asyncify|jspi|webgl|webgpu)\./.test(f)) { const s = fs.statSync(path.join(dist, f)).size; fs.unlinkSync(path.join(dist, f)); removed++; freed += s; continue; }
  if (/^ort\.(all|webgl|webgpu|jspi|wasm)\./.test(f) && !KEEP.has(f)) { const s = fs.statSync(path.join(dist, f)).size; fs.unlinkSync(path.join(dist, f)); removed++; freed += s; continue; }
}
console.log(`[trim-ort] removed ${removed} files, freed ${(freed/1048576).toFixed(1)} MB`);
