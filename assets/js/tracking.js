/* Presentation layer: private customer fields are always written as text. */
;(async() => {
  await window.SacredStore?.ready
  const repository = window.SacredOrders
  const form = document.getElementById('orderLookup')
  if (!form || !repository) return
  const $ = id => document.getElementById(id)
  const money = window.SacredForm.money
  const developer = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) && new URLSearchParams(location.search).get('demo') === '1'
  let selected = null, verifiedEmail = '', filter = 'all'
  const date = value => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString(document.documentElement.lang === 'my' ? 'my-MM' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not yet scheduled'
  const text = (parent, tag, value, className, privateText = false) => {
    const el = document.createElement(tag)
    if (className) el.className = className
    if (privateText) el.setAttribute('data-no-translate', '')
    el.textContent = value
    parent.append(el)
    return el
  }
  const stageIcons = ['receipt', 'tick', 'package', 'delivery', 'home']
  function icon(index) {
    const span = document.createElement('span')
    span.className = 'site-icon tracking-stage-icon'
    span.setAttribute('aria-hidden', 'true')
    span.style.setProperty('--icon-image', `url("${new URL(`assets/icons/${stageIcons[index]}_icon.svg`,document.baseURI).href}")`)
    return span
  }
  function updateFilterIndicator() {
    const filters = document.querySelector('.history-filters')
    const active = filters.querySelector('[aria-pressed="true"]')
    if (!active) return
    filters.style.setProperty('--filter-x', active.offsetLeft + 'px')
    filters.style.setProperty('--filter-width', active.offsetWidth + 'px')
    filters.style.setProperty('--filter-height', active.offsetHeight + 'px')
    filters.style.setProperty('--filter-y', active.offsetTop + 'px')
  }
  function clearPrivateResults() {
    selected = null; verifiedEmail = ''
    $('trackingResult').replaceChildren(); $('trackingResult').hidden = true
    $('advanceDemoOrder').disabled = true
    try { sessionStorage.removeItem('sacredFormVerifiedOrder') } catch { }
    renderHistory()
  }
  function show(order) {
    selected = order
    const root = $('trackingResult')
    root.hidden = false
    root.innerHTML = `<div class="tracking-result-title"><div><p class="eyebrow">Your order journey</p><h2 id="currentOrderStatus"></h2></div><div class="tracking-result-reference"><strong id="currentOrderId" data-no-translate></strong><button type="button" id="copyOrderId">Copy Order ID</button><span id="copyFeedback" role="status"></span></div></div>
      <p class="tracking-demo-label" id="simulationLabel" hidden>Demonstration data · Status updates are simulated, not carrier events.</p>
      <ol class="order-timeline" aria-label="Order progress"></ol>
      <div class="tracking-details-grid"><section class="tracking-card"><h3>Your selection</h3><div id="trackedItems"></div><dl class="tracking-totals"><div><dt>Subtotal</dt><dd id="trackedSubtotal"></dd></div><div><dt>Delivery fee</dt><dd id="trackedFee"></dd></div><div class="tracking-total"><dt>Total amount</dt><dd id="trackedTotal"></dd></div></dl><a class="button button-outline" id="originalOrderLink">View original order details</a></section>
      <section class="tracking-card tracking-delivery"><h3>Delivery details</h3><dl id="deliveryFacts"></dl><details class="delivery-address"><summary>Customer and delivery address</summary><div data-no-translate id="trackedCustomer"></div></details><div class="tracking-delivery-actions"><button class="button button-dark" type="button" id="trackingPrint">Print receipt</button></div></section></div>`
    const index = repository.stages.findIndex(s => s.id === order.status)
    $('currentOrderStatus').textContent = repository.stages[index].name
    $('currentOrderId').textContent = order.ref
    $('simulationLabel').hidden = !(order.simulated || order.isDemo)
    const timeline = root.querySelector('.order-timeline')
    repository.stages.forEach((stage, i) => {
      const li = document.createElement('li')
      li.className = i < index ? 'completed' : i === index ? 'current' : 'upcoming'
      if (i === index) li.setAttribute('aria-current', 'step')
      const marker = document.createElement('span'); marker.className = 'timeline-marker'; marker.append(icon(i)); li.append(marker)
      text(li, 'strong', stage.name)
      const event = order.history.find(h => h.status === stage.id)
      if (event) {
        const time = text(li, 'time', date(event.at), 'timeline-time', true)
        time.dateTime = event.at
      }
      timeline.append(li)
    })
    order.items.forEach(item => {
      const product = item.name && Number.isFinite(item.price) ? item : window.SacredForm.getProduct(item.id)
      const row = document.createElement('div'); row.className = 'tracked-item'
      const img = document.createElement('img'); img.src = product.image; img.alt = product.name
      const info = document.createElement('div')
      text(info, 'strong', product.name)
      text(info, 'small', `${item.qty} × ${money(product.price)}`)
      row.append(img, info); text(row, 'span', money(item.qty * product.price)); $('trackedItems').append(row)
    })
    $('trackedSubtotal').textContent = money(order.subtotal)
    $('trackedFee').textContent = order.deliveryFee == null ? 'To be confirmed' : money(order.deliveryFee)
    $('trackedTotal').textContent = money(order.total)
    const facts = [
      ['Order date', date(order.createdAt)],
      ['Delivery company', order.delivery.company || 'Awaiting dispatch details'],
      ['Tracking number', order.delivery.trackingNumber || 'Not assigned'],
      ['Shipping date', order.delivery.shippedAt ? date(order.delivery.shippedAt) : 'Not yet scheduled'],
      ['Estimated arrival date', order.delivery.estimatedAt ? date(order.delivery.estimatedAt) : 'To be confirmed']
    ]
    facts.forEach(([label, value]) => {
      const row = document.createElement('div'); text(row, 'dt', label); text(row, 'dd', value, '', label === 'Tracking number' || label === 'Order date'); $('deliveryFacts').append(row)
    })
    // Only show a genuine configured HTTPS URL. Samples never invent carriers.
    try {
      const url = new URL(order.delivery.trackingUrl)
      if (url.protocol === 'https:' && order.delivery.trackingNumber && !order.isDemo && !order.simulated) {
        const link = text($('deliveryFacts'), 'a', 'Track with carrier', 'text-link'); link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer'
      }
    } catch { }
    ;[order.customer.name, order.customer.email, order.customer.phone, order.customer.address, order.customer.city, order.customer.country, order.customer.note].filter(Boolean).forEach(value => text($('trackedCustomer'), 'p', value))
    const receiptURL = 'order-success.html?order=' + encodeURIComponent(order.ref)
    $('originalOrderLink').href = receiptURL
    function rememberVerified() {
      try { sessionStorage.setItem('sacredFormVerifiedOrder', JSON.stringify({ ref: order.ref, email: verifiedEmail })); return true } catch { return false }
    }
    $('originalOrderLink').addEventListener('click', event => {
      if (!rememberVerified()) { event.preventDefault(); $('copyFeedback').textContent = 'Please allow browser storage to view the receipt.' }
    })
    $('trackingPrint').onclick = () => window.print()
    $('copyOrderId').onclick = async () => {
      try { await navigator.clipboard.writeText(order.ref); $('copyFeedback').textContent = 'Copied' } catch { $('copyFeedback').textContent = 'Select the order ID to copy it.' }
    }
    $('advanceDemoOrder').disabled = !developer || index === repository.stages.length - 1
    renderHistory()
  }
  function renderHistory() {
    $('orderHistory').hidden = false
    const list = $('historyList'); list.replaceChildren()
    document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)))
    updateFilterIndicator()
    const orders = repository.localHistory(filter)
    if (!orders.length) {
      const empty = text(list, 'div', '', 'tracking-empty')
      text(empty, 'p', filter === 'all' ? 'No orders saved yet.' : 'No orders in this category.')
      if (!repository.localHistory().length) {
        const link = text(empty, 'a', 'Explore the collection', 'text-link')
        link.href = 'shop.html'
      }
    }
    orders.forEach(order => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'history-order'
      button.setAttribute('aria-pressed', String(selected?.ref === order.ref))
      const p = order.items[0].image ? order.items[0] : window.SacredForm.getProduct(order.items[0].id)
      const img = document.createElement('img'); img.src = p.image; img.alt = p.name; button.append(img)
      const info = document.createElement('span'); text(info, 'strong', order.ref, '', true); text(info, 'small', date(order.createdAt), '', true); button.append(info)
      text(button, 'span', repository.stages.find(s => s.id === order.status).name, 'history-status')
      text(button, 'strong', money(order.total))
      button.onclick = () => openLocalOrder(order)
      list.append(button)
    })
  }
  function openLocalOrder(order, scroll = true) {
    verifiedEmail = order.customer.email
    $('trackingId').value = order.ref
    $('trackingError').hidden = true
    show(order)
    if (scroll) $('trackingResult').scrollIntoView({ behavior: (window.SacredAccessibility?.reduceMotion() ?? matchMedia('(prefers-reduced-motion: reduce)').matches) ? 'instant' : 'smooth', block: 'start' })
  }
  form.onsubmit = event => {
    event.preventDefault()
    const id = $('trackingId').value.trim()
    clearPrivateResults()
    const order = repository.lookupLocal(id)
    $('trackingError').hidden = !!order
    if (!order) { $('trackingError').textContent = 'No order found in this browser. Check your order ID and try again.'; return }
    verifiedEmail = order.customer.email; filter = 'all'; show(order); $('trackingResult').scrollIntoView({ behavior: (window.SacredAccessibility?.reduceMotion() ?? matchMedia('(prefers-reduced-motion: reduce)').matches) ? 'instant' : 'smooth', block: 'start' })
  }
  // Editing the order ID clears the previously opened detail view.
  form.addEventListener('input', () => { clearPrivateResults(); $('trackingError').hidden = true })
  document.querySelectorAll('[data-filter]').forEach(button => button.onclick = () => { filter = button.dataset.filter; renderHistory() })
  const requestedId = new URLSearchParams(location.search).get('order') || ''
  $('trackingId').value = requestedId
  renderHistory()
  if (requestedId) {
    const localOrder = repository.lookupLocal(requestedId)
    if (localOrder) openLocalOrder(localOrder, false)
    else { $('trackingError').hidden = false; $('trackingError').textContent = 'No order found in this browser. Check your order ID and try again.' }
  }
  const filterObserver = new ResizeObserver(updateFilterIndicator)
  document.querySelectorAll('.history-filters button').forEach(button => filterObserver.observe(button))
  document.fonts.ready.then(updateFilterIndicator)
  $('trackingDeveloper').hidden = !developer
  $('seedDemoOrders').onclick = async () => {
    try {
      await repository.seedDemo(window.SacredForm.products, developer)
      clearPrivateResults(); $('trackingError').hidden = true
      $('trackingId').value = 'SF-DEMO-1001'
      $('demoFeedback').textContent = 'Sample orders created. Select an order from your history.'
    } catch { $('demoFeedback').textContent = 'Sample orders could not be saved. Check browser storage.' }
  }
  $('advanceDemoOrder').onclick = async () => {
    if (!selected) return
    try { const order = await repository.advance(selected.ref, verifiedEmail, developer); show(order); $('demoFeedback').textContent = 'Status updated. No carrier event was sent.' } catch { $('demoFeedback').textContent = 'The update could not be saved.' }
  }
  let addressWasOpen = false
  window.addEventListener('beforeprint', () => {
    const address = document.querySelector('.delivery-address')
    if (address) { addressWasOpen = address.open; address.open = true }
  })
  window.addEventListener('afterprint', () => {
    const address = document.querySelector('.delivery-address')
    if (address) address.open = addressWasOpen
  })
  function refreshOrders() {
    const order = selected && repository.lookupLocal(selected.ref)
    if (order) { verifiedEmail = order.customer.email; show(order) }
    else clearPrivateResults()
    $('trackingError').hidden = true
  }
  window.addEventListener('storage', event => { if (event.key === 'sacredFormOrders_v1' || event.key === null) refreshOrders() })
  window.addEventListener('pageshow', event => { if (event.persisted) refreshOrders() })
  window.addEventListener('sacredform:orderschanged',refreshOrders)
})()
