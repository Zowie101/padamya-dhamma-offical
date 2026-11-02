import test from 'node:test'
import assert from 'node:assert/strict'
import { touchPair, gestureChange, wrapDegrees, bindStatueGestures, dampAngle } from '../assets/js/room-gestures.mjs'

test('pinch is proportional and twisting crosses the angle boundary smoothly', () => {
  const initial = touchPair({x:0,y:0}, {x:100,y:0})
  const result = gestureChange(initial, touchPair({x:0,y:0}, {x:0,y:200}))
  assert.equal(result.ratio, 2); assert.equal(result.degrees, 90)
  const boundary = gestureChange({distance:100,angle:179*Math.PI/180}, {distance:50,angle:-179*Math.PI/180})
  assert.ok(Math.abs(boundary.degrees-2)<.00001); assert.equal(boundary.ratio,.5)
  assert.equal(wrapDegrees(200),-160); assert.equal(wrapDegrees(-200),160)
})

class Surface extends EventTarget {
  captures = new Set()
  setPointerCapture(id) { this.captures.add(id) }
  hasPointerCapture(id) { return this.captures.has(id) }
  releasePointerCapture(id) { this.captures.delete(id) }
  send(type, id, x, y, target) {
    const event = new Event(type, {cancelable:true})
    Object.assign(event, {pointerType:'touch',pointerId:id,clientX:x,clientY:y})
    if (target) Object.defineProperty(event,'target',{value:target})
    this.dispatchEvent(event); return event
  }
}
test('two-finger edits suppress accidental placement, end cleanly, and dispose listeners', () => {
  const surface = new Surface(); let starts=0, ends=0, value
  const gestures=bindStatueGestures(surface,{canStart:()=>true,onStart:()=>starts++,onChange:change=>value=change,onEnd:()=>ends++})
  assert.equal(surface.send('pointerdown',1,0,0).defaultPrevented,false)
  assert.equal(surface.send('pointerdown',2,100,0).defaultPrevented,true)
  surface.send('pointermove',2,200,0)
  assert.equal(starts,1); assert.equal(value.ratio,2); assert.equal(gestures.blocksPlacement,true)
  surface.send('pointerup',2,200,0)
  assert.equal(ends,1)
  assert.equal(surface.send('pointermove',1,20,0).defaultPrevented,true,'remaining finger must not start dragging')
  surface.send('pointercancel',1,20,0)
  assert.equal(surface.captures.size,0)
  gestures.dispose()
  surface.send('pointerdown',3,0,0); surface.send('pointerdown',4,100,0)
  assert.equal(starts,1)
})
test('gestures ignore empty space and never recruit a finger from a control', () => {
  const surface=new Surface(); let starts=0
  let allowed=false
  const gestures=bindStatueGestures(surface,{canStart:()=>allowed,onStart:()=>starts++,onChange:()=>{}})
  surface.send('pointerdown',1,0,0); surface.send('pointerdown',2,100,0)
  assert.equal(starts,0)
  allowed=true
  surface.send('pointerdown',3,0,0)
  surface.send('pointerdown',4,100,0,{closest:()=>true})
  assert.equal(starts,0)
  gestures.dispose()
})

test('AR uses one-finger rotation and two-finger resizing without twist or release jumps', () => {
  const surface = new Surface(); let starts=0, value
  const gestures=bindStatueGestures(surface,{
    oneFingerRotate:true,canStart:()=>true,onStart:()=>starts++,onChange:change=>value=change
  })
  surface.send('pointerdown',1,0,0)
  surface.send('pointermove',1,3,30)
  assert.equal(starts,0,'ignore small horizontal movement and vertical swipes')
  surface.send('pointermove',1,100,0)
  assert.equal(starts,1); assert.deepEqual(value,{ratio:1,degrees:50})
  assert.equal(gestures.blocksPlacement,true)
  surface.send('pointerdown',2,200,0)
  assert.equal(starts,2,'pinch begins from the current rotation and size')
  surface.send('pointermove',2,100,200)
  assert.equal(value.ratio,2); assert.equal(value.degrees,0,'pinch never twists the AR statue')
  surface.send('pointerup',2,100,200)
  value=null
  surface.send('pointermove',1,160,0)
  assert.equal(value,null,'remaining finger cannot abruptly resume rotation')
  surface.send('pointerup',1,160,0)
  surface.send('pointerdown',3,0,0)
  surface.send('pointermove',3,-60,0)
  assert.deepEqual(value,{ratio:1,degrees:-30})
  gestures.dispose()
})

test('implicit child capture handoff does not interrupt a rotating finger', () => {
  const surface=new Surface(); let value, ends=0
  const gestures=bindStatueGestures(surface,{oneFingerRotate:true,canStart:()=>true,
    onStart:()=>{},onChange:change=>value=change,onEnd:()=>ends++})
  surface.send('pointerdown',1,0,0)
  surface.send('pointermove',1,20,0)
  surface.send('lostpointercapture',1,20,0,{closest:()=>false})
  surface.send('pointermove',1,80,0)
  assert.equal(ends,0); assert.equal(value.degrees,40)
  surface.captures.delete(1)
  surface.send('lostpointercapture',1,80,0)
  assert.equal(ends,1,'genuine capture loss still terminates the gesture')
  gestures.dispose()
})

test('rotation damping is smooth, frame-rate independent, and crosses 180 by the short path', () => {
  const run=(fps)=>{
    let angle=0
    for(let i=0;i<fps/2;i++) angle=dampAngle(angle,Math.PI/2,1/fps)
    return angle
  }
  assert.ok(Math.abs(run(30)-run(120))<1e-10)
  const first=dampAngle(0,Math.PI/2,1/60)
  assert.ok(first>0 && first<Math.PI/2,'ease toward the target without jumping or overshooting')
  assert.ok(Math.abs(run(60)-Math.PI/2)<.00002,'settle promptly after release')
  const from=179*Math.PI/180, to=-179*Math.PI/180
  const next=dampAngle(from,to,1/60)
  assert.ok(next>from && next<181*Math.PI/180)
  assert.equal(dampAngle(1,2,0),1)
  assert.equal(dampAngle(1,2,5),dampAngle(1,2,.05),'cap a stalled frame')
})
