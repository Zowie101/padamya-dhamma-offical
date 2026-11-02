const { test } = require('node:test')
const assert = require('node:assert/strict')
const factory = require('../assets/js/orders.js')
const { webcrypto } = require('node:crypto')
const vm = require('node:vm')
const fs = require('node:fs')
const products = [{ id: 'one', name: 'First statue', price: 42000, image: 'one.png', height: '18 cm' }, { id: 'two', name: 'Second statue', price: 68000, image: 'two.png', height: '28 cm' }]
const customer = { name: 'Test customer', email: 'test@example.com', address: 'Test address', phone: '123' }
function setup() {
  const data = new Map()
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }
  return { data, storage, api: factory(storage, webcrypto) }
}

test('pre-cleanup order image paths resolve without changing saved order details', () => {
  const { api, data } = setup()
  const order = api.create(customer, [{id:'one',qty:1}], products)
  const raw = JSON.parse(data.get('sacredFormOrders_v1'))
  raw[0].items[0].image = 'buddha_1/buddha_1 (01)-transparent.png'
  const stored = JSON.stringify(raw)
  data.set('sacredFormOrders_v1',stored)
  const read = api.lookupLocal(order.ref)
  assert.equal(read.items[0].image,'assets/products/buddha_1/buddha_1 (01)-transparent.png')
  assert.equal(read.ref,order.ref); assert.equal(read.total,order.total)
  assert.deepEqual(read.customer,order.customer)
  assert.equal(data.get('sacredFormOrders_v1'),stored,'read migration does not overwrite customer storage')
  for (const [before,after] of [
    ['./images/example.jpg','assets/images/example.jpg'],
    ['assets/products/buddha_2/front.png','assets/products/buddha_2/front.png'],
    ['https://example.com/front.png','https://example.com/front.png']
  ]) {
    raw[0].items[0].image=before; data.set('sacredFormOrders_v1',JSON.stringify(raw))
    assert.equal(api.lookupLocal(order.ref).items[0].image,after)
  }
})
test('checkout snapshots items and saves initial status, exact time and totals', () => {
  const { api } = setup()
  const order = api.create(customer, [{ id: 'one', qty: 2 }], products)
  assert.equal(order.total, 84000)
  assert.equal(order.deliveryFee, null)
  assert.equal(order.status, 'placed')
  assert.equal(order.history[0].at, order.createdAt)
  products[0].price = 45000
  assert.equal(api.lookup(order.ref, customer.email).items[0].price, 42000)
  products[0].price = 42000
})
test('unique IDs, multiple orders and case-insensitive lookup; wrong email and ID rejected', () => {
  const { api } = setup(), ids = new Set()
  for (let i = 0; i < 50; i++) ids.add(api.create(customer, [{ id: 'one', qty: 1 }], products).ref)
  assert.equal(ids.size, 50)
  for (const id of ids) assert.match(id, /^SF-\d{7}$/)
  const id = [...ids][0]
  assert.ok(api.lookup(id.toLowerCase(), ' TEST@EXAMPLE.COM '))
  assert.equal(api.lookup(id, 'other@example.com'), null)
  assert.equal(api.lookup('not-an-order', customer.email), null)
  assert.equal(api.lookup(id, ''), null)
  assert.equal(api.history(customer.email).length, 50)
  assert.equal(api.history('other@example.com').length, 0)
})
test('short IDs avoid collisions even if the random source repeats', () => {
  const data = new Map(), storage = { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }
  const api = factory(storage, { getRandomValues: buffer => buffer.fill(1774814) })
  const a = api.create(customer, [{ id: 'one', qty: 1 }], products)
  const b = api.create(customer, [{ id: 'one', qty: 1 }], products)
  assert.equal(a.ref, 'SF-2774814')
  assert.equal(b.ref, 'SF-2774815')
  assert.equal(api.lookupLocal(' sf-2774814 ').ref, a.ref)
  assert.equal(api.lookupLocal('SF-0000000'), null)
})
test('old eight-stage orders map to five stages without discarding original events or references', () => {
  const { api, storage } = setup()
  const oldStages = ['placed','confirmed','preparing','inspection','packed','shipped']
  const history = oldStages.map((status, i) => ({ status, at: new Date(Date.UTC(2026, 9, 1, i)).toISOString() }))
  storage.setItem('sacredFormOrders_v1', JSON.stringify([{ ref: 'SF-OLD-LONG-REFERENCE', customer, items: [{ id: 'one', qty: 1 }], total: 42000, createdAt: history[0].at, status: 'shipped', history }]))
  const old = api.lookupLocal('SF-OLD-LONG-REFERENCE')
  assert.equal(old.status, 'packed')
  assert.deepEqual(old.history.map(h => h.status), ['placed','confirmed','packed'])
  assert.deepEqual(old.legacyHistory, history)
  assert.equal(api.advance(old.ref, customer.email, true).status, 'out-for-delivery')
})
test('invalid cart and email never save an order', () => {
  const { api } = setup()
  assert.throws(() => api.create({ ...customer, email: 'invalid' }, [{ id: 'one', qty: 1 }], products))
  assert.throws(() => api.create(customer, [{ id: 'missing', qty: 1 }], products))
  assert.throws(() => api.create(customer, [{ id: 'one', qty: -1 }], products))
  assert.equal(api.latest(), null)
})
test('corrupt storage and legacy orders are handled without losing valid history', () => {
  const { api, storage } = setup()
  storage.setItem('sacredFormOrders_v1', '{broken')
  assert.equal(api.latest(), null)
  storage.setItem('sacredFormOrders_v1', JSON.stringify([null, { ref: 'broken', customer, total: 1, createdAt: new Date().toISOString(), items: [null] }]))
  assert.equal(api.latest(), null)
  storage.setItem('sacredFormLastOrder', JSON.stringify({ ref: 'SF-OLD', customer, items: [{ id: 'one', qty: 1 }], total: 42000, createdAt: '2026-10-01T00:00:00Z', status: 'old request text' }))
  assert.equal(api.lookup('SF-OLD', customer.email).status, 'placed')
  api.create(customer, [{ id: 'one', qty: 1 }], products)
  assert.equal(api.history(customer.email).length, 2)
})
test('receipt prints through the native print action and archived ID alone is rejected', () => {
  const source = fs.readFileSync(require.resolve('../assets/js/app.js'), 'utf8')
  const receipt = source.slice(source.indexOf('function initOrderSuccess()'), source.indexOf('function initMenu()'))
  const { api } = setup(), order = api.create(customer, [{ id: 'one', qty: 1 }], products)
  let printed = false
  const elements = new Map()
  const makeElement = () => ({ textContent: '', innerHTML: '', append() {}, addEventListener(type, fn) { this[type] = fn } })
  const document = { documentElement: { lang: 'en' }, getElementById(id) { if (!elements.has(id)) elements.set(id, makeElement()); return elements.get(id) }, createElement: makeElement }
  const context = { document, location: { search: '' }, URLSearchParams, sessionStorage: { getItem: () => null }, window: { SacredOrders: api, print: () => { printed = true } }, money: n => String(n), getProduct: () => products[0] }
  vm.createContext(context); vm.runInContext(receipt + ';initOrderSuccess()', context)
  assert.equal(elements.get('receiptReference').textContent, order.ref)
  assert.match(elements.get('trackThisOrder').href, /track-order.html\?order=SF-/)
  elements.get('printReceipt').click()
  assert.equal(printed, true)
  context.location.search = '?order=' + encodeURIComponent(order.ref)
  vm.runInContext('initOrderSuccess()', context)
  assert.match(elements.get('orderSuccessRoot').innerHTML, /Nothing to confirm/)
})
test('no automatic progression; explicit demo controls advance one stage at a time', () => {
  const { api } = setup(), order = api.create(customer, [{ id: 'one', qty: 1 }], products)
  assert.throws(() => api.advance(order.ref, customer.email, false))
  assert.equal(api.lookup(order.ref, customer.email).status, 'placed')
  api.stages.slice(1).forEach((stage, i) => {
    const updated = api.advance(order.ref, customer.email, true)
    assert.equal(updated.status, stage.id)
    assert.equal(updated.history.length, i + 2)
    assert.equal(updated.history.at(-1).simulated, true)
  })
  assert.equal(api.advance(order.ref, customer.email, true).history.length, 5)
})
test('sample orders are opt-in, idempotent and filters return the right orders', () => {
  const { api } = setup(), email = 'demo@sacredform.example'
  assert.equal(api.history(email).length, 0)
  assert.throws(() => api.seedDemo(products, false))
  api.seedDemo(products, true); api.seedDemo(products, true)
  assert.equal(api.history(email).length, 3)
  for (const filter of ['processing', 'shipped', 'delivered']) assert.equal(api.history(email, filter).length, 1)
  for (const order of api.history(email)) {
    assert.equal(order.delivery.trackingNumber, undefined)
    assert.equal(order.delivery.trackingUrl, undefined)
  }
})
test('local device history is available before lookup across checkout emails and filters', () => {
  const { api } = setup()
  assert.deepEqual(api.localHistory(), [])
  const first = api.create(customer, [{ id: 'one', qty: 1 }], products)
  const second = api.create({ ...customer, email: 'second@example.com' }, [{ id: 'two', qty: 2 }], products)
  assert.equal(api.localHistory().length, 2)
  assert.equal(api.localHistory('processing').length, 2)
  assert.equal(api.localHistory('delivered').length, 0)
  assert.equal(api.lookup(first.ref, 'wrong@example.com'), null)
  assert.equal(api.history(customer.email).length, 1)
  assert.ok(api.localHistory().some(o => o.ref === second.ref))
})
test('storage failures propagate before checkout clears the bag', () => {
  const api = factory({ getItem: () => null, setItem: () => { throw Error('quota') } }, webcrypto)
  assert.throws(() => api.create(customer, [{ id: 'one', qty: 1 }], products), /quota/)
})
test('actual checkout handler clears cart and navigates only after a successful save', async () => {
  const source = fs.readFileSync(require.resolve('../assets/js/app.js'), 'utf8')
  const checkout = source.slice(source.indexOf('function initCheckout()'), source.indexOf('function initOrderSuccess()'))
  for (const fails of [false, true]) {
    const { api } = setup()
    let cleared = false, created = false
    const elements = { checkoutRoot: { innerHTML: '' }, checkoutForm: {} }
    const context = {
      document: { getElementById: id => elements[id] || null, createElement: () => ({ setAttribute() {} }) },
      getCart: () => [{ id: 'one', qty: 1 }], getProduct: () => products[0], PRODUCTS: products,
      money: n => String(n), saveCart: cart => { assert.equal(cart.length, 0); cleared = true }, location: {},
      FormData: class { entries() { return Object.entries(customer) } },
      window: { SacredOrders: { create(...args) { if (fails) throw Error('blocked'); created = true; return api.create(...args) } } }
    }
    vm.createContext(context); vm.runInContext(checkout + '; initCheckout()', context)
    await elements.checkoutForm.onsubmit({ preventDefault() {}, target: { append() {} } })
    assert.equal(cleared, !fails); assert.equal(created, !fails)
    assert.equal(context.location.href, fails ? undefined : 'order-success.html')
  }
})
