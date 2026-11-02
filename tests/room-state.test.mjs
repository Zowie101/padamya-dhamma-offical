import test from 'node:test'
import assert from 'node:assert/strict'
import { makePlacement, placementRect, localPoint, hitPlacement, isHorizontal, PlacementHistory, CameraLease, cameraError, cameraFrame } from '../assets/js/room-state.mjs'

test('live camera fills portrait and landscape outputs without stretching or reading outside the feed', () => {
  for (const [w,h] of [[1920,1080],[720,1280]]) for (const [vw,vh] of [[390,778],[844,340]]) {
    for (const layout of ['auto','portrait','landscape']) {
      const frame = cameraFrame(w,h,vw,vh,layout), c = frame.crop
      const expected = layout === 'portrait' ? 9/16 : layout === 'landscape' ? 16/9 : vw/vh
      assert.ok(Math.abs(c.width/c.height - expected) < 1e-10)
      assert.ok(c.x >= -1e-8 && c.y >= -1e-8 && c.x+c.width <= w+1e-8 && c.y+c.height <= h+1e-8)
      assert.ok(frame.width > 0 && frame.height > 0)
    }
  }
})

test('placement geometry keeps its foot anchored when size or rotation changes', () => {
  const item = makePlacement({ id: 'golden-presence', height: '28 cm' }, 'one')
  item.x = .4; item.y = .7; item.height = .3
  const normal = placementRect(item, { ratio: .8 }, 1600, 1000)
  assert.equal(normal.x, 640); assert.equal(normal.y, 700); assert.equal(normal.height, 300)
  const large = placementRect({ ...item, height: .6, rotation: 90 }, { ratio: .8 }, 1600, 1000)
  assert.equal(large.y, normal.y); assert.equal(large.height, normal.height * 2)
  const insideRotated = { x: large.x + 200, y: large.y }
  assert.ok(hitPlacement(insideRotated, large)); assert.ok(!hitPlacement({ x: 5, y: 5 }, large))
  assert.ok(Math.abs(localPoint(insideRotated, large).y + 200) < 1e-8)
})

test('undo restores independent snapshots after multiple placements and removals', () => {
  const history = new PlacementHistory(2), state = { placements: [{ id: 'a', x: .3 }], selected: 'a' }
  history.push(state); state.placements[0].x = .8
  history.push(state); state.placements.push({ id: 'b', x: .5 }); state.selected = 'b'
  assert.equal(history.undo().placements.length, 1)
  assert.equal(history.undo().placements[0].x, .3)
  assert.equal(history.undo(), null); assert.equal(history.canUndo, false)
  history.push({ a: 1 }); history.push({ a: 2 }); history.push({ a: 3 })
  assert.equal(history.entries.length, 2); history.clear(); assert.equal(history.canUndo, false)
})

test('surface placement accepts horizontal poses with either normal direction and rejects walls', () => {
  const floor = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, .2, -.6, -1, 1]
  assert.ok(isHorizontal(floor)); assert.ok(!isHorizontal(floor.map((v, i) => i === 5 ? 0 : v)))
  assert.ok(isHorizontal(floor.map((v, i) => i === 5 ? -1 : v)))
  assert.ok(!isHorizontal(floor.map((v, i) => i === 5 ? .6 : v)))
  assert.ok(!isHorizontal(null)); assert.ok(!isHorizontal([1, 2]))
})

test('camera cancellation stops a stream even if permission resolves after closing', async () => {
  const lease = new CameraLease(); let resolve, stopped = 0
  const pending = lease.open(() => new Promise(done => { resolve = done }))
  lease.stop(); resolve({ getTracks: () => [{ stop: () => stopped++ }] })
  assert.equal(await pending, null); assert.equal(stopped, 1); assert.equal(lease.stream, null)
})

test('switching cameras releases every previous track and cleanup is idempotent', async () => {
  const lease = new CameraLease(); let stops = 0
  const stream = () => ({ getTracks: () => [{ stop: () => stops++ }, { stop: () => stops++ }] })
  await lease.open(async () => stream()); await lease.open(async () => stream())
  assert.equal(stops, 2); lease.stop(); lease.stop(); assert.equal(stops, 4)
})

test('denied and missing cameras explain a usable photo fallback', async () => {
  const lease = new CameraLease()
  await assert.rejects(lease.open(async () => { throw Object.assign(Error('denied'), { name: 'NotAllowedError' }) }))
  assert.equal(lease.stream, null)
  assert.match(cameraError({ name: 'NotAllowedError' }), /permission.*room photo/)
  assert.match(cameraError({ name: 'NotFoundError' }), /No camera.*room photo/)
})
