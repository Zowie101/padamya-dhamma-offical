const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const vm = require('node:vm')
const source = readFileSync(require.resolve('../assets/js/page-motion.js'), 'utf8')
function setup({ native = false, reduced = false } = {}) {
  const events = {}, classes = new Set(), timers = new Map(), destinations = []
  let serial = 0
  const document = { documentElement: { dataset: {}, classList: { add: c => classes.add(c), remove: c => classes.delete(c) } }, addEventListener: (name, fn) => { events['document:' + name] = fn } }
  const window = { addEventListener: (name, fn) => { events[name] = fn } }
  if (native) { window.onpagereveal = null; window.onpageswap = null }
  const location = { href: 'https://example.com/shop.html', origin: 'https://example.com', pathname: '/shop.html', search: '', protocol: 'https:', assign: url => destinations.push(url) }
  const context = { document, window, location, URL, matchMedia: () => ({ matches: reduced, addEventListener() {} }), setTimeout: (fn, delay) => { const id = ++serial; timers.set(id, { fn, delay }); return id }, clearTimeout: id => timers.delete(id) }
  vm.runInNewContext(source, context)
  events.load()
  function click(href, options = {}) {
    let prevented = false
    const link = { href, target: options.target || '', hasAttribute: name => name === options.attribute }
    const event = { button: 0, target: { closest: () => link }, preventDefault: () => { prevented = true }, ...options }
    events['document:click']?.(event)
    return prevented
  }
  return { document, window, events, classes, timers, destinations, click }
}
test('native browsers keep real navigation; fallback leaves after a short fade', () => {
  const native = setup({ native: true })
  assert.equal(native.document.documentElement.dataset.pageMotion, 'native')
  assert.equal(native.events['document:click'], undefined)
  const fallback = setup()
  assert.equal(fallback.click('https://example.com/product.html?id=one'), true)
  assert.deepEqual(fallback.destinations, [])
  assert.ok(fallback.classes.has('page-is-leaving'))
  const delay = [...fallback.timers.values()][0]
  assert.equal(delay.delay, 140)
  delay.fn()
  assert.deepEqual(fallback.destinations, ['https://example.com/product.html?id=one'])
})
test('hashes, external links, downloads, new tabs, modifier clicks and dialogs are untouched', () => {
  const s = setup()
  for (const [url, options] of [
    ['https://example.com/shop.html#collection', {}],
    ['https://other.example/page.html', {}],
    ['https://example.com/receipt.html', { attribute: 'download' }],
    ['https://example.com/product.html', { target: '_blank' }],
    ['https://example.com/product.html', { ctrlKey: true }],
    ['https://example.com/product.html', { defaultPrevented: true }],
    ['mailto:support@example.com', {}]
  ]) assert.equal(s.click(url, options), false)
  assert.equal(s.timers.size, 0)
})
test('back/forward cache restore removes the leaving state and stale timers', () => {
  const s = setup()
  s.click('https://example.com/cart.html')
  s.events.pageshow()
  assert.equal(s.classes.size, 0)
  assert.equal(s.timers.size, 0)
  s.click('https://example.com/about.html')
  assert.equal(s.timers.size, 1)
})
test('reduced motion navigates immediately with no click interception or exit animation', () => {
  const s = setup({ reduced: true })
  assert.equal(s.click('https://example.com/cart.html'), false)
  s.window.SacredPageMotion.navigate('checkout.html')
  assert.deepEqual(s.destinations, ['https://example.com/checkout.html'])
  assert.equal(s.timers.size, 0)
  assert.equal(s.classes.size, 0)
})
