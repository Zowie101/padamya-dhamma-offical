import { clamp, makePlacement, placementRect, localPoint, hitPlacement, PlacementHistory, CameraLease, cameraError, MAX_PLACEMENTS, cameraFrame } from './room-state.mjs?v=20261031-6'
import { isAppleMobile, supportsQuickLook, prepareQuickLook } from './room-ios.js?v=20261031-15'
import { bindStatueGestures, wrapDegrees } from './room-gestures.mjs?v=20261101-3'

const api = window.SacredForm
const $ = id => document.getElementById(id)
const products = api.products
let product = api.getProduct(new URLSearchParams(location.search).get('piece'))
const canvas = $('roomCanvas'), context = canvas.getContext('2d'), wrap = $('canvasWrap')
const history = new PlacementHistory(), cameraLease = new CameraLease(), listeners = new AbortController()
const sprites = new Map(), backgrounds = new Map(), downloads = new Set()
let photoScene = { placements: [], selected: null }, cameraScene = { placements: [], selected: null }
let mode = 'photo', backgroundId = 'console', nextId = 1, drag = null, sliderEdit = false
let rotationInputActive = false
let controlsMotion = null
const appleMobile = isAppleMobile()
let iosAbort = null, iosProductId = null
let epoch = 0, uploadEpoch = 0, videoFrame = 0, noticeTimer, disposed = false, xr = null, xrAbort = null, cameraStarting = false
let arSupported = false, xrModulePromise = null, xrState = { ready: false, placed: false, scale: 1, rotation: 0 }
const on = (target, type, handler, options = {}) => target.addEventListener(type, handler, { ...options, signal: listeners.signal })
const scene = () => mode === 'camera' ? cameraScene : photoScene
const selected = () => scene().placements.find(item => item.id === scene().selected)
const byId = id => products.find(p => p.id === id) || products[0]
const isXR = () => mode === 'xr'

function notice(message, persistent = false) {
  clearTimeout(noticeTimer); $('roomNotice').textContent = message; $('roomNotice').hidden = false
  if (!persistent) noticeTimer = setTimeout(() => { $('roomNotice').hidden = true }, 5500)
}
function loading(message) { $('roomLoading').hidden = !message; $('roomLoading').querySelector('p').textContent = message || '' }
function checkpoint() { if (!isXR()) history.push(scene()); updateUndo() }
function updateUndo() { $('undoPlacement').disabled = isXR() || !history.canUndo }

async function loadImage(src) { const image = new Image(); image.src = src; await image.decode(); return image }
async function spriteFor(p) {
  if (sprites.has(p.id)) return await sprites.get(p.id)
  const pending = (async () => {
    const image = await loadImage(p.image)
    // Find the actual cutout bounds so all six original image margins behave consistently.
    const sample = document.createElement('canvas'); sample.width = sample.height = 320
    const ctx = sample.getContext('2d', { willReadFrequently: true }); ctx.drawImage(image, 0, 0, 320, 320)
    const pixels = ctx.getImageData(0, 0, 320, 320).data
    let left = 320, top = 320, right = 0, bottom = 0
    for (let y = 0; y < 320; y++) for (let x = 0; x < 320; x++) if (pixels[(y * 320 + x) * 4 + 3] > 48) {
      left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y)
    }
    if (right <= left || bottom <= top) throw Error('Empty product image')
    const crop = { x: Math.max(0, left - 1) / 320 * image.width, y: Math.max(0, top - 1) / 320 * image.height,
      width: Math.min(320 - Math.max(0, left - 1), right - left + 3) / 320 * image.width,
      height: Math.min(320 - Math.max(0, top - 1), bottom - top + 3) / 320 * image.height }
    const sprite = { image, crop, ratio: crop.width / crop.height }
    sprites.set(p.id, sprite); return sprite
  })()
  sprites.set(p.id, pending)
  try { return await pending } catch (error) { sprites.delete(p.id); throw error }
}

function source() {
  const video = $('roomCamera')
  if (mode === 'camera' && cameraLease.stream && video.videoWidth) return { image: video,
    ...cameraFrame(video.videoWidth, video.videoHeight, wrap.clientWidth, wrap.clientHeight, $('cameraLayout').value) }
  const bg = backgrounds.get(backgroundId)
  return bg ? { image: bg.image, width: bg.image.width, height: bg.image.height } : null
}
function fitCanvas() {
  if (isXR()) return
  const bg = source(); if (!bg || !wrap.clientWidth || !wrap.clientHeight) return
  const illustrated = mode === 'photo' && ['console', 'nook'].includes(backgroundId)
  const ratio = (illustrated ? Math.max : Math.min)(wrap.clientWidth / bg.width, wrap.clientHeight / bg.height)
  if (canvas.width !== bg.width || canvas.height !== bg.height) { canvas.width = bg.width; canvas.height = bg.height }
  canvas.style.width = `${bg.width * ratio}px`; canvas.style.height = `${bg.height * ratio}px`
}
function paint(ctx, bg, items, withSelection) {
  const width = ctx.canvas.width, height = ctx.canvas.height
  ctx.clearRect(0, 0, width, height); ctx.fillStyle = '#eee9de'; ctx.fillRect(0, 0, width, height)
  if (bg.crop) ctx.drawImage(bg.image, bg.crop.x, bg.crop.y, bg.crop.width, bg.crop.height, 0, 0, width, height)
  else ctx.drawImage(bg.image, 0, 0, width, height)
  const screenScale = width / Math.max(1, canvas.getBoundingClientRect().width)
  for (const item of items) {
    const sprite = sprites.get(item.productId); if (!sprite?.image) continue
    const r = placementRect(item, sprite, width, height)
    // The shadow stays on the supporting surface; the cutout pivots at its foot.
    ctx.save(); ctx.translate(r.x, r.y); ctx.scale(r.width * .58, Math.max(4, r.height * .025))
    const shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, 1); shadow.addColorStop(0, '#241a1055'); shadow.addColorStop(1, '#241a1000')
    ctx.fillStyle = shadow; ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill(); ctx.restore()
    ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(r.angle)
    const c = sprite.crop
    ctx.drawImage(sprite.image, c.x, c.y, c.width, c.height, -r.width / 2, -r.height, r.width, r.height)
    if (withSelection && item.id === scene().selected) {
      ctx.strokeStyle = '#b68d51'; ctx.lineWidth = 1.4 * screenScale; ctx.setLineDash([5 * screenScale, 4 * screenScale])
      ctx.strokeRect(-r.width / 2 - 6 * screenScale, -r.height - 6 * screenScale, r.width + 12 * screenScale, r.height + 12 * screenScale)
      ctx.setLineDash([]); ctx.fillStyle = '#fff9ea'; ctx.beginPath(); ctx.arc(r.width / 2, -r.height, 5 * screenScale, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    }
    ctx.restore()
  }
}
function draw() {
  document.body.classList.toggle('is-illustrated', mode === 'photo' && ['console', 'nook'].includes(backgroundId))
  if (disposed || isXR()) { $('deleteSelected').hidden = true; return }
  fitCanvas(); const bg = source()
  $('roomPhotoEmpty').hidden = mode !== 'photo' || Boolean(bg)
  canvas.hidden = !bg
  if (!bg) { $('deleteSelected').hidden = true; return }
  paint(context, bg, scene().placements, true)
  positionDeleteButton()
}
function positionDeleteButton() {
  const item = selected(), sprite = item && sprites.get(item.productId), button = $('deleteSelected')
  button.hidden = !sprite?.image || isXR()
  if (button.hidden) return
  const r = placementRect(item, sprite, canvas.width, canvas.height)
  const image = canvas.getBoundingClientRect(), bounds = wrap.getBoundingClientRect()
  // Delete follows the rotated top-left corner; scaling stays top-right.
  const x = r.x - r.width / 2 * Math.cos(r.angle) + r.height * Math.sin(r.angle)
  const y = r.y - r.width / 2 * Math.sin(r.angle) - r.height * Math.cos(r.angle)
  button.style.left = `${clamp(image.left - bounds.left + x * image.width / canvas.width, 22, bounds.width - 22)}px`
  button.style.top = `${clamp(image.top - bounds.top + y * image.height / canvas.height, 22, bounds.height - 22)}px`
  button.setAttribute('aria-label', `Remove ${byId(item.productId).name} from preview`)
}
function videoLoop() { if (mode !== 'camera' || disposed) return; draw(); videoFrame = requestAnimationFrame(videoLoop) }

function updateReadouts() {
  const item = selected()
  if (isXR()) {
    $('roomSizeValue').textContent = `${Math.round(xrState.scale * 100)}%`
    $('roomRotationValue').textContent = `${Math.round(xrState.rotation)}°`
  } else {
    $('roomSizeValue').textContent = item ? `${Math.round(item.height * 100)}%` : '—'
    $('roomRotationValue').textContent = `${item?.rotation || 0}°`
  }
}
function updatePanel(rebuild = true) {
  const item = selected(); if (!isXR() && item) product = byId(item.productId)
  $('roomProductImage').src = product.image; $('roomProductImage').alt = product.name + ' — front view'
  $('welcomeProductImage').src = product.image
  $('roomProductName').textContent = product.name; $('roomProductPrice').textContent = api.money(product.price)
  $('livePieceSummary').textContent = `${product.name} · ${api.money(product.price)}`
  $('roomProductSelect').value = product.id
  $('roomBackground').value = backgroundId
  for (const id of ['closeRoom', 'welcomeClose', 'roomProductDetails']) $(id).href = `product.html?id=${encodeURIComponent(product.id)}`
  $('roomSize').min = isXR() ? '50' : '10'; $('roomSize').max = isXR() ? '200' : '80'
  $('roomSize').value = isXR() ? Math.round(xrState.scale * 100) : Math.round((item?.height || .32) * 100)
  $('manualDistanceField').hidden = !isXR()
  $('arDiagnostics').hidden = !isXR()
  $('manualDistance').value = Math.round((xrState.distance || .65) * 100)
  $('manualDistanceValue').textContent = `${(xrState.distance || .65).toFixed(2)} m`
  $('manualDistance').disabled = !isXR() || !xrState.ready || xrState.placed || xrState.hasSurface
  if (!rotationInputActive) $('roomRotation').value = isXR() ? xrState.rotation : item?.rotation || 0
  const editable = isXR() ? xrState.ready : Boolean(item)
  for (const id of ['roomSize', 'roomRotation', 'resetPosition', 'removePlacement']) $(id).disabled = !editable
  $('addPlacement').hidden = isXR(); $('suggestedField').hidden = isXR(); $('backgroundField').hidden = mode !== 'photo'
  $('uploadRoomButton').hidden = isXR()
  $('placementCount').textContent = isXR() ? (xrState.placed ? '1 piece placed' : 'Find a surface') : `${scene().placements.length} ${scene().placements.length === 1 ? 'piece' : 'pieces'}`
  if (rebuild) {
    $('roomPlacements').replaceChildren()
    if (!isXR()) for (const [index, placement] of scene().placements.entries()) {
      const p = byId(placement.productId), button = document.createElement('button'), image = new Image()
      button.type = 'button'; button.dataset.placement = placement.id; button.setAttribute('aria-pressed', String(placement.id === scene().selected))
      button.setAttribute('aria-label', `Select ${p.name}, placement ${index + 1}`); image.src = p.image; image.alt = ''; button.append(image); $('roomPlacements').append(button)
    }
  }
  updateReadouts(); updateUndo()
}

async function addPiece(recordHistory = true) {
  if (isXR()) return
  if (scene().placements.length >= MAX_PLACEMENTS) { notice(`You can arrange up to ${MAX_PLACEMENTS} statues in one preview.`); return }
  const p = product
  const ticket = epoch, targetScene = scene()
  try {
    await spriteFor(p); if (disposed || isXR() || ticket !== epoch || targetScene !== scene()) return
    if (recordHistory) checkpoint()
    const placement = makePlacement(p, `piece-${nextId++}`, scene().placements.length)
    if (mode === 'photo' && backgroundId !== 'upload') placement.y = backgroundId === 'console' ? .714 : .701
    scene().placements.push(placement); scene().selected = placement.id; updatePanel(); draw()
  } catch { notice('The product photo could not load. Choose another statue or refresh the page.') }
}
function undo() {
  finishDrag(); const previous = history.undo(); if (!previous || isXR()) return
  if (mode === 'camera') cameraScene = previous; else photoScene = previous
  sliderEdit = false; updatePanel(); draw(); notice('Last statue edit undone.')
}
function removeSelected() {
  if (isXR()) { xr?.remove(); return }
  const item = selected(); if (!item) return
  checkpoint(); scene().placements = scene().placements.filter(p => p.id !== item.id)
  scene().selected = scene().placements.at(-1)?.id || null; updatePanel(); draw()
}
function resetPosition() {
  if (isXR()) { xr?.reset(); return }
  const item = selected(); if (!item) return
  const y = mode === 'photo' && backgroundId === 'console' ? .714 : mode === 'photo' && backgroundId === 'nook' ? .701 : .76
  checkpoint(); Object.assign(item, { x: .5, y, rotation: 0 }); updatePanel(); draw()
}
function resetWorkspace() {
  if (isXR()) { xr?.reset(); return }
  checkpoint(); scene().placements = []; scene().selected = null; addPiece(false)
}

function point(event) { const r = canvas.getBoundingClientRect(); return { x: (event.clientX - r.left) * canvas.width / r.width, y: (event.clientY - r.top) * canvas.height / r.height } }
function finishDrag(event) {
  const finished = drag; drag = null
  if (finished) { try { canvas.releasePointerCapture(finished.pointerId) } catch { /* Pointer may already be released. */ } }
  // Open on a completed tap, so dragging/resizing does not raise a sheet
  // underneath the finger or interrupt statue placement.
  if (mode === 'camera' && event?.type === 'pointerup' && finished && !finished.saved && !finished.resizing &&
      $('toggleRoomControls').getAttribute('aria-expanded') !== 'true') setControlsOpen(true)
}
let gestureItem, gestureBaseline
const canvasGestures = bindStatueGestures(canvas, {
  canStart(at) {
    if (isXR() || disposed) return false
    const r = canvas.getBoundingClientRect()
    const point = { x: (at.x - r.left) * canvas.width / r.width, y: (at.y - r.top) * canvas.height / r.height }
    return scene().placements.some(item => sprites.get(item.productId)?.image &&
      hitPlacement(point, placementRect(item, sprites.get(item.productId), canvas.width, canvas.height), 7))
  },
  onStart() {
    // The first finger has already selected the piece through ordinary drag.
    drag = null
    gestureItem = selected(); gestureBaseline = gestureItem && { ...gestureItem }
    if (gestureItem) checkpoint()
  },
  onChange({ ratio, degrees }) {
    if (!gestureItem || selected() !== gestureItem || isXR()) return
    gestureItem.height = clamp(gestureBaseline.height * ratio, .1, .8)
    gestureItem.rotation = wrapDegrees(gestureBaseline.rotation + degrees)
    $('roomSize').value = Math.round(gestureItem.height * 100)
    $('roomRotation').value = Math.round(gestureItem.rotation)
    updateReadouts(); draw()
  },
  onEnd() { gestureItem = null; gestureBaseline = null }
})
on(canvas, 'pointerdown', event => {
  if (isXR() || event.button !== 0 || drag) return
  const at = point(event), scale = canvas.width / Math.max(1, canvas.clientWidth)
  let item = selected(), resizing = false
  if (item && sprites.get(item.productId)?.image) {
    const r = placementRect(item, sprites.get(item.productId), canvas.width, canvas.height), local = localPoint(at, r)
    resizing = Math.hypot(local.x - r.width / 2, local.y + r.height) < 20 * scale
  }
  if (!resizing) item = [...scene().placements].reverse().find(p => sprites.get(p.productId)?.image && hitPlacement(at, placementRect(p, sprites.get(p.productId), canvas.width, canvas.height), 7 * scale))
  if (!item) {
    if (mode === 'camera' && $('toggleRoomControls').getAttribute('aria-expanded') === 'true') {
      setControlsOpen(false)
      return
    }
    scene().selected = null; updatePanel(); draw(); return
  }
  scene().selected = item.id; updatePanel(); draw()
  drag = { pointerId: event.pointerId, item, start: { ...item }, startPoint: at, resizing, saved: false }
  canvas.setPointerCapture(event.pointerId); event.preventDefault()
})
on(canvas, 'pointermove', event => {
  if (!drag || event.pointerId !== drag.pointerId) return
  const at = point(event), dx = at.x - drag.startPoint.x, dy = at.y - drag.startPoint.y
  if (!drag.saved && Math.hypot(dx, dy) < 2) return
  if (!drag.saved) { checkpoint(); drag.saved = true }
  const item = drag.item, start = drag.start
  if (drag.resizing) {
    const x = start.x * canvas.width, y = start.y * canvas.height
    const initial = Math.max(1, Math.hypot(drag.startPoint.x - x, drag.startPoint.y - y))
    item.height = clamp(start.height * Math.hypot(at.x - x, at.y - y) / initial, .1, .8)
  } else { item.x = clamp(start.x + dx / canvas.width, .02, .98); item.y = clamp(start.y + dy / canvas.height, .05, .98) }
  $('roomSize').value = Math.round(item.height * 100); updateReadouts(); draw()
})
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) on(canvas, type, finishDrag)
for (const id of ['roomSize', 'roomRotation']) {
  on($(id), 'input', () => {
    const rawValue = Number($(id).value)
    const nearestQuarter = Math.round(rawValue / 90) * 90
    const value = id === 'roomRotation' && Math.abs(rawValue - nearestQuarter) <= 6 ? nearestQuarter : rawValue
    if (isXR()) {
      // Keep the raw slider position while applying the snapped angle, so small
      // keyboard steps can leave the magnetic zone instead of getting stuck.
      rotationInputActive = id === 'roomRotation'
      try { id === 'roomSize' ? xr?.setScale(value / 100) : xr?.setRotation(value) }
      finally { rotationInputActive = false }
      return
    }
    const item = selected(); if (!item) return
    if (!sliderEdit) { checkpoint(); sliderEdit = true }
    if (id === 'roomSize') item.height = clamp(value / 100, .1, .8); else item.rotation = value
    updateReadouts(); draw()
  })
  on($(id), 'change', () => { sliderEdit = false })
}
on($('roomPlacements'), 'click', event => {
  const button = event.target.closest('[data-placement]'); if (!button) return
  scene().selected = button.dataset.placement; updatePanel(); draw()
  if (mode === 'camera' && $('toggleRoomControls').getAttribute('aria-expanded') !== 'true') setControlsOpen(true)
})
on($('roomProductSelect'), 'change', async () => {
  const next = byId($('roomProductSelect').value)
  if (isXR()) { product = next; updatePanel(); xr?.setProduct(next); return }
  const ticket = epoch, targetId = selected()?.id
  try {
    await spriteFor(next)
    if (disposed || ticket !== epoch || $('roomProductSelect').value !== next.id || selected()?.id !== targetId) return
    const item = selected()
    if (item) { checkpoint(); item.productId = next.id }
    product = next; updatePanel(); draw()
  } catch { notice('The preview image could not load. Try another piece.'); updatePanel() }
})
on($('suggestedPosition'), 'change', () => {
  const positions = { table: [.5, .714, .28], shelf: [.7, .49, .22], altar: [.5, .76, .36], floor: [.5, .94, .44] }
  const item = selected(), preset = positions[$('suggestedPosition').value]
  if (!item || !preset || isXR()) return
  checkpoint(); [item.x, item.y, item.height] = preset; item.rotation = 0; updatePanel(); draw(); $('suggestedPosition').value = ''
  notice('Suggested photo position applied. Adjust it to your actual surface.')
})
on(canvas, 'keydown', event => {
  if (isXR()) return
  const item = selected()
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); undo(); return }
  if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); removeSelected(); return }
  if (!item || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
  event.preventDefault(); checkpoint(); const step = event.shiftKey ? .05 : .01
  if (event.key === 'ArrowLeft') item.x = clamp(item.x - step, .02, .98)
  if (event.key === 'ArrowRight') item.x = clamp(item.x + step, .02, .98)
  if (event.key === 'ArrowUp') item.y = clamp(item.y - step, .05, .98)
  if (event.key === 'ArrowDown') item.y = clamp(item.y + step, .05, .98)
  draw()
})

function stopCamera() {
  cancelAnimationFrame(videoFrame); videoFrame = 0; cameraLease.stop()
  const video = $('roomCamera'); video.pause(); video.srcObject = null
}
function cancelCameraStart() {
  if (!cameraStarting) return
  epoch++; cameraStarting = false; stopCamera(); loading(null)
  $('cameraCompatibility').textContent = 'Camera request cancelled. You can try again or use a room photo.'
}
function endXR() {
  const active = xr, controller = xrAbort
  xr = null; xrAbort = null; controller?.abort()
  return active?.end() || Promise.resolve()
}
function setControlsOpen(open, animate = true) {
  controlsMotion?.cancel(); controlsMotion = null
  document.body.classList.remove('is-controls-closing')
  $('toggleRoomControls').setAttribute('aria-expanded', String(open))
  $('toggleRoomControls').textContent = 'Controls'
  if (!animate || mode === 'photo' || (window.SacredAccessibility?.reduceMotion() ?? matchMedia('(prefers-reduced-motion: reduce)').matches)) {
    document.body.classList.toggle('is-controls-open', open)
    draw(); return
  }
  if (open) document.body.classList.add('is-controls-open')
  else if (!document.body.classList.contains('is-controls-open')) return
  if (!open) document.body.classList.add('is-controls-closing')
  const sidePanel = matchMedia('(min-width:1001px), (orientation:landscape)').matches
  const outside = sidePanel ? 'translateX(calc(100% + 32px))' : 'translateY(calc(100% + 32px))'
  const frames = [{ transform: outside, opacity: .3 }, { transform: 'translate(0,0)', opacity: 1 }]
  const motion = $('roomControlPanel').animate(open ? frames : [...frames].reverse(), {
    duration: open ? 340 : 150, easing: open ? 'cubic-bezier(.22,1,.36,1)' : 'cubic-bezier(.4,0,1,1)', fill: 'both'
  })
  controlsMotion = motion
  motion.finished.then(() => {
    if (controlsMotion !== motion) return
    if (!open) document.body.classList.remove('is-controls-open', 'is-controls-closing')
    controlsMotion = null; motion.cancel(); draw()
  }).catch(() => { /* A newer toggle or mode change cancelled this motion. */ })
}
function modeUI() {
  document.body.classList.toggle('is-xr', isXR()); document.body.classList.toggle('is-camera', mode === 'camera')
  document.body.classList.toggle('is-live', mode !== 'photo')
  if (mode === 'photo') {
    setControlsOpen(false, false)
  }
  $('toggleRoomControls').hidden = mode === 'photo'
  $('cameraLayoutField').hidden = mode !== 'camera'
  $('modeIndicator').textContent = isXR() ? 'AR preview' : mode === 'camera' ? 'Manual camera' : 'PHOTO PREVIEW · 2D'
  $('arCaptureHelp').hidden = true
  $('downloadRoom').querySelector('span').textContent = isXR() ? 'Capture' : 'Save image'
  $('downloadRoom').setAttribute('aria-label', isXR() ? 'How to capture your AR view' : 'Save room preview image')
  $('photoMode').setAttribute('aria-pressed', String(mode === 'photo')); $('liveMode').setAttribute('aria-pressed', String(mode !== 'photo'))
  $('sceneCaption').textContent = mode === 'camera' ? 'Manual placement · no surface detection or tracking' : backgroundId === 'empty' ? 'Add your room photo' : backgroundId === 'upload' ? 'Your room photo · approximate visual scale' : 'Illustrated room · approximate photo scale'
  $('privacyNote').textContent = isXR() ? 'Camera access managed by your browser' : mode === 'camera' ? 'Camera stays on this device' : 'Your photos stay on your device'
  $('roomInstruction').textContent = isXR() ? 'Swipe the statue with one finger to rotate. Pinch with two fingers to resize.' : backgroundId === 'empty' && mode === 'photo' ? 'Choose a room photo to begin.' : 'Drag to position. Pinch to resize. Twist with two fingers to rotate.'
  $('xrPlacementActions').hidden = !isXR(); $('roomCanvas').hidden = isXR()
  $('deleteSelected').hidden = isXR()
  updatePanel(); draw()
}
async function photoMode(openPicker = false) {
  const switching = mode !== 'photo'
  epoch++; cameraStarting = false; stopCamera(); endXR(); mode = 'photo'; if (switching) history.clear(); finishDrag()
  $('roomWelcome').close(); $('roomLiveDialog').close(); $('arCaptureHelp').hidden = true; loading(null); modeUI()
  if (!photoScene.placements.length) await addPiece(false)
  if (openPicker) $('roomUpload').click()
}
async function readRoomPhoto(file) {
  if (!file) return
  const ticket = ++uploadEpoch
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type) || file.size > 12 * 1024 * 1024) { notice('Choose a JPG, PNG, WebP or AVIF photo up to 12 MB.'); return }
  loading('Opening your room photo…')
  const url = URL.createObjectURL(file)
  try {
    const image = await loadImage(url)
    if (ticket !== uploadEpoch || disposed) return
    if (image.width < 128 || image.height < 128 || image.width * image.height > 40000000) throw Error('Image dimensions')
    const ratio = Math.min(1, 2400 / Math.max(image.width, image.height)), raster = document.createElement('canvas')
    raster.width = Math.round(image.width * ratio); raster.height = Math.round(image.height * ratio)
    const ctx = raster.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, raster.width, raster.height); ctx.drawImage(image, 0, 0, raster.width, raster.height)
    backgrounds.set('upload', { image: raster })
    if (!$('roomBackground').querySelector('[value="upload"]')) { const option = new Option('My room photo', 'upload'); $('roomBackground').add(option) }
    backgroundId = 'upload'; $('roomBackground').value = 'upload'
    if (mode !== 'photo') await photoMode(false)
    modeUI(); notice('Your room photo is ready. Drag a statue onto a surface.')
  } catch { if (ticket === uploadEpoch) notice('That photo could not be opened. Try a JPG or PNG, at least 128 px across and under 40 megapixels.') }
  finally { URL.revokeObjectURL(url); if (ticket === uploadEpoch) loading(null); $('roomUpload').value = '' }
}

async function checkCompatibility() {
  const secure = window.isSecureContext
  const cameraAvailable = secure && Boolean(navigator.mediaDevices?.getUserMedia)
  $('startCameraOverlay').disabled = !cameraAvailable
  $('cameraCompatibility').textContent = cameraAvailable ? 'You will be asked for camera permission. Nothing is recorded or uploaded.' : 'Camera access needs HTTPS (or localhost) and a browser with camera support. Room-photo mode still works.'
  try { arSupported = secure && Boolean(navigator.xr) && await navigator.xr.isSessionSupported('immersive-ar') } catch { arSupported = false }
  $('iosArSection').hidden = !appleMobile
  $('startSurfaceAr').hidden = appleMobile && !arSupported
  $('arHardwareNote').hidden = appleMobile && !arSupported
  $('welcomeArHint').textContent = arSupported ? 'Surface AR available; camera overlay also offered.' : 'Manual camera overlay, or use a room photo.'
  $('arCompatibility').textContent = arSupported
    ? 'This browser reports immersive AR support. Surface detection will be checked when you start.'
    : !secure ? 'Live surface AR requires HTTPS. This local network address can use room-photo placement.' : 'This browser does not offer immersive WebXR AR. Use the manual camera overlay or upload a room photo.'
  if (appleMobile) {
    $('welcomeArHint').textContent = 'Apple AR Quick Look, or a manual camera overlay.'
    $('arCompatibility').textContent = secure
      ? 'On iPhone and iPad, use Apple AR Quick Look for 3D room placement.'
      : 'Open your HTTPS preview link in Safari to use iPhone AR or the camera.'
    if ($('roomLiveDialog').open) setupQuickLook()
  }
  if (arSupported) {
    xrModulePromise = import('./room-xr.js?v=20261101-gestures-3')
    try { await xrModulePromise; if (!disposed) $('startSurfaceAr').disabled = false }
    catch { $('arCompatibility').textContent = 'The AR renderer could not load. Photo placement and camera overlay are still available.' }
  }
}
async function setupQuickLook() {
  if (!appleMobile || iosProductId === product.id) return
  $('iosArSection').hidden = false
  if (!window.isSecureContext || !supportsQuickLook()) {
    $('iosArStatus').textContent = 'Open this HTTPS link directly in Safari. Some in-app browsers cannot open Apple AR. Camera overlay and room photos are also available.'
    return
  }
  iosAbort?.abort(); iosAbort = new AbortController()
  const controller = iosAbort, p = product
  iosProductId = p.id
  $('iosArLink').hidden = true; $('iosArLink').removeAttribute('href')
  $('iosArImage').src = p.image
  try {
    const result = await prepareQuickLook({ product: p, mount: $('iosArModel'), signal: controller.signal,
      onStatus: message => { if (!controller.signal.aborted) $('iosArStatus').textContent = message } })
    if (disposed || controller.signal.aborted) { result.dispose(); return }
    $('iosArLink').href = result.url
    $('iosArLink').setAttribute('download', `${p.id}.usdz`)
    $('iosArLink').hidden = false
  } catch (error) {
    if (error.name === 'AbortError') return
    iosProductId = null
    $('iosArStatus').textContent = error.message || 'iPhone AR could not prepare. Try camera overlay or a room photo.'
  }
}
async function showLiveOptions() {
  if (isXR()) {
    const ticket = ++epoch
    await endXR()
    if (disposed || ticket !== epoch) return
    mode = 'photo'; modeUI()
  }
  $('roomWelcome').close(); if (!$('roomLiveDialog').open) $('roomLiveDialog').showModal()
  setupQuickLook()
}
async function startCamera() {
  const ticket = ++epoch; stopCamera(); cameraStarting = true; loading('Starting your camera…')
  $('cameraCompatibility').textContent = 'Waiting for camera permission. Allow access in the browser prompt, or close these options to cancel.'
  try {
    await endXR()
    if (ticket !== epoch || disposed) return
    if (isXR()) { mode = 'photo'; modeUI(); loading('Starting your camera…') }
    const stream = await cameraLease.open(navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices))
    if (!stream || ticket !== epoch || disposed) return
    const video = $('roomCamera'); video.srcObject = stream; await video.play()
    if (ticket !== epoch || disposed) { stopCamera(); return }
    mode = 'camera'; cameraScene = { placements: [], selected: null }; history.clear()
    $('roomLiveDialog').close(); $('roomWelcome').close(); modeUI(); await addPiece(false); videoLoop()
    for (const track of stream.getTracks()) track.addEventListener('ended', () => { if (mode === 'camera') { photoMode(); notice('The camera stopped. Your photo workspace is available.') } }, { once: true })
  } catch (error) {
    if (ticket !== epoch || disposed) return
    stopCamera()
    if (mode === 'camera') { mode = 'photo'; modeUI() }
    $('cameraCompatibility').textContent = cameraError(error); notice(cameraError(error), true)
  } finally { if (ticket === epoch) { cameraStarting = false; loading(null) } }
}
function updateXRState(value) {
  xrState = value
  if (!isXR()) return
  $('placeSurface').disabled = !value.ready || !value.hasSurface || !value.placing || value.removed
  $('placeManual').disabled = !value.ready || !value.tracking || !value.placing || value.hasSurface || value.removed
  $('moveSurface').disabled = !value.ready || (!value.placed && !value.removed)
  $('placeSurface').hidden = !value.ready || !value.tracking || !value.placing || !value.hasSurface || value.removed
  $('placeManual').hidden = !value.ready || !value.tracking || !value.placing || value.hasSurface || value.removed
  $('moveSurface').hidden = !value.ready || (!value.placed && !value.removed)
  $('modeIndicator').textContent = !value.ready ? 'Loading statue' : value.removed ? 'Statue removed' : value.placed ? (value.manuallyPlaced ? 'Placed manually' : 'Placed') : value.hasSurface ? 'Surface ready' : 'AR preview'
  updatePanel(false)
}
async function startXR() {
  if (!arSupported || !xrModulePromise) return
  const ticket = ++epoch; stopCamera(); endXR(); xrAbort = new AbortController()
  xrState = { ready: false, placed: false, placing: true, hasSurface: false, tracking: false, manuallyPlaced: false, removed: false, scale: 1, rotation: 0, distance: .65 }
  $('roomLiveDialog').close(); $('roomWelcome').close(); mode = 'xr'; modeUI()
  try {
    // The module is prepared during compatibility checking, before this click.
    const module = await xrModulePromise
    const active = await module.startSurfaceAR({ mount: $('roomStage'), overlay: $('roomOverlay'), product, signal: xrAbort.signal,
      onStatus: message => { if (mode === 'xr') $('roomInstruction').textContent = message },
      onState: updateXRState, onError: message => notice(message, true),
      onEnd: () => { if (mode === 'xr' && ticket === epoch && !disposed) { xr = null; mode = 'photo'; modeUI(); notice('Live AR ended. Your room-photo workspace is ready.') } } })
    if (ticket !== epoch || disposed) { active.end(); return }
    xr = active
  } catch (error) {
    if (ticket !== epoch || disposed || error.name === 'AbortError') return
    mode = 'photo'; modeUI()
    $('arCompatibility').textContent = error.name === 'NotAllowedError'
      ? 'AR permission was not granted. You can try again or use a room photo.'
      : 'This device could not start AR with surface detection and on-screen controls. Try the camera overlay or a room photo.'
    $('roomLiveDialog').showModal()
  }
}

async function exportBlob() {
  if (isXR()) {
    // A modal dialog makes the rest of the DOM overlay inert and may not appear
    // in an immersive session. Keep capture guidance inside the active overlay.
    setControlsOpen(false, false)
    $('arCaptureHelp').hidden = false
    return null
  }
  fitCanvas()
  const bg = source(); if (!bg) throw Error('The room image is not ready yet.')
  let output = document.createElement('canvas'); output.width = canvas.width; output.height = canvas.height
  paint(output.getContext('2d'), bg, scene().placements, false)
  if (mode === 'photo' && ['console', 'nook'].includes(backgroundId)) {
    // Export the same centre-cropped illustrated composition visible in the workspace.
    const frame = cameraFrame(output.width, output.height, wrap.clientWidth, wrap.clientHeight)
    const cropped = document.createElement('canvas'); cropped.width = frame.width; cropped.height = frame.height
    const c = frame.crop
    cropped.getContext('2d').drawImage(output, c.x, c.y, c.width, c.height, 0, 0, cropped.width, cropped.height)
    output = cropped
  }
  return await new Promise((resolve, reject) => output.toBlob(blob => blob ? resolve(blob) : reject(Error('The image could not be saved.')), 'image/png'))
}
function download(blob) {
  const url = URL.createObjectURL(blob); downloads.add(url)
  const link = document.createElement('a'); link.href = url; link.download = `sacred-form-${product.id}-room.png`; document.body.append(link); link.click(); link.remove()
  setTimeout(() => { URL.revokeObjectURL(url); downloads.delete(url) }, 60000)
}
async function saveImage(share = false) {
  try {
    const blob = await exportBlob(); if (!blob) return
    if (share) {
      const file = new File([blob], `sacred-form-room.png`, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'My Padamya Dhamma room' }); return }
      notice('File sharing is unavailable here. Your preview has been downloaded instead.')
    }
    download(blob)
  } catch (error) { if (error.name !== 'AbortError') notice(error.message || 'Your preview could not be saved. Try again.') }
}

on($('roomUpload'), 'change', () => readRoomPhoto($('roomUpload').files[0]))
on($('uploadRoomButton'), 'click', () => $('roomUpload').click())
on($('roomBackground'), 'change', () => { backgroundId = $('roomBackground').value; modeUI() })
on($('cameraLayout'), 'change', () => { finishDrag(); draw() })
on($('roomCamera'), 'resize', draw)
on($('toggleRoomControls'), 'click', () => {
  setControlsOpen($('toggleRoomControls').getAttribute('aria-expanded') !== 'true')
  $('arCaptureHelp').hidden = true
  draw()
})
on($('choosePhoto'), 'click', () => { backgroundId = 'empty'; photoMode(false); $('roomUpload').click() })
on($('chooseEmptyPhoto'), 'click', () => $('roomUpload').click())
on($('chooseSample'), 'click', () => { backgroundId = 'console'; $('roomBackground').value = 'console'; photoMode(false) })
on($('chooseLive'), 'click', () => { backgroundId = 'empty'; draw(); showLiveOptions() }); on($('liveMode'), 'click', showLiveOptions)
on($('photoMode'), 'click', () => photoMode(false)); on($('fallbackPhoto'), 'click', () => { photoMode(false); $('roomUpload').click() })
on($('closeLiveDialog'), 'click', () => { cancelCameraStart(); $('roomLiveDialog').close() })
on($('roomLiveDialog'), 'cancel', cancelCameraStart)
on($('startCameraOverlay'), 'click', startCamera); on($('startSurfaceAr'), 'click', startXR)
on($('addPlacement'), 'click', () => addPiece()); on($('removePlacement'), 'click', removeSelected)
on($('deleteSelected'), 'pointerdown', event => event.stopPropagation())
on($('deleteSelected'), 'click', event => { event.stopPropagation(); finishDrag(); removeSelected() })
on($('roomStage'), 'pointerdown', event => {
  // Empty letterboxed space also dismisses controls; statue and UI taps do not.
  if (mode === 'camera' && (event.target === wrap || event.target === $('roomStage')) &&
      $('toggleRoomControls').getAttribute('aria-expanded') === 'true') setControlsOpen(false)
})
on($('resetPosition'), 'click', resetPosition); on($('resetRoom'), 'click', resetWorkspace); on($('undoPlacement'), 'click', undo)
on($('downloadRoom'), 'click', () => saveImage())
on($('captureHelpClose'), 'click', () => { $('arCaptureHelp').hidden = true })
on($('captureUseOverlay'), 'click', () => { $('arCaptureHelp').hidden = true; startCamera() })
on(document, 'keydown', event => { if (event.key === 'Escape' && !$('arCaptureHelp').hidden) { event.preventDefault(); $('arCaptureHelp').hidden = true } })
on($('placeSurface'), 'click', () => xr?.place()); on($('moveSurface'), 'click', () => xr?.move())
on($('placeManual'), 'click', () => xr?.placeManual())
on($('manualDistance'), 'input', () => xr?.setDistance(Number($('manualDistance').value) / 100))
function arDisplayReport() {
  const report = xr?.getDiagnostics()
  const text = report ? JSON.stringify(report, null, 2) : 'Start 3D AR and wait for the model to finish loading, then check again.'
  $('arDisplayReport').textContent = text
  return text
}
on($('checkArDisplay'), 'click', arDisplayReport)
on($('copyArDetails'), 'click', async () => {
  const report = arDisplayReport()
  try { await navigator.clipboard.writeText(report); notice('AR display details copied. No camera images are included.') }
  catch { notice('Copy is unavailable here. You can select the display details below.') }
})
on($('roomAddToBag'), 'click', () => { api.addToCart(product.id, 1); $('roomCartFeedback').textContent = `${product.name} added to your bag.` })
on($('roomStage'), 'dragover', event => { if (!isXR()) event.preventDefault() })
on($('roomStage'), 'drop', event => { if (isXR()) return; event.preventDefault(); readRoomPhoto(event.dataTransfer.files[0]) })
for (const element of document.querySelectorAll('[data-xr-ui],dialog')) on(element, 'beforexrselect', event => event.preventDefault())
on(window, 'pointerup', () => { sliderEdit = false })
on(window, 'resize', draw)
const resizeObserver = new ResizeObserver(draw); resizeObserver.observe(wrap)
on(document, 'visibilitychange', () => {
  if (!document.hidden) return
  cancelCameraStart()
  if (mode === 'camera') { photoMode(false); notice('Camera paused while the page was hidden. Choose Live camera to restart.') }
  else if (isXR()) { epoch++; endXR(); mode = 'photo'; modeUI() }
})
function dispose() {
  if (disposed) return
  disposed = true; canvasGestures.dispose(); iosAbort?.abort(); controlsMotion?.cancel(); controlsMotion = null; epoch++; uploadEpoch++; finishDrag(); clearTimeout(noticeTimer); stopCamera(); endXR(); resizeObserver.disconnect(); listeners.abort()
  downloads.forEach(url => URL.revokeObjectURL(url)); downloads.clear(); sprites.clear(); backgrounds.clear(); history.clear()
}
on(window, 'pagehide', dispose)
// Restore a fresh editor if the browser returns via its back/forward cache.
window.addEventListener('pageshow', event => { if (event.persisted && disposed) location.reload() })

async function boot() {
  const entry = new URLSearchParams(location.search).get('entry')
  if (entry === 'upload' || entry === 'live') backgroundId = 'empty'
  for (const p of products) $('roomProductSelect').add(new Option(p.name, p.id))
  updatePanel(); checkCompatibility()
  if (entry === 'live') showLiveOptions()
  else if (entry !== 'sample' && entry !== 'upload') $('roomWelcome').showModal()
  try {
    const [consoleRoom, nook] = await Promise.all([loadImage('assets/images/room-console.svg'), loadImage('assets/images/room-nook.svg')])
    backgrounds.set('console', { image: consoleRoom }); backgrounds.set('nook', { image: nook })
    if (mode === 'photo' && !photoScene.placements.length) await addPiece(false)
    modeUI()
    for (const p of products) spriteFor(p).then(draw).catch(() => {})
  } catch { notice('The room preview could not load. Refresh the page or upload your own room photo.', true) }
}
boot()



