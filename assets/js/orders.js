/* Local demo repository. Replace this boundary with authenticated backend calls
   for production; an email match in browser storage is not authentication. */
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory
  else {
    let storage
    try { storage = root.localStorage } catch {
      storage = { getItem: () => null, setItem: () => { throw new Error('Browser storage is unavailable.') } }
    }
    root.SacredOrders = factory(storage, root.crypto)
  }
})(typeof window !== 'undefined' ? window : globalThis, function (storage, cryptoAPI) {
  'use strict'
  const KEY = 'sacredFormOrders_v1'
  const stages = [
    ['placed', 'Order Placed'], ['confirmed', 'Confirmed'], ['packed', 'Packed'],
    ['out-for-delivery', 'Out for Delivery'], ['delivered', 'Delivered']
  ].map(([id, name]) => ({ id, name }))
  const statusAlias = status => ({ preparing: 'confirmed', inspection: 'confirmed', shipped: 'packed' }[status] || status)
  const emailKey = email => String(email || '').trim().toLowerCase()
  const validEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailKey(email))
  // Keep old order snapshots usable after moving product images into assets/.
  const currentImagePath = image => typeof image !== 'string' ? image :
    image.replace(/^(?:\.\/)?(buddha_[1-6])\//, 'assets/products/$1/')
      .replace(/^(?:\.\/)?images\//, 'assets/images/')
  function readRaw() {
    try { const data = JSON.parse(storage.getItem(KEY) || '[]'); return Array.isArray(data) ? data : [] } catch { return [] }
  }
  const valid = o => o && typeof o.ref === 'string' && o.ref.trim() && o.customer && validEmail(o.customer.email) && Array.isArray(o.items) && o.items.length && o.items.every(i => i && typeof i.id === 'string' && Number.isInteger(i.qty) && i.qty > 0) && Number.isFinite(o.total) && o.total >= 0 && Number.isFinite(Date.parse(o.createdAt))
  function normalize(o) {
    if (!valid(o)) return null
    o = { ...o, items: o.items.map(item => ({ ...item, image: currentImagePath(item.image) })) }
    const mappedStatus = statusAlias(o.status)
    const status = stages.some(s => s.id === mappedStatus) ? mappedStatus : 'placed'
    const original = Array.isArray(o.history) ? o.history : []
    const history = []
    original.forEach(h => {
      if (!h || !Number.isFinite(Date.parse(h.at))) return
      const status = statusAlias(h.status)
      if (stages.some(s => s.id === status) && !history.some(event => event.status === status)) history.push({ ...h, status })
    })
    return { ...o, legacyHistory: o.legacyHistory || (original.some(h => h && statusAlias(h.status) !== h.status) ? original : undefined), status, subtotal: Number.isFinite(o.subtotal) ? o.subtotal : o.total, deliveryFee: Number.isFinite(o.deliveryFee) ? o.deliveryFee : null, history: history.length ? history : [{ status: 'placed', at: o.createdAt }], delivery: o.delivery && typeof o.delivery === 'object' ? o.delivery : {} }
  }
  function all() {
    const orders = readRaw().map(normalize).filter(Boolean)
    // Read the previous checkout format without losing the customer's last order.
    try {
      const legacy = normalize(JSON.parse(storage.getItem('sacredFormLastOrder') || 'null'))
      if (legacy && !orders.some(o => o.ref === legacy.ref)) orders.push(legacy)
    } catch { }
    return orders.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  }
  function write(orders) {
    // A failed save must be visible to checkout; never clear the cart on failure.
    storage.setItem(KEY, JSON.stringify(orders))
  }
  function uniqueId() {
    const used = new Set(all().map(o => o.ref.toUpperCase()))
    const random = new Uint32Array(1)
    if (cryptoAPI?.getRandomValues) cryptoAPI.getRandomValues(random)
    else random[0] = Math.floor(Math.random() * 0x100000000)
    let number = 1000000 + random[0] % 9000000
    for (let attempts = 0; attempts < 9000000; attempts++) {
      const ref = 'SF-' + number
      if (!used.has(ref)) return ref
      number = number === 9999999 ? 1000000 : number + 1
    }
    throw new Error('No order references are available.')
  }
  function create(customer, cart, products) {
    if (!validEmail(customer?.email) || !customer.name?.trim() || !cart?.length) throw new Error('Check your delivery details and shopping bag.')
    const items = cart.map(item => {
      const p = products.find(p => p.id === item.id)
      if (!p || !Number.isInteger(item.qty) || item.qty < 1) throw new Error('A piece in your bag could not be found.')
      return { id: p.id, qty: item.qty, name: p.name, price: p.price, image: p.image, height: p.height }
    })
    const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0)
    const createdAt = new Date().toISOString()
    const order = { ref: uniqueId(), customer: { ...customer, email: emailKey(customer.email) }, items, subtotal, deliveryFee: null, total: subtotal, createdAt, status: 'placed', history: [{ status: 'placed', at: createdAt }], delivery: {}, isDemo: false }
    write([...all(), order])
    try { storage.setItem('sacredFormLastOrder', JSON.stringify(order)) } catch { /* Archive is authoritative. */ }
    return order
  }
  function lookup(ref, email) {
    if (!String(ref || '').trim() || !validEmail(email)) return null
    return all().find(o => o.ref.toUpperCase() === String(ref).trim().toUpperCase() && emailKey(o.customer.email) === emailKey(email)) || null
  }
  function matchesFilter(o, filter) {
    return filter === 'all' || (filter === 'processing' ? stages.findIndex(s => s.id === o.status) < 3 : ['shipped', 'out-for-delivery'].includes(filter) ? o.status === 'out-for-delivery' : o.status === 'delivered')
  }
  function history(email, filter = 'all') {
    if (!validEmail(email)) return []
    return all().filter(o => emailKey(o.customer.email) === emailKey(email) && matchesFilter(o, filter))
  }
  // Explicit local-device history, independent of the manual ID/email lookup.
  function localHistory(filter = 'all') { return all().filter(o => matchesFilter(o, filter)) }
  function lookupLocal(ref) {
    const id = String(ref || '').trim().toUpperCase()
    return id ? all().find(o => o.ref.toUpperCase() === id) || null : null
  }
  function advance(ref, email, developerEnabled) {
    if (!developerEnabled) throw new Error('Demo controls are disabled.')
    const orders = all(), order = orders.find(o => o.ref === ref && emailKey(o.customer.email) === emailKey(email))
    if (!order) throw new Error('Order not found.')
    const index = stages.findIndex(s => s.id === order.status)
    if (index === stages.length - 1) return order
    order.status = stages[index + 1].id
    const at = new Date().toISOString()
    order.history.push({ status: order.status, at, simulated: true })
    order.simulated = true
    if (order.status === 'out-for-delivery') order.delivery.shippedAt = at
    write(orders)
    return order
  }
  function setDemoStage(ref, nextStatus, demoEnabled, expectedStatus) {
    if (!demoEnabled) throw new Error('Demo controls are disabled.')
    const nextIndex = stages.findIndex(stage => stage.id === nextStatus)
    if (nextIndex < 0) throw new Error('Choose a valid order stage.')
    const orders = all(), order = orders.find(order => order.ref === ref)
    if (!order) throw new Error('This order is no longer available.')
    if (expectedStatus && order.status !== expectedStatus) throw new Error('This order changed in another tab. Review its latest stage and try again.')
    if (order.status === nextStatus) return order
    const at = new Date().toISOString(), previous = order.status
    // Keep an explicit audit trail, including the history before a correction.
    order.adminEvents = [...(Array.isArray(order.adminEvents) ? order.adminEvents : []),
      { from: previous, to: nextStatus, at, simulated: true, previousHistory: order.history.map(event => ({ ...event })) }]
    order.history = stages.slice(0, nextIndex + 1).map(stage =>
      order.history.find(event => event.status === stage.id) || { status: stage.id, at, simulated: true })
    order.status = nextStatus
    order.simulated = true
    if (nextIndex >= 3) order.delivery.shippedAt = order.history.find(event => event.status === 'out-for-delivery').at
    else order.delivery.shippedAt = null
    write(orders)
    return order
  }
  function seedDemo(products, developerEnabled) {
    if (!developerEnabled) throw new Error('Demo controls are disabled.')
    const orders = all()
    ;[1, 3, 4].forEach((stageIndex, index) => {
      const ref = 'SF-DEMO-' + (1001 + index)
      if (orders.some(o => o.ref === ref)) return
      const p = products[index % products.length], start = Date.now() - [2, 3, 9][index] * 86400000
      const events = stages.slice(0, stageIndex + 1).map((s, i) => ({ status: s.id, at: new Date(start + i * 3600000).toISOString(), simulated: true }))
      orders.push({ ref, customer: { name: 'Demo customer', email: 'demo@sacredform.example', address: 'Sample address', city: 'Yangon', country: 'Myanmar' }, items: [{ id: p.id, name: p.name, image: p.image, price: p.price, height: p.height, qty: 1 }], subtotal: p.price, deliveryFee: 3000, total: p.price + 3000, createdAt: events[0].at, status: stages[stageIndex].id, history: events, isDemo: true, simulated: true, delivery: { estimatedAt: new Date(start + 7 * 86400000).toISOString(), shippedAt: events.find(e => e.status === 'out-for-delivery')?.at || null } })
    })
    write(orders)
    return orders.filter(o => o.isDemo)
  }
  return Object.freeze({ stages, create, lookup, lookupLocal, history, localHistory, advance, setDemoStage, seedDemo, latest: () => all()[0] || null, validEmail })
})
