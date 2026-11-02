/* Explicit local demo: no authentication, server, carrier calls or notifications. */
;(async() => {
  await window.SacredStore?.ready
  const repository = window.SacredOrders, catalogue = window.SacredForm
  if (!repository || !catalogue || !document.getElementById('adminOrders')) return
  if(window.SacredStore?.enabled&&window.SacredStore.profile.role!=='admin'){
    document.getElementById('adminMain').innerHTML='<div class="admin-empty"><h1>Order desk.</h1><p>Sign in with a server administrator account to manage orders.</p><p><a class="admin-button" href="account.html?return=admin.html">Sign in</a></p><p>Create your local administrator with <code>node --run admin</code> in a private terminal.</p></div>'
    return
  }
  if(window.SacredStore?.enabled){document.querySelector('.admin-heading .eyebrow').textContent='PADAMYA DHAMMA / ORDER DESK';document.querySelector('.admin-note').textContent='Server-backed orders · Only signed-in administrators can update stages. No carrier or email connection.'}
  const $ = id => document.getElementById(id)
  const stages = repository.stages, icons = ['receipt','tick','package','delivery','home']
  let selectedRef = null, filter = 'all', query = ''
  const money = value => Number.isFinite(value) ? catalogue.money(value) : 'To be confirmed'
  const date = value => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'}) : 'Not recorded'
  const label = status => stages.find(stage => stage.id === status)?.name || status
  function element(tag, text, className, parent) {
    const node = document.createElement(tag)
    if (text != null) node.textContent = text
    if (className) node.className = className
    parent?.append(node)
    return node
  }
  function feedback(message, error = false) { $('adminFeedback').textContent = message; $('adminFeedback').dataset.error = String(error) }
  function productFor(item) { return item.image ? item : { ...catalogue.getProduct(item.id), ...item, image:catalogue.getProduct(item.id).image } }
  function image(item, parent) {
    const product = productFor(item), img = element('img',null,null,parent)
    img.src = product.image; img.alt = product.name || 'Ordered statue'; img.decoding = 'async'
  }
  function matches(order) {
    const stageMatches = filter === 'all' || (filter === 'processing' ? stages.findIndex(stage=>stage.id===order.status)<3 : order.status===filter)
    return stageMatches && (!query || [order.ref,order.customer.name,order.customer.email].some(value=>String(value||'').toLowerCase().includes(query)))
  }
  function renderList(orders) {
    const list = $('adminOrders'); list.replaceChildren()
    const visible = orders.filter(matches)
    $('adminResultCount').textContent = `${visible.length} ${visible.length === 1 ? 'order' : 'orders'}`
    if (!visible.length) {
      const empty = element('div',null,'admin-empty',list)
      element('p',orders.length ? 'No orders match this search or stage.' : 'No orders saved yet. Add sample orders, or complete a demo checkout in this browser.',null,empty)
    }
    for (const order of visible) {
      const button = element('button',null,'admin-order',list); button.type = 'button'
      button.dataset.order = order.ref; button.setAttribute('aria-pressed',String(order.ref===selectedRef))
      button.setAttribute('aria-label',`${order.ref}, ${order.customer.name}, ${label(order.status)}`)
      image(order.items[0],button)
      const info = element('span',null,'admin-order-info',button)
      element('strong',order.ref,null,info)
      element('small',`${order.customer.name} · ${date(order.createdAt)}`,null,info)
      const meta = element('span',null,'admin-order-meta',info)
      element('span',label(order.status),'admin-status',meta); element('span',money(order.total),null,meta)
      button.onclick = () => {
        selectedRef = order.ref; render(); feedback('')
        if (matchMedia('(max-width:650px)').matches) $('adminDetail').scrollIntoView({behavior:(window.SacredAccessibility?.reduceMotion() ?? matchMedia('(prefers-reduced-motion:reduce)').matches)?'instant':'smooth',block:'start'})
        $('adminOrderTitle')?.focus({preventScroll:true})
      }
    }
  }
  function renderDetail(order) {
    const panel = $('adminDetail'); panel.replaceChildren()
    if (!order) {
      const empty = element('div',null,'admin-empty',panel)
      element('h2','A little order. A lot of care.',null,empty)
      element('p','Select an order to view its details and manage its journey.',null,empty)
      return
    }
    const current = stages.findIndex(stage=>stage.id===order.status)
    const head = element('div',null,'admin-detail-head',panel), titleBlock = element('div',null,null,head)
    element('p',order.isDemo?'SAMPLE ORDER / DEMO':'CHECKOUT ORDER / LOCAL DEMO','eyebrow',titleBlock)
    const title = element('h2',order.ref,null,titleBlock); title.id='adminOrderTitle'; title.tabIndex=-1
    element('p',`Created ${date(order.createdAt)}`,null,titleBlock)
    const customerLink = element('a','Customer view ↗','admin-customer-link',head)
    customerLink.href = `track-order.html?order=${encodeURIComponent(order.ref)}`; customerLink.target='_blank'; customerLink.rel='noopener'
    const progress = element('ol',null,'admin-progress',panel); progress.setAttribute('aria-label','Order stages')
    stages.forEach((stage,index)=>{
      const row = element('li',null,index<current?'completed':index===current?'current':'upcoming',progress)
      if(index===current) row.setAttribute('aria-current','step')
      const marker = element('span',null,'admin-marker',row), icon = element('span',null,'site-icon',marker)
      icon.style.setProperty('--icon-image',`url("${new URL(`assets/icons/${icons[index]}_icon.svg`,document.baseURI).href}")`); icon.setAttribute('aria-hidden','true')
      element('span',stage.name,null,row)
    })
    const form = element('form',null,'admin-stage-form',panel)
    const field = element('label','Order stage',null,form); field.htmlFor='adminStage'
    const select = element('select',null,null,field); select.id='adminStage'
    for(const stage of stages) { const option=element('option',stage.name,null,select); option.value=stage.id }
    select.value=order.status
    const save=element('button','Update stage','admin-button admin-button-primary',form); save.type='submit'; save.disabled=true
    select.onchange=()=>{save.disabled=select.value===order.status}
    form.onsubmit=async event=>{
      event.preventDefault()
      if(save.disabled)return
      save.disabled=true
      try {
        const updated=await repository.setDemoStage(order.ref,select.value,true,order.status)
        render(); feedback(`Updated ${updated.ref} to ${label(updated.status)}. ${repository.server?'Server':'Demo'} change saved.`)
        $('adminStage')?.focus({preventScroll:true})
      } catch(error) { render(); feedback(error.message || 'The stage could not be saved. Check browser storage.',true) }
    }
    const items = element('div',null,'admin-items',panel)
    for(const item of order.items) {
      const product=productFor(item), row=element('div',null,'admin-item',items); image(item,row)
      const info=element('div',null,'admin-item-info',row)
      element('strong',product.name || item.id,null,info)
      element('small',`${item.qty} × ${money(product.price)}${product.height?' · '+product.height:''}`,null,info)
      element('span',money(item.qty*product.price),null,row)
    }
    const totals=element('div',null,'admin-totals',panel)
    for(const [name,value] of [['Subtotal',order.subtotal],['Delivery',order.deliveryFee],['Total',order.total]]) {
      const block=element('div',null,null,totals); element('span',name,null,block); element('strong',money(value),null,block)
    }
    const customer=element('div',null,'admin-customer',panel), contact=element('div',null,null,customer), address=element('div',null,null,customer)
    element('h3','Customer',null,contact)
    for(const value of [order.customer.name,order.customer.email,order.customer.phone].filter(Boolean)) element('p',value,null,contact)
    element('h3','Delivery address',null,address)
    for(const value of [order.customer.address,order.customer.city,order.customer.country].filter(Boolean)) element('p',value,null,address)
    if(order.customer.note) { element('h3','Order note',null,address); element('p',order.customer.note,null,address) }
    const history=element('details',null,null,panel); element('summary','Stage history & change log',null,history)
    const log=element('ul',null,'admin-log',history)
    const events=Array.isArray(order.adminEvents)?order.adminEvents.filter(event=>event&&typeof event==='object'):[]
    if(events.length) for(const event of [...events].reverse()) {
      const row=element('li',null,null,log)
      element('span',`${label(event.from)} → ${label(event.to)} · Demo update`,null,row)
      const timestamp=element('time',date(event.at),null,row); timestamp.dateTime=event.at
    }
    for(const event of [...order.history].reverse()) {
      const row=element('li',null,null,log)
      element('span',`${label(event.status)}${event.simulated?' · Demonstration':''}`,null,row)
      const timestamp=element('time',date(event.at),null,row); timestamp.dateTime=event.at
    }
  }
  function render() {
    const orders=repository.localHistory()
    $('countAll').textContent=orders.length
    $('countProcessing').textContent=orders.filter(order=>stages.findIndex(stage=>stage.id===order.status)<3).length
    $('countDelivery').textContent=orders.filter(order=>order.status==='out-for-delivery').length
    $('countDelivered').textContent=orders.filter(order=>order.status==='delivered').length
    document.querySelectorAll('[data-admin-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.adminFilter===filter)))
    renderList(orders); renderDetail(orders.find(order=>order.ref===selectedRef))
  }
  function setFilter(value) { filter=value; $('adminFilter').value=value; renderList(repository.localHistory()); document.querySelectorAll('[data-admin-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.adminFilter===filter))) }
  $('adminFilter').onchange=()=>setFilter($('adminFilter').value)
  $('adminSearch').oninput=()=>{query=$('adminSearch').value.trim().toLowerCase();renderList(repository.localHistory())}
  document.querySelectorAll('[data-admin-filter]').forEach(button=>button.onclick=()=>setFilter(button.dataset.adminFilter))
  $('adminSeed').onclick=async()=>{
    try {
      await repository.seedDemo(catalogue.products,true)
      if(!selectedRef) selectedRef='SF-DEMO-1001'
      query='';$('adminSearch').value=''; filter='all';$('adminFilter').value='all'
      render();feedback('Sample orders are ready. Existing orders were kept.')
    } catch { feedback('Sample orders could not be saved. Check browser storage.',true) }
  }
  const requested=new URLSearchParams(location.search).get('order')
  if(requested && repository.lookupLocal(requested)) selectedRef=repository.lookupLocal(requested).ref
  window.addEventListener('storage',event=>{if(event.key==='sacredFormOrders_v1'||event.key===null){render();feedback('Orders refreshed from another tab.')}})
  window.addEventListener('sacredform:orderschanged',()=>render())
  window.addEventListener('pageshow',event=>{if(event.persisted)render()})
  render()
})()
