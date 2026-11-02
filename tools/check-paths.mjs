// Validate local references after reorganizing; no server or dependencies needed.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const failures = [], checked = new Set()
function check(from, reference) {
  if (!reference || /^(?:[a-z]+:|#|\/\/)/i.test(reference) || /\$\{|[<>]/.test(reference)) return
  let target
  try { target = decodeURIComponent(reference.split(/[?#]/)[0]) } catch { return }
  if (!target) return
  const resolved = path.resolve(path.dirname(from), target)
  checked.add(resolved)
  if (!fs.existsSync(resolved)) failures.push(`${path.relative(root, from)} → ${reference}`)
}
for (const file of fs.readdirSync(root).filter(file => file.endsWith('.html'))) {
  const full = path.join(root, file), html = fs.readFileSync(full, 'utf8')
  for (const match of html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/g)) check(full, match[1])
  for (const match of html.matchAll(/<script[^>]+type="importmap"[^>]*>([\s\S]*?)<\/script>/g)) {
    for (const reference of Object.values(JSON.parse(match[1]).imports || {})) check(full, reference)
  }
}
for (const file of fs.readdirSync(path.join(root, 'assets/css'))) {
  const full = path.join(root, 'assets/css', file), css = fs.readFileSync(full, 'utf8')
  for (const match of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) check(full, match[1])
}
for (const file of fs.readdirSync(path.join(root, 'assets/js'))) {
  const full = path.join(root, 'assets/js', file), js = fs.readFileSync(full, 'utf8')
  for (const match of js.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*)["'](\.[^"']+)["']/g)) check(full, match[1])
  // Runtime product/background URLs resolve against the root storefront page.
  for (const match of js.matchAll(/["'`](assets\/[^"'`]+\.(?:png|jpe?g|webp|avif|svg|glb))["'`]/g)) check(path.join(root, 'index.html'), match[1])
}
for (const full of [path.join(root, 'README.md'), ...fs.readdirSync(path.join(root,'docs')).map(file=>path.join(root,'docs',file))]) {
  const text = fs.readFileSync(full,'utf8')
  for(const match of text.matchAll(/\]\(([^)]+)\)/g)) check(full,match[1])
}
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1 }
else console.log(`Checked ${checked.size} local paths: no missing page, stylesheet, script, font, icon, image, model or guide references.`)
