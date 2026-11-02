import test from 'node:test'
import assert from 'node:assert/strict'
import { isAppleMobile } from '../assets/js/room-ios.js'

test('Apple mobile routing covers iPhone and desktop-mode iPad without classifying ordinary computers or Android as iOS', () => {
  assert.equal(isAppleMobile({ userAgent: 'Mozilla/5.0 (iPhone)', platform: 'iPhone', maxTouchPoints: 5 }), true)
  assert.equal(isAppleMobile({ userAgent: 'Mozilla/5.0 (iPad)', platform: 'iPad', maxTouchPoints: 5 }), true)
  assert.equal(isAppleMobile({ userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 5 }), true)
  assert.equal(isAppleMobile({ userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 0 }), false)
  assert.equal(isAppleMobile({ userAgent: 'Mozilla/5.0 (Android)', platform: 'Linux', maxTouchPoints: 5 }), false)
  assert.equal(isAppleMobile({ userAgent: 'Mozilla/5.0 (Windows NT)', platform: 'Win32', maxTouchPoints: 10 }), false)
})
