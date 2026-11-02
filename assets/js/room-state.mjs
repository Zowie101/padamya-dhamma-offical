/* Pure placement geometry/history shared by the editor and its tests. */
export const MAX_PLACEMENTS = 8
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
export const clone = value => JSON.parse(JSON.stringify(value))

// Crop, never stretch, the live feed into the chosen output frame.
export function cameraFrame(width, height, viewWidth, viewHeight, layout = 'auto') {
  const aspect = layout === 'portrait' ? 9 / 16 : layout === 'landscape' ? 16 / 9 : Math.max(1, viewWidth) / Math.max(1, viewHeight)
  const cropWidth = Math.min(width, height * aspect)
  const cropHeight = cropWidth / aspect
  return { crop: { x: (width - cropWidth) / 2, y: (height - cropHeight) / 2, width: cropWidth, height: cropHeight },
    width: Math.max(1, Math.round(cropWidth)), height: Math.max(1, Math.round(cropHeight)) }
}

export function makePlacement(product, id, index = 0) {
  return { id, productId: product.id, x: clamp(.5 + index * .035, .1, .9), y: .76,
    height: clamp(parseFloat(product.height) / 90, .16, .48), rotation: 0 }
}

export function placementRect(item, sprite, width, height) {
  const h = item.height * height
  return { x: item.x * width, y: item.y * height, width: h * sprite.ratio, height: h,
    angle: item.rotation * Math.PI / 180 }
}

export function localPoint(point, rect) {
  const dx = point.x - rect.x, dy = point.y - rect.y
  const c = Math.cos(rect.angle), s = Math.sin(rect.angle)
  return { x: dx * c + dy * s, y: -dx * s + dy * c }
}

export function hitPlacement(point, rect, padding = 8) {
  const p = localPoint(point, rect)
  return Math.abs(p.x) <= rect.width / 2 + padding && p.y >= -rect.height - padding && p.y <= padding
}

export function isHorizontal(matrix) {
  // Column 1 is the hit pose's local up vector in world coordinates.
  // Some trackers return a reversed plane normal. Placement itself is kept upright.
  return matrix?.length === 16 && Number.isFinite(matrix[5]) && Math.abs(matrix[5]) > .92
}

export function cameraError(error) {
  if (['NotAllowedError', 'SecurityError'].includes(error?.name)) return 'Camera permission was not granted. Allow camera access in your browser settings, or use a room photo.'
  if (['NotFoundError', 'DevicesNotFoundError'].includes(error?.name)) return 'No camera was found. You can still upload a room photo.'
  if (['NotReadableError', 'TrackStartError'].includes(error?.name)) return 'The camera is busy or unavailable. Close other camera apps and try again, or use a room photo.'
  return 'The camera could not start. Try again over HTTPS, or use a room photo.'
}

export class PlacementHistory {
  constructor(limit = 40) { this.limit = limit; this.entries = [] }
  push(state) {
    const snapshot = clone(state)
    if (JSON.stringify(this.entries.at(-1)) === JSON.stringify(snapshot)) return
    this.entries.push(snapshot)
    if (this.entries.length > this.limit) this.entries.shift()
  }
  undo() { return this.entries.length ? this.entries.pop() : null }
  get canUndo() { return this.entries.length > 0 }
  clear() { this.entries.length = 0 }
}

export class CameraLease {
  constructor() { this.stream = null; this.epoch = 0 }
  async open(getUserMedia) {
    this.stop()
    const ticket = this.epoch
    const stream = await getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 } }, audio: false })
    if (ticket !== this.epoch) { stream.getTracks().forEach(track => track.stop()); return null }
    this.stream = stream
    return stream
  }
  stop() { this.epoch++; this.stream?.getTracks().forEach(track => track.stop()); this.stream = null }
}
