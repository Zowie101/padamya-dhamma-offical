// Shared two-finger manipulation for 3D AR and the photo/camera canvas.
export function touchPair(a, b) {
  return { distance: Math.hypot(b.x - a.x, b.y - a.y), angle: Math.atan2(b.y - a.y, b.x - a.x) }
}
export function gestureChange(start, current) {
  let angle = current.angle - start.angle
  // Crossing the -180/180 boundary should not jump a full turn.
  angle = Math.atan2(Math.sin(angle), Math.cos(angle))
  return { ratio: current.distance / Math.max(8, start.distance), degrees: angle * 180 / Math.PI }
}
export function wrapDegrees(value) { return ((value + 180) % 360 + 360) % 360 - 180 }
// Radians, shortest path, independent of the headset/display frame rate.
export function dampAngle(current, target, seconds) {
  const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current))
  return current + delta * (1 - Math.exp(-24 * Math.max(0, Math.min(seconds, .05))))
}

export function bindStatueGestures(element, { canStart, onStart, onChange, onEnd = () => {}, oneFingerRotate = false }) {
  const points = new Map(), controller = new AbortController()
  let start = null, singleOrigin = null, consumed = false, blockedUntil = 0
  const pair = () => touchPair(...[...points.values()].slice(0, 2))
  const block = event => { event.preventDefault(); event.stopImmediatePropagation() }
  function finish() {
    if (start) onEnd()
    start = null
    singleOrigin = null
    if (consumed) blockedUntil = Date.now() + 350
  }
  element.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch' || points.size >= 2) return
    const at = { x: event.clientX, y: event.clientY }
    if (!points.size && !canStart(at, event.target)) return
    // Never recruit a second finger on a slider, button or open panel.
    if (event.target.closest?.('button,a,input,select,textarea,[data-xr-ui],.room-panel,dialog')) return
    points.set(event.pointerId, at)
    if (points.size !== 2) { singleOrigin = at; return }
    if (pair().distance < 8) { points.delete(event.pointerId); return }
    if (start) onEnd()
    start = pair(); consumed = true; onStart()
    for (const id of points.keys()) { try { element.setPointerCapture(id) } catch {} }
    block(event)
  }, { capture: true, passive: false, signal: controller.signal })
  element.addEventListener('pointermove', event => {
    if (!points.has(event.pointerId)) return
    points.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (oneFingerRotate && points.size === 1 && singleOrigin && !consumed &&
        Math.abs(event.clientX - singleOrigin.x) >= 6) {
      start = { single: true }; consumed = true; onStart()
      try { element.setPointerCapture(event.pointerId) } catch {}
    }
    if (start?.single) onChange({ ratio: 1, degrees: (event.clientX - singleOrigin.x) * .5 })
    else if (start && points.size === 2) {
      const change = gestureChange(start, pair())
      // AR reserves two fingers for size; rotation is a one-finger swipe.
      if (oneFingerRotate) change.degrees = 0
      onChange(change)
    }
    if (consumed) block(event)
  }, { capture: true, passive: false, signal: controller.signal })
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    element.addEventListener(type, event => {
      if (!points.has(event.pointerId)) return
      // Moving implicit capture from a child to this overlay fires a bubbled
      // lostpointercapture from the child. The touch is still ours.
      if (type === 'lostpointercapture' && element.hasPointerCapture?.(event.pointerId)) return
      const wasConsumed = consumed
      points.delete(event.pointerId); finish()
      try { element.releasePointerCapture(event.pointerId) } catch {}
      if (!points.size) consumed = false
      if (wasConsumed) block(event)
    }, { capture: true, passive: false, signal: controller.signal })
  }
  return {
    get blocksPlacement() { return consumed || Date.now() < blockedUntil },
    dispose() {
      controller.abort(); finish()
      for (const id of points.keys()) { try { element.releasePointerCapture(id) } catch {} }
      points.clear(); consumed = false
    }
  }
}
