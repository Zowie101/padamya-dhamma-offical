// Lossy RGB + full-quality alpha; original zoom/export photos remain untouched.
import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
let sharp
try { sharp = require('sharp') } catch { sharp = require(path.resolve(path.dirname(process.execPath), '../node_modules/sharp')) }
await fs.mkdir('assets/images/optimized', { recursive: true })
const report = []
for (let n = 1; n <= 6; n++) {
  const stem = `buddha_${n}`
  for (let view = 1; view <= 3; view++) {
    const input = `assets/products/${stem}/${stem} (0${view})-transparent.png`
    const thumbnail = `assets/images/optimized/${stem}-0${view}-thumb.webp`
    await sharp(input).resize(192, 240, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 86, alphaQuality: 100 }).toFile(thumbnail)
    if (view === 1) {
      const poster = `assets/images/optimized/${stem}-front.webp`
      await sharp(input).resize(768, 900, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 90, alphaQuality: 100 }).toFile(poster)
      report.push({ input, originalBytes: (await fs.stat(input)).size, poster, posterBytes: (await fs.stat(poster)).size })
    }
  }
}
await fs.writeFile('assets/images/optimized/build-report.json', JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report))
