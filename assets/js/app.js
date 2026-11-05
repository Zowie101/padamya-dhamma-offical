const PRODUCTS = [
  {
    id: 'golden-presence',
    name: 'Golden Presence',
    category: 'Home Shrine',
    material: 'Resin with antique gold finish',
    height: '28 cm',
    price: 68000,
    tag: 'Bestseller',
    desc: 'A serene seated figure with a warm antique-gold finish, created to bring a sense of calm to a dedicated home shrine.',
    assetSet: 'buddha_2',
    arModel: 'assets/models/optimized/buddha_2.glb',
    previewModel: 'assets/models/optimized/buddha_2.glb',
    previewImage: 'assets/images/optimized/buddha_2-front.webp',
    model: 'assets/products/buddha_2/buddha_2 3d model.glb',
    image: 'assets/products/buddha_2/buddha_2 (01)-transparent.png',
    images: [
      'assets/products/buddha_2/buddha_2 (01)-transparent.png',
      'assets/products/buddha_2/buddha_2 (02)-transparent.png',
      'assets/products/buddha_2/buddha_2 (03)-transparent.png'
    ],
    imageLabels: ['Front', 'Side', 'Back']
  },
  {
    id: 'quiet-meditation',
    name: 'Quiet Meditation',
    category: 'Small & Simple',
    material: 'Stone-look resin',
    height: '18 cm',
    price: 42000,
    tag: 'Small spaces',
    desc: 'A compact, understated piece for a bedside table, meditation corner, or a smaller altar arrangement.',
    assetSet: 'buddha_1',
    arModel: 'assets/models/optimized/buddha_1.glb',
    previewModel: 'assets/models/optimized/buddha_1.glb',
    previewImage: 'assets/images/optimized/buddha_1-front.webp',
    model: 'assets/products/buddha_1/buddha_1 3d model.glb',
    image: 'assets/products/buddha_1/buddha_1 (01)-transparent.png',
    images: [
      'assets/products/buddha_1/buddha_1 (01)-transparent.png',
      'assets/products/buddha_1/buddha_1 (02)-transparent.png',
      'assets/products/buddha_1/buddha_1 (03)-transparent.png'
    ],
    imageLabels: ['Front', 'Side', 'Back']
  },
  {
    id: 'earth-touching',
    name: 'Lotus Meditation',
    category: 'Home Shrine',
    material: 'Bronze-tone resin',
    height: '32 cm',
    price: 89000,
    tag: 'Statement piece',
    desc: 'A warm bronze-toned seated figure on a layered lotus base, with flowing robes and a balanced silhouette for a home shrine.',
    assetSet: 'buddha_4',
    arModel: 'assets/models/optimized/buddha_4.glb',
    previewModel: 'assets/models/optimized/buddha_4.glb',
    previewImage: 'assets/images/optimized/buddha_4-front.webp',
    model: 'assets/products/buddha_4/buddha_4 3d model.glb',
    image: 'assets/products/buddha_4/buddha_4 (01)-transparent.png',
    images: [
      'assets/products/buddha_4/buddha_4 (01)-transparent.png',
      'assets/products/buddha_4/buddha_4 (02)-transparent.png',
      'assets/products/buddha_4/buddha_4 (03)-transparent.png'
    ],
    imageLabels: ['Front', 'Side', 'Back']
  },
  {
    id: 'lotus-stillness',
    name: 'Lotus Stillness',
    category: 'Meaningful Gifts',
    material: 'Ivory-tone resin with orange robe',
    height: '22 cm',
    price: 55000,
    tag: 'Gift selection',
    desc: 'An ivory-toned seated figure with a vivid orange robe and a raised blessing hand, chosen for a thoughtful gift or personal reflection space.',
    assetSet: 'buddha_6',
    arModel: 'assets/models/optimized/buddha_6.glb',
    previewModel: 'assets/models/optimized/buddha_6.glb',
    previewImage: 'assets/images/optimized/buddha_6-front.webp',
    model: 'assets/products/buddha_6/buddha_6 3d model.glb',
    image: 'assets/products/buddha_6/buddha_6 (01)-transparent.png',
    images: [
      'assets/products/buddha_6/buddha_6 (01)-transparent.png',
      'assets/products/buddha_6/buddha_6 (02)-transparent.png',
      'assets/products/buddha_6/buddha_6 (03)-transparent.png'
    ],
    imageLabels: ['Front', 'Side', 'Back']
  },
  {
    id: 'gentle-blessing',
    name: 'Gentle Serenity',
    category: 'Small & Simple',
    material: 'Ivory-tone resin',
    height: '15 cm',
    price: 36000,
    tag: 'Compact form',
    desc: 'A small, light-toned statue with a quiet presence for compact shelves and personal reflection spaces.',
    assetSet: 'buddha_3',
    arModel: 'assets/models/optimized/buddha_3.glb',
    previewModel: 'assets/models/optimized/buddha_3.glb',
    previewImage: 'assets/images/optimized/buddha_3-front.webp',
    model: 'assets/products/buddha_3/buddha_3 3d model.glb',
    image: 'assets/products/buddha_3/buddha_3 (01)-transparent.png',
    images: [
      'assets/products/buddha_3/buddha_3 (01)-transparent.png',
      'assets/products/buddha_3/buddha_3 (02)-transparent.png',
      'assets/products/buddha_3/buddha_3 (03)-transparent.png'
    ],
    imageLabels: ['Front', 'Side', 'Back']
  },
  {
    id: 'temple-gold',
    name: 'Temple Gold',
    category: 'Meaningful Gifts',
    material: 'Black resin with gold detailing',
    height: '25 cm',
    price: 74000,
    tag: 'Gift selection',
    desc: 'A dark seated figure with intricate gold detailing, a patterned robe and a decorated base, selected for gifting and considered interiors.',
    assetSet: 'buddha_5',
    arModel: 'assets/models/optimized/buddha_5.glb',
    previewModel: 'assets/models/optimized/buddha_5.glb',
    previewImage: 'assets/images/optimized/buddha_5-front.webp',
    model: 'assets/products/buddha_5/buddha_5 3d model.glb',
    image: 'assets/products/buddha_5/buddha_5 (01)-transparent.png',
    images: [
      'assets/products/buddha_5/buddha_5 (01)-transparent.png',
      'assets/products/buddha_5/buddha_5 (02)-transparent.png',
      'assets/products/buddha_5/buddha_5 (03)-transparent.png'
    ],
    imageLabels: ['Front', 'Side', 'Back']
  }
]
const CART_KEY = 'sacredFormCart_v1'
const money = n => new Intl.NumberFormat('en-US').format(n) + ' MMK'
const getCart = () => {
  try {
    const x = JSON.parse(localStorage.getItem(CART_KEY) || '[]')
    return Array.isArray(x) ? x : []
  } catch {
    return []
  }
}
const saveCart = cart => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  window.SacredStore?.syncCart(cart)
  updateCartCount()
  renderCartPage()
}
const getProduct = id => PRODUCTS.find(p => p.id === id) || PRODUCTS[0]
const getProductModel = p => p.previewModel || p.arModel || p.model || 'assets/models/optimized/buddha_1.glb'
function updateCartCount() {
  const el = document.getElementById('cartCount')
  if (el) {
    const count = getCart().reduce((n, i) => n + i.qty, 0)
    el.textContent = count
    el.closest('a')?.setAttribute(
      'aria-label',
      `Shopping bag, ${count} ${count === 1 ? 'item' : 'items'}`
    )
  }
}
function toast(message) {
  const root = document.getElementById('toastRoot')
  if (!root) return
  root.innerHTML = `<div class="toast">${message}</div>`
  setTimeout(() => {
    if (root.firstElementChild) root.innerHTML = ''
  }, 2400)
}
function addToCart(id, qty = 1) {
  const product=PRODUCTS.find(p=>p.id===id)
  if(!product||product.active===false){toast('This piece is not available to order.');return}
  const current=getCart().find(item=>item.id===id)?.qty||0
  if(Number.isInteger(product.stock)&&current+qty>product.stock){toast('Please choose a quantity within the available stock.');return}
  const cart = getCart()
  const item = cart.find(i => i.id === id)
  if (item) item.qty += qty
  else cart.push({ id, qty })
  saveCart(cart)
  toast('Added to your bag')
}
function setQty(id, qty) {
  let cart = getCart()
  const item = cart.find(i => i.id === id)
  if (!item) return
  if (qty < 1) cart = cart.filter(i => i.id !== id)
  else item.qty = qty
  saveCart(cart)
}
function removeItem(id) {
  saveCart(getCart().filter(i => i.id !== id))
  toast('Piece removed from your bag')
}
function productCard(p) {
  if(p.active===false)return ''
  return `<article class="product-card">${wishlistButton(
    p
  )}<a class="product-image" href="product.html?id=${p.id}" aria-label="View ${p.name
    }"><img loading="lazy" class="${p.assetSet ? 'asset-photo' : ''}" src="${p.previewImage || p.image
    }" alt="${p.name}"><span class="product-tag">${p.tag
    }</span></a><div class="product-meta"><div><h3 class="product-name"><a href="product.html?id=${p.id
    }">${p.name}</a></h3><p class="product-sub">${p.category} · ${p.height
    }</p></div><span class="product-price">${money(
      p.price
    )}</span></div><button class="quick-add" data-add="${p.id
    }" ${p.stock===0?'disabled':''}>${p.stock===0?'Out of stock':'Add to bag +'}</button></article>`
}
function renderGrid(target, items) {
  const el = document.getElementById(target)
  if (!el) return
  el.innerHTML = items.map(productCard).join('')
}
function initShop() {
  const grid = document.getElementById('productGrid')
  if (!grid) return
  let active = 'All'
  const search = document.getElementById('searchInput')
  const params = new URLSearchParams(location.search)
  if (PRODUCTS.some(p => p.category === params.get('category')))
    active = params.get('category')
  const budgetMin = document.getElementById('budgetMin'),
    budgetMax = document.getElementById('budgetMax')
  const floor =
    Math.floor(Math.min(...PRODUCTS.map(p => p.price)) / 1000) * 1000
  const ceiling =
    Math.ceil(Math.max(...PRODUCTS.map(p => p.price)) / 1000) * 1000
  for (const slider of [budgetMin, budgetMax]) {
    slider.min = floor
    slider.max = ceiling
    slider.step = 1000
  }
  budgetMin.value = floor
  budgetMax.value = ceiling
  function updateBudget() {
    const track = document.getElementById('budgetTrack')
    track.style.setProperty(
      '--budget-start',
      (Number(budgetMin.value) - floor) / (ceiling - floor)
    )
    track.style.setProperty(
      '--budget-end',
      (Number(budgetMax.value) - floor) / (ceiling - floor)
    )
    document.getElementById('budgetMinValue').textContent = money(
      Number(budgetMin.value)
    )
    document.getElementById('budgetMaxValue').textContent = money(
      Number(budgetMax.value)
    )
    budgetMin.setAttribute('aria-valuetext', money(Number(budgetMin.value)))
    budgetMax.setAttribute('aria-valuetext', money(Number(budgetMax.value)))
    document.getElementById('resetBudget').disabled =
      Number(budgetMin.value) === floor && Number(budgetMax.value) === ceiling
  }
  function draw() {
    let arr = PRODUCTS.filter(
      p =>
        p.active!==false &&
        (active === 'All' || p.category === active) &&
        p.price >= Number(budgetMin.value) &&
        p.price <= Number(budgetMax.value) &&
        (!search.value ||
          `${p.name} ${p.category} ${p.material} ${[p.name, p.category, p.material].map(text => window.SacredFormLanguage?.translate(text) || text).join(" ")}`
            .toLowerCase()
            .includes(search.value.toLowerCase()))
    )
    grid.innerHTML = arr.map(productCard).join('')
    updateBudget()
    const empty = document.getElementById('emptyState')
    if (empty) empty.hidden = arr.length > 0
    document.querySelectorAll('[data-filter]').forEach(b => {
      b.classList.toggle('active', b.dataset.filter === active)
      b.setAttribute('aria-pressed', String(b.dataset.filter === active))
    })
  }
  document.querySelectorAll('[data-filter]').forEach(b =>
    b.addEventListener('click', () => {
      active = b.dataset.filter
      draw()
    })
  )
  document
    .getElementById('budgetTrack')
    .addEventListener('pointerdown', event => {
      if (event.target === budgetMin || event.target === budgetMax) return
      const rect = event.currentTarget.getBoundingClientRect()
      const fraction = Math.max(
        0,
        Math.min(1, (event.clientX - rect.left - 9) / (rect.width - 18))
      )
      const value =
        Math.round((floor + fraction * (ceiling - floor)) / 1000) * 1000
      const lower = Number(budgetMin.value),
        upper = Number(budgetMax.value)
      const slider =
        value < lower
          ? budgetMin
          : value > upper
            ? budgetMax
            : Math.abs(value - lower) < Math.abs(value - upper)
              ? budgetMin
              : budgetMax
      slider.value = value
      slider.dispatchEvent(new Event('input', { bubbles: true }))
      slider.focus({ preventScroll: true })
    })
  budgetMin.addEventListener('input', () => {
    if (Number(budgetMin.value) > Number(budgetMax.value))
      budgetMin.value = budgetMax.value
    draw()
  })
  budgetMax.addEventListener('input', () => {
    if (Number(budgetMax.value) < Number(budgetMin.value))
      budgetMax.value = budgetMin.value
    draw()
  })
  document.getElementById('resetBudget').addEventListener('click', () => {
    budgetMin.value = floor
    budgetMax.value = ceiling
    draw()
  })
  search?.addEventListener('input', draw)
  window.addEventListener('sacredform:languagechange', draw)
  draw()
}
function initProduct() {
  const name = document.getElementById('detailName')
  if (!name) return
  const p = getProduct(new URLSearchParams(location.search).get('id'))
  document.title = `${p.name} | Padamya Dhamma`
  const roomLink = document.getElementById('viewInRoom')
  if (roomLink) roomLink.href = `room.html?piece=${encodeURIComponent(p.id)}`
  document.getElementById('detailCategory').textContent =
    p.category.toUpperCase()
  name.textContent = p.name
  document.getElementById('detailPrice').textContent = money(p.price)
  document.getElementById('detailDescription').textContent = p.desc
  document.getElementById(
    'detailSpecs'
  ).innerHTML = `<div class="spec-row"><span>Material</span><strong>${p.material}</strong></div><div class="spec-row"><span>Height</span><strong>${p.height}</strong></div><div class="spec-row"><span>Collection</span><strong>${p.category}</strong></div>`

  const thumbs = document.getElementById('productThumbs')
  const main = document.getElementById('mainProductImage')
  const viewer = document.getElementById('buddhaViewer')
  const box = document.getElementById('detailImage')
  const controls = document.getElementById('viewerControls')
  const hint = document.getElementById('galleryHint')
  const progressFill = document.querySelector('.model-progress span')
  viewer.setAttribute('src', getProductModel(p))
  viewer.setAttribute('poster', p.previewImage || p.image)
  viewer.setAttribute(
    'alt',
    `${p.model ? 'Interactive 3D model' : 'Sample 3D model'} of ${p.name
    }. Drag to rotate.`
  )
  main.classList.toggle('asset-photo', Boolean(p.assetSet))
  document.querySelector(
    '.product-secondary-actions a[href^="shrine.html"]'
  ).href = `shrine.html?piece=${encodeURIComponent(p.id)}#shrine-preview`
  viewer.addEventListener('progress', event => {
    if (progressFill)
      progressFill.style.width = `${Math.round(
        event.detail.totalProgress * 100
      )}%`
  })
  const thumbButtons = []
  let activeView = 'model'
  main.alt = p.name

  function selectView(view, imageUrl, button, label = '') {
    activeView = view
    const isModel = view === 'model'
    viewer.hidden = !isModel
    main.hidden = isModel
    if (!isModel) {
      main.src = imageUrl
      main.alt = `${p.name} — ${label.toLowerCase()} view`
      main.style.transformOrigin = 'center'
    }
    controls.hidden = !isModel
    hint.textContent = isModel
      ? 'DRAG TO ROTATE · SCROLL TO ZOOM ↗'
      : 'HOVER TO EXPLORE ↗'
    box.classList.remove('zoomed')
    thumbButtons.forEach(t => {
      t.classList.toggle('active', t === button)
      t.setAttribute('aria-pressed', String(t === button))
    })
  }

  const modelThumb = document.createElement('button')
  modelThumb.type = 'button'
  modelThumb.className = 'thumb model-thumb active'
  modelThumb.setAttribute('aria-label', 'View interactive 3D model')
  modelThumb.setAttribute('aria-pressed', 'true')
  modelThumb.innerHTML = '<span>3D</span><small>VIEW</small>'
  modelThumb.addEventListener('click', () =>
    selectView('model', '', modelThumb)
  )
  thumbs.replaceChildren(modelThumb)
  thumbButtons.push(modelThumb)

  p.images.forEach((imageUrl, i) => {
    const label = p.imageLabels?.[i] || `Photo ${i + 1}`
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'thumb'
    button.setAttribute('aria-label', `View ${p.name} — ${label.toLowerCase()}`)
    button.setAttribute('aria-pressed', 'false')
    const img = document.createElement('img')
    img.src = p.assetSet ? `assets/images/optimized/${p.assetSet}-0${i + 1}-thumb.webp` : imageUrl
    img.decoding = 'async'
    img.alt = ''
    img.classList.toggle('asset-photo', Boolean(p.assetSet))
    button.appendChild(img)
    const caption = document.createElement('span')
    caption.className = 'thumb-caption'
    caption.textContent = label
    button.appendChild(caption)
    button.addEventListener('click', () =>
      selectView('image', imageUrl, button, label)
    )
    thumbs.appendChild(button)
    thumbButtons.push(button)
  })

  box.addEventListener('mousemove', e => {
    if (activeView === 'image' && innerWidth > 700) {
      const r = box.getBoundingClientRect()
      main.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100
        }% ${((e.clientY - r.top) / r.height) * 100}%`
    }
  })
  box.addEventListener('click', e => {
    if (activeView === 'image' && !e.target.closest('button'))
      box.classList.toggle('zoomed')
  })

  let qty = 1
  const q = document.getElementById('detailQty')
  document.getElementById('detailMinus').onclick = () => {
    qty = Math.max(1, qty - 1)
    q.textContent = qty
  }
  document.getElementById('detailPlus').onclick = () => {
    qty = Math.min(20, qty + 1)
    q.textContent = qty
  }
  document.getElementById('addDetail').onclick = () => addToCart(p.id, qty)
  document
    .querySelector('.product-secondary-actions')
    .insertAdjacentHTML('afterbegin', wishlistButton(p, true))

  const zoomIn = document.getElementById('zoomIn'),
    zoomOut = document.getElementById('zoomOut')
  const rotateButton = document.getElementById('rotateButton'),
    resetButton = document.getElementById('resetButton')
  let autoRotate = !window.SacredAccessibility?.reduceMotion()
  viewer.toggleAttribute('auto-rotate',autoRotate)
  if(!autoRotate){rotateButton.textContent='▶';rotateButton.setAttribute('aria-label','Start rotation')}
  window.addEventListener('sacredform:accessibilitychange',()=>{
    if(!window.SacredAccessibility?.reduceMotion())return
    autoRotate=false;viewer.removeAttribute('auto-rotate');rotateButton.textContent='▶';rotateButton.setAttribute('aria-label','Start rotation')
  })
  function changeZoom(multiplier) {
    if (!viewer || !viewer.loaded) return
    const orbit = viewer.getCameraOrbit()
    const radius = Math.max(0.1, Math.min(100, orbit.radius * multiplier))
    viewer.cameraOrbit = `${orbit.theta}rad ${orbit.phi}rad ${radius}m`
  }
  zoomIn.addEventListener('click', () => changeZoom(0.8))
  zoomOut.addEventListener('click', () => changeZoom(1.25))
  rotateButton.addEventListener('click', () => {
    autoRotate = !autoRotate
    viewer.toggleAttribute('auto-rotate', autoRotate)
    rotateButton.textContent = autoRotate ? 'Ⅱ' : '▶'
    rotateButton.setAttribute(
      'aria-label',
      autoRotate ? 'Pause rotation' : 'Start rotation'
    )
  })
  resetButton.addEventListener('click', () => {
    viewer.cameraOrbit = '0deg 75deg auto'
    viewer.fieldOfView = '30deg'
    autoRotate = !window.SacredAccessibility?.reduceMotion()
    viewer.toggleAttribute('auto-rotate', autoRotate)
    rotateButton.textContent = autoRotate?'Ⅱ':'▶'
    rotateButton.setAttribute('aria-label', autoRotate?'Pause rotation':'Start rotation')
  })
  renderGrid('relatedGrid', PRODUCTS.filter(x => x.id !== p.id).slice(0, 3))
}
function renderCartPage() {
  const root = document.getElementById('cartContent')
  if (!root) return
  const cart = getCart()
  if (!cart.length) {
    root.innerHTML = `<div class="empty-cart"><p class="eyebrow">A little room to begin</p><h2>Your bag is waiting.</h2><p style="color:var(--muted)">Explore the collection and add a piece that feels right for your space.</p><a class="button button-dark" href="shop.html">Explore the collection <span><span class="site-icon icon-arrow" aria-hidden="true"></span></span></a></div>`
    return
  }
  let subtotal = 0
  const rows = cart
    .map(i => {
      const p = getProduct(i.id)
      subtotal += p.price * i.qty
      return `<article class="cart-item"><a href="product.html?id=${p.id
        }"><img class="${p.assetSet ? 'asset-photo' : ''}" src="${p.previewImage || p.image
        }" alt="${p.name}"></a><div><h3><a href="product.html?id=${p.id}">${p.name
        }</a></h3><p>${p.material} · ${p.height
        }</p><div class="quantity-control"><button data-qty="${p.id
        }" data-step="-1" aria-label="Decrease ${p.name}">−</button><span>${i.qty
        }</span><button data-qty="${p.id}" data-step="1" aria-label="Increase ${p.name
        }">+</button></div><br><button class="remove-button" data-remove="${p.id
        }">Remove</button></div><span class="cart-line-price">${money(
          p.price * i.qty
        )}</span></article>`
    })
    .join('')
  root.innerHTML = `<div class="cart-layout"><div><div class="cart-list">${rows}</div><button class="remove-button" id="clearCart">Clear bag</button></div><aside class="summary-card"><p class="eyebrow">Order summary</p><h2>At a glance.</h2><div class="summary-row"><span>Subtotal</span><span>${money(
    subtotal
  )}</span></div><div class="summary-row"><span>Delivery</span><span>Calculated later</span></div><div class="summary-row summary-total"><span>Total before delivery</span><span>${money(
    subtotal
  )}</span></div><a class="button button-dark" href="checkout.html">Continue to checkout <span><span class="site-icon icon-arrow" aria-hidden="true"></span></span></a><p class="summary-note">Delivery options and final costs can be confirmed during order processing.</p></aside></div>`
  root
    .querySelectorAll('[data-qty]')
    .forEach(
      b =>
      (b.onclick = () =>
        setQty(
          b.dataset.qty,
          getCart().find(i => i.id === b.dataset.qty).qty +
          Number(b.dataset.step)
        ))
    )
  root
    .querySelectorAll('[data-remove]')
    .forEach(b => (b.onclick = () => removeItem(b.dataset.remove)))
  document.getElementById('clearCart').onclick = () => {
    saveCart([])
    toast('Your bag has been cleared')
  }
}
function initShrine() {
  const obj = document.getElementById('shrineObject')
  if (!obj) return
  let chosen = getProduct(new URLSearchParams(location.search).get('piece')),
    size = 25
  const viewer = document.getElementById('shrineViewer')
  const status = document.getElementById('shrineLoading')
  const stage = document.getElementById('shrineStage')
  const space = document.getElementById('shrineMeasuredSpace')
  const widthInput = document.getElementById('shrineWidth')
  const heightInput = document.getElementById('shrineHeight')
  const dimensionError = document.getElementById('shrineDimensionError')
  const designButtons = [...document.querySelectorAll('[data-shrine-design]')]
  const pedestal = space.querySelector('.shrine-pedestal')
  // Keep the WebGL viewport fixed while size buttons animate its wrapper.
  // Resizing the canvas makes model-viewer reframe its camera asynchronously.
  const renderHeightCm = 32
  let framing = null, loadedModel = '', groundingTimer, groundingVersion = 0
  let groundingBusy = false
  function viewerOnScreen() {
    const rect = viewer.getBoundingClientRect()
    return rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth
  }
  const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve))
  async function renderBounds() {
    await viewer.updateComplete
    viewer.jumpCameraToGoal()
    await nextFrame()
    await nextFrame()
    const bitmap = await createImageBitmap(await viewer.toBlob({ idealAspect: false }))
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(bitmap, 0, 0)
    bitmap.close()
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    let top = canvas.height, bottom = -1
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        // Ignore nearly transparent antialiasing. The viewer's floor shadow is
        // disabled, so these bounds describe the actual statue, not its shadow.
        if (pixels[(y * canvas.width + x) * 4 + 3] >= 128) {
          top = Math.min(top, y)
          bottom = y
          break
        }
      }
    }
    if (bottom < top) throw Error('Statue has not rendered yet')
    return { top, bottom: bottom + 1, height: canvas.height }
  }
  function scheduleGrounding() {
    groundingVersion++
    clearTimeout(groundingTimer)
    delete obj.dataset.grounded
    if (loadedModel !== getProductModel(chosen)) return
    groundingTimer = setTimeout(groundStatue, 80)
  }
  async function groundStatue() {
    // Offscreen model viewers pause rendering (especially on mobile). Keep the
    // last valid framing and measure again when the preview becomes visible.
    if (!viewerOnScreen()) return
    if (groundingBusy) {
      groundingTimer = setTimeout(groundStatue, 80)
      return
    }
    const version = groundingVersion, source = getProductModel(chosen)
    groundingBusy = true
    obj.classList.add('is-positioning')
    try {
      // Measure the rendered mesh rather than assuming that every GLB has the
      // same empty margins. The aspect ratio stays fixed as height changes.
      for (let pass = 0; pass < 3; pass++) {
        const bounds = await renderBounds()
        if (version !== groundingVersion || loadedModel !== source) return
        framing = {
          heightFraction: (bounds.bottom - bounds.top) / bounds.height,
          bottomInset: 1 - bounds.bottom / bounds.height
        }
        layoutScene()
      }
      const bounds = await renderBounds()
      if (version !== groundingVersion || loadedModel !== source) return
      const rect = viewer.getBoundingClientRect()
      const error = rect.top + bounds.bottom / bounds.height * rect.height - pedestal.getBoundingClientRect().top
      // Correct subpixel rounding at the seat without changing product height.
      const offset = parseFloat(viewer.style.getPropertyValue('--grounding-offset')) || 0
      const correctedOffset = offset - error / (size / renderHeightCm)
      framing.bottomInset = correctedOffset / parseFloat(obj.style.height)
      viewer.style.setProperty('--grounding-offset', `${correctedOffset}px`)
      obj.dataset.groundingError = error.toFixed(2)
      obj.dataset.grounded = 'true'
      status.hidden = true
      viewer.style.opacity = '1'
    } catch (error) {
      if (version === groundingVersion && viewerOnScreen()) {
        status.hidden = false
        status.textContent = 'Preparing the statue position…'
        groundingTimer = setTimeout(groundStatue, 300)
      }
    } finally {
      groundingBusy = false
      obj.classList.remove('is-positioning')
    }
  }
  let shrineWidth = 120,
    shrineHeight = 80,
    design = 'arch'
  try {
    const saved = JSON.parse(
      localStorage.getItem('sacredFormShrine_v1') || 'null'
    )
    if (
      saved &&
      Number.isInteger(saved.width) &&
      saved.width >= 40 &&
      saved.width <= 300 &&
      Number.isInteger(saved.height) &&
      saved.height >= 30 &&
      saved.height <= 250
    ) {
      shrineWidth = saved.width
      shrineHeight = saved.height
    }
    if (['arch', 'oak', 'stone', 'walnut', 'lotus'].includes(saved?.design)) design = saved.design
  } catch {
    /* Default dimensions remain usable when storage is unavailable. */
  }
  widthInput.value = shrineWidth
  heightInput.value = shrineHeight
  function saveShrine() {
    try {
      localStorage.setItem(
        'sacredFormShrine_v1',
        JSON.stringify({ width: shrineWidth, height: shrineHeight, design })
      )
    } catch { }
  }
  function layoutScene() {
    // Fit both axes with one scale, preserving the entered width-to-height ratio.
    const pixelsPerCm = Math.min(
      Math.max(1, stage.clientWidth - 96) / shrineWidth,
      Math.max(1, stage.clientHeight - 124) / shrineHeight
    )
    space.style.width = `${shrineWidth * pixelsPerCm}px`
    space.style.height = `${shrineHeight * pixelsPerCm}px`
    const height = renderHeightCm * pixelsPerCm / (framing?.heightFraction || 0.86)
    obj.style.width = `${height * 0.94}px`
    obj.style.height = `${height}px`
    obj.style.setProperty('--statue-scale', size / renderHeightCm)
    viewer.style.setProperty('--grounding-offset', `${height * (framing?.bottomInset || 0)}px`)
    document.getElementById(
      'shrineWidthLabel'
    ).textContent = `${shrineWidth} cm`
    document.getElementById(
      'shrineHeightLabel'
    ).textContent = `${shrineHeight} cm`
    const fit = document.getElementById('shrineFitMessage')
    const gap = shrineHeight - size
    fit.hidden = gap >= 5
    fit.textContent =
      gap < 0
        ? `This ${size} cm statue exceeds the clear height by ${-gap} cm. Choose a smaller height or more space.`
        : gap < 5
          ? `Only ${gap} cm above the statue. Allow at least 5 cm of headroom.`
          : ''
  }
  function applyDesign() {
    stage.dataset.design = design
    designButtons.forEach(button =>
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.shrineDesign === design)
      )
    )
  }
  designButtons.forEach(button =>
    button.addEventListener('click', () => {
      design = button.dataset.shrineDesign
      applyDesign()
      saveShrine()
    })
  )
  for (const input of [widthInput, heightInput])
    input.addEventListener('input', () => {
      const validWidth = widthInput.value !== '' && widthInput.validity.valid
      const validHeight = heightInput.value !== '' && heightInput.validity.valid
      widthInput.setAttribute('aria-invalid', String(!validWidth))
      heightInput.setAttribute('aria-invalid', String(!validHeight))
      dimensionError.hidden = validWidth && validHeight
      dimensionError.textContent =
        validWidth && validHeight
          ? ''
          : 'Enter a whole-number width of 40–300 cm and height of 30–250 cm.'
      if (!validWidth || !validHeight) return
      shrineWidth = Number(widthInput.value)
      shrineHeight = Number(heightInput.value)
      layoutScene()
      saveShrine()
      scheduleGrounding()
    })
  applyDesign()
  const resizeScene = () => { layoutScene(); scheduleGrounding() }
  if ('ResizeObserver' in window) new ResizeObserver(resizeScene).observe(stage)
  else window.addEventListener('resize', resizeScene)
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) scheduleGrounding()
    }).observe(viewer)
  }
  viewer.addEventListener('load', () => {
    loadedModel = viewer.getAttribute('src')
    scheduleGrounding()
  })
  viewer.addEventListener('camera-change', event => {
    if (!groundingBusy && event.detail.source === 'user-interaction') scheduleGrounding()
  })
  viewer.addEventListener('error', () => {
    status.hidden = false
    status.textContent = 'The 3D model could not load. Refresh to try again.'
  })
  document.getElementById('shrineReset').onclick = () => {
    viewer.cameraOrbit = '0deg 85deg auto'
    scheduleGrounding()
  }
  const opts = document.getElementById('shrineProductOptions')
  opts.innerHTML = `<div class="shrine-carousel" role="region" aria-roledescription="carousel" aria-label="Choose your piece" tabindex="0">
    <div class="shrine-photo-frame"><div class="shrine-photo-track">${PRODUCTS.map(
    (p, i) =>
      `<img class="shrine-photo-slide ${p.assetSet ? 'asset-photo' : ''
      }" data-photo-index="${i}" src="${p.previewImage || p.image}" decoding="async" alt="${p.assetSet
        ? p.name + ' — front view'
        : 'Illustrative Buddha photograph for ' + p.name
      }" draggable="false">`
  ).join('')}</div>
    <button type="button" class="shrine-slide-arrow previous" data-shrine-step="-1" aria-label="Previous piece"><span class="site-icon icon-arrow icon-arrow-left" aria-hidden="true"></span></button>
    <button type="button" class="shrine-slide-arrow next" data-shrine-step="1" aria-label="Next piece"><span class="site-icon icon-arrow" aria-hidden="true"></span></button></div>
    <div class="shrine-choice-caption" aria-live="polite" aria-atomic="true"><div><h3 id="shrineChoiceName"></h3><p id="shrineChoiceSpecs"></p></div><span id="shrineChoiceIndex"></span></div>
  </div>`
  function selectPiece(step) {
    const index =
      (PRODUCTS.indexOf(chosen) + step + PRODUCTS.length) % PRODUCTS.length
    chosen = PRODUCTS[index]
    size = parseInt(chosen.height)
    draw()
  }
  opts.querySelectorAll('[data-shrine-step]').forEach(button => {
    button.addEventListener('click', () =>
      selectPiece(Number(button.dataset.shrineStep))
    )
  })
  opts.querySelector('.shrine-carousel').addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      selectPiece(event.key === 'ArrowLeft' ? -1 : 1)
    }
  })
  let touchStartX = null
  const photoFrame = opts.querySelector('.shrine-photo-frame')
  photoFrame.addEventListener(
    'touchstart',
    event => {
      touchStartX = event.touches[0].clientX
    },
    { passive: true }
  )
  photoFrame.addEventListener(
    'touchend',
    event => {
      if (touchStartX === null) return
      const distance = event.changedTouches[0].clientX - touchStartX
      if (Math.abs(distance) > 50) selectPiece(distance < 0 ? 1 : -1)
      touchStartX = null
    },
    { passive: true }
  )
  function draw() {
    layoutScene()
    const model = getProductModel(chosen)
    if (viewer.getAttribute('src') !== model) {
      loadedModel = ''
      framing = null
      obj.classList.add('is-positioning')
      groundingVersion++
      clearTimeout(groundingTimer)
      delete obj.dataset.grounded
      status.hidden = false
      status.textContent = `Preparing ${chosen.name} in 3D…`
      viewer.style.opacity = '0'
      viewer.setAttribute(
        'alt',
        `${chosen.model ? chosen.name : 'Sample Buddha model'
        } in your chosen shrine. Drag to rotate.`
      )
      viewer.setAttribute('src', model)
      viewer.cameraOrbit = '0deg 85deg auto'
    } else if (!framing || obj.dataset.grounded !== 'true') {
      scheduleGrounding()
    }
    document.getElementById(
      'shrineCurrent'
    ).textContent = `${size} cm statue · ${chosen.name}`
    document.getElementById(
      'shrineProductLink'
    ).href = `product.html?id=${chosen.id}`
    const index = PRODUCTS.indexOf(chosen)
    opts.querySelectorAll('.shrine-photo-slide').forEach((photo, i) => {
      let offset = (i - index + PRODUCTS.length) % PRODUCTS.length
      if (offset > PRODUCTS.length / 2) offset -= PRODUCTS.length
      photo.style.setProperty('--slide-offset', offset)
      photo.classList.toggle('is-selected', offset === 0)
      photo.classList.toggle('is-neighbour', Math.abs(offset) === 1)
      photo.setAttribute('aria-hidden', String(offset !== 0))
      photo.id = offset === 0 ? 'shrineChoicePhoto' : ''
    })
    document.getElementById('shrineChoiceName').textContent = chosen.name
    document.getElementById('shrineChoiceSpecs').textContent =
      chosen.category + ' · ' + chosen.height
    document.getElementById('shrineChoiceIndex').textContent =
      index + 1 + ' / ' + PRODUCTS.length
    document.querySelectorAll('[data-size]').forEach(b => {
      b.classList.toggle('active', Number(b.dataset.size) === size)
      b.setAttribute('aria-pressed', String(Number(b.dataset.size) === size))
    })
  }
  document.querySelectorAll('[data-size]').forEach(
    b =>
    (b.onclick = () => {
      // Reuse the grounded framing. Size changes need only a compositor-scale
      // animation, without camera resets or another round of pixel captures.
      if (framing && obj.dataset.grounded === 'true') {
        groundingVersion++
        clearTimeout(groundingTimer)
      }
      size = Number(b.dataset.size)
      draw()
    })
  )
  size = parseInt(chosen.height)
  draw()
}
function checkoutSignedIn() { return window.SacredStore?.enabled && ['customer','admin'].includes(window.SacredStore.profile?.role) }
function showCheckoutSignin() {
  let dialog=document.getElementById('checkoutSigninDialog')
  if(!dialog){
    dialog=document.createElement('dialog');dialog.id='checkoutSigninDialog';dialog.className='checkout-signin-dialog';dialog.setAttribute('aria-labelledby','checkoutSigninTitle')
    dialog.innerHTML='<button class="checkout-signin-close" type="button" aria-label="Close sign-in prompt">×</button><h2 id="checkoutSigninTitle">Sign in to continue</h2><p>Keep your order and delivery updates together in your account. Your bag will be waiting.</p><div class="signin-actions"><a class="button button-dark" href="account.html?return=checkout.html">Sign in</a><a class="button button-outline" href="account.html?mode=register&amp;return=checkout.html">Create account</a></div>'
    document.body.append(dialog);dialog.querySelector('button').onclick=()=>dialog.close()
    dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()})
    dialog.addEventListener('close',()=>dialog._trigger?.focus())
  }
  if(!dialog.open){dialog._trigger=document.activeElement;dialog.showModal()}
}
document.addEventListener('click',event=>{
  const link=event.target.closest?.('a[href]');if(!link||new URL(link.href,location.href).pathname.split('/').pop()!=='checkout.html'||checkoutSignedIn())return
  event.preventDefault();event.stopImmediatePropagation();showCheckoutSignin()
},true)
async function initDeliveryDetails(form) {
  if(!form?.querySelector || !window.SacredStore?.enabled)return
  const store=window.SacredStore,dirty=new Set(),message=form.querySelector('[data-delivery-status]')
  form.addEventListener('input',e=>dirty.add(e.target.name))
  form.addEventListener('change',e=>dirty.add(e.target.name))
  const fill=details=>{for(const name of ['name','phone','email','address','city','country']){const field=form.elements.namedItem(name);if(field&&!dirty.has(name)&&details?.[name])field.value=details[name]}}
  fill({name:store.profile?.name,email:store.profile?.email})
  try{const {details}=await store.request('account/delivery');if(details){fill(details);message.textContent='Your saved delivery details are ready. You can edit them below.'}}
  catch{message.textContent='Saved details could not be loaded. Please enter your delivery details.'}
}
function initCheckout() {
  const root = document.getElementById('checkoutRoot')
  if (!root) return
  if (!checkoutSignedIn()) { root.innerHTML='<div class="empty-cart"><h2>Sign in to place your order.</h2><button class="button button-dark" id="checkoutSigninAgain" type="button">Sign in / Create account</button></div>';document.getElementById('checkoutSigninAgain').onclick=showCheckoutSignin;showCheckoutSignin();return }
  const cart = getCart()
  if (!cart.length) {
    root.innerHTML =
      '<div class="empty-cart"><h2>Your bag is empty.</h2><a class="button button-dark" href="shop.html">Explore the collection <span class="site-icon icon-arrow" aria-hidden="true"></span></a></div>'
    return
  }
  const subtotal = cart.reduce((n, i) => n + getProduct(i.id).price * i.qty, 0)
  root.innerHTML = `<div class="checkout-layout"><form class="checkout-form" id="checkoutForm"><label class="field">Full name<input name="name" autocomplete="name" required></label><label class="field">Phone number<input name="phone" autocomplete="tel" required></label><label class="field full">Email address<input name="email" type="email" autocomplete="email" required></label><label class="field full">Delivery address<textarea name="address" rows="2" autocomplete="street-address" required></textarea></label><label class="field">City / Township<input name="city" autocomplete="address-level2" required></label><label class="field">Country<select name="country"><option>Myanmar</option><option>Thailand</option><option>Singapore</option><option>Other</option></select></label><label class="field full">Order note (optional)<textarea name="note" rows="2"></textarea></label><div class="delivery-preferences"><label class="delivery-save"><input type="checkbox" name="saveDelivery" checked><span>Save delivery details for my next order</span></label><div class="delivery-saved"><p data-delivery-status role="status" aria-live="polite"></p></div></div><button class="button button-dark" type="submit">Place order request <span><span class="site-icon icon-arrow" aria-hidden="true"></span></span></button></form><aside class="summary-card"><p class="eyebrow">Your selection</p><h2>Order summary.</h2>${cart
    .map(
      i =>
        `<div class="summary-row"><span>${getProduct(i.id).name} × ${i.qty
        }</span><span>${money(getProduct(i.id).price * i.qty)}</span></div>`
    )
    .join(
      ''
    )}<div class="summary-row summary-total"><span>Subtotal</span><span>${money(
      subtotal
    )}</span></div><p class="summary-note">Delivery and payment arrangements will need to be confirmed with the seller.</p></aside></div>`
  if(document.getElementById('checkoutForm')?.querySelector)initDeliveryDetails(document.getElementById('checkoutForm'))
  document.getElementById('checkoutForm').onsubmit = async e => {
    e.preventDefault()
    const submit=e.target.querySelector?.('button[type="submit"]')
    if(submit?.disabled)return
    if(submit)submit.disabled=true
    const fd = new FormData(e.target)
    try {
      if(window.SacredStore?.unavailable)throw new Error('The store server is unavailable. Please reconnect before placing your order.')
      const customer=Object.fromEntries(fd.entries());delete customer.saveDelivery
      await window.SacredOrders.create(customer, cart, PRODUCTS, {saveDelivery:e.target.querySelector?.('[name=saveDelivery]')?.checked===true})
    } catch (error) {
      let message = document.getElementById('checkoutSaveError')
      if (!message) {
        message = document.createElement('p')
        message.id = 'checkoutSaveError'
        message.setAttribute('role', 'alert')
        e.target.append(message)
      }
      message.textContent = error.message || 'Your order could not be saved. Your bag is still available.'
      if(submit)submit.disabled=false
      return
    }
    saveCart([])
    if (window.SacredPageMotion) window.SacredPageMotion.navigate('order-success.html')
    else location.href = 'order-success.html'
  }
}
function initOrderSuccess() {
  const root = document.getElementById('orderSuccessRoot')
  if (!root) return
  let order = null
  const requested = new URLSearchParams(location.search).get('order')
  if (requested) {
    try {
      const verified = JSON.parse(sessionStorage.getItem('sacredFormVerifiedOrder') || 'null')
      if (verified?.ref === requested) order = window.SacredOrders.lookup(requested, verified.email)
    } catch { }
  } else order = window.SacredOrders?.latest()
  if (!order) {
    root.innerHTML =
      '<div class="empty-cart"><p class="eyebrow">No recent request</p><h2>Nothing to confirm just yet.</h2><p>Your latest order request could not be found in this browser.</p><a class="button button-dark" href="shop.html">Explore the collection <span class="site-icon icon-arrow" aria-hidden="true"></span></a></div>'
    return
  }
  const customer = order.customer || {}
  root.innerHTML = `<article class="order-receipt" aria-labelledby="receiptTitle">
    <header class="receipt-heading">
      <div><p class="eyebrow">Request prepared</p><h1 id="receiptTitle">Thank you for your <em>selection.</em></h1></div>
      <div class="receipt-reference"><span>Order reference</span><strong data-no-translate id="receiptReference"></strong><time data-no-translate id="receiptDate"></time></div>
    </header>
    <div class="receipt-columns">
      <section class="receipt-items"><h2>Your selection</h2><div id="receiptItems"></div><div class="summary-row receipt-total"><strong>Subtotal</strong><strong id="receiptSubtotal"></strong></div><div class="summary-row"><span>Delivery fee</span><span id="receiptDeliveryFee"></span></div><div class="summary-row receipt-total"><strong>Total amount</strong><strong id="receiptTotal"></strong></div></section>
      <section class="receipt-delivery"><h2>Delivery details</h2><div data-no-translate><p id="orderCustomerName"></p><p id="orderCustomerAddress"></p><p id="orderCustomerPhone"></p><p id="orderCustomerEmail"></p></div><div id="receiptNote" hidden><h3>Order notes</h3><p data-no-translate id="orderCustomerNote"></p></div></section>
    </div>
    <div class="receipt-actions"><a class="button button-dark" href="shop.html">Return to the collection <span class="site-icon icon-arrow" aria-hidden="true"></span></a><button type="button" class="button button-outline" id="printReceipt">Print receipt</button><a class="button button-outline" id="trackThisOrder">Track This Order</a></div>
    <p class="receipt-print-brand" data-no-translate>PADAMYA DHAMMA · Objects for stillness</p>
  </article>`
  const setText = (id, value) => { document.getElementById(id).textContent = value || '' }
  if (order.isDemo || order.simulated) {
    const label = document.createElement('p')
    label.className = 'receipt-demo-label'
    label.textContent = 'Demonstration data · Status updates are simulated, not carrier events.'
    root.querySelector('.receipt-heading').after(label)
  }
  setText('receiptReference', order.ref)
  document.getElementById('trackThisOrder').href = 'track-order.html?order=' + encodeURIComponent(order.ref)
  const date = new Date(order.createdAt)
  if (!Number.isNaN(date.getTime())) {
    const time = document.getElementById('receiptDate')
    time.dateTime = date.toISOString()
    time.textContent = date.toLocaleDateString(document.documentElement.lang === 'my' ? 'my-MM' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
  }
  for (const item of order.items || []) {
    const product = item.name && Number.isFinite(item.price) ? item : getProduct(item.id)
    const row = document.createElement('div')
    row.className = 'receipt-item'
    const image = document.createElement('img')
    image.src = product.image
    image.alt = product.name
    const label = document.createElement('span')
    label.textContent = `${product.name} × ${item.qty}`
    const price = document.createElement('span')
    price.textContent = money(product.price * item.qty)
    row.append(image, label, price)
    document.getElementById('receiptItems').append(row)
  }
  setText('receiptSubtotal', money(order.subtotal ?? order.total ?? 0))
  setText('receiptDeliveryFee', order.deliveryFee == null ? 'To be confirmed' : money(order.deliveryFee))
  setText('receiptTotal', money(order.total || 0))
  setText('orderCustomerName', customer.name)
  setText('orderCustomerAddress', [customer.address, customer.city, customer.country].filter(Boolean).join(', '))
  setText('orderCustomerPhone', customer.phone)
  setText('orderCustomerEmail', customer.email)
  if (customer.note) {
    document.getElementById('receiptNote').hidden = false
    setText('orderCustomerNote', customer.note)
  }
  document.getElementById('printReceipt').addEventListener('click', () => window.print())
}
function initMenu() {
  const b = document.getElementById('menuToggle'),
    n = document.getElementById('mainNav')
  if (!b || !n || b.dataset.accountDrawerTrigger === 'true') return
  const mobile = matchMedia('(max-width:1000px)')
  b.setAttribute('aria-controls', n.id)
  b.innerHTML = '<span class="site-icon icon-menu" aria-hidden="true"></span>'
  const menuIcon = b.firstElementChild
  let lastScroll = window.scrollY
  function setOpen(open, restoreFocus = false) {
    open = mobile.matches && open
    n.classList.toggle('open', open)
    n.inert = mobile.matches && !open
    if (mobile.matches) n.setAttribute('aria-hidden', String(!open))
    else n.removeAttribute('aria-hidden')
    b.setAttribute('aria-expanded', String(open))
    menuIcon.className = 'site-icon ' + (open ? 'icon-cross' : 'icon-menu')
    lastScroll = window.scrollY
    if (restoreFocus) b.focus()
  }
  b.onclick = () => setOpen(!n.classList.contains('open'))
  n.addEventListener('click', event => { if (event.target.closest('a')) setOpen(false) })
  document.addEventListener('pointerdown', event => {
    if (n.classList.contains('open') && !n.contains(event.target) && !b.contains(event.target)) setOpen(false)
  })
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && n.classList.contains('open')) setOpen(false, true)
  })
  window.addEventListener('scroll', () => {
    const current = window.scrollY
    if (n.classList.contains('open') && current > lastScroll + 1) setOpen(false)
    lastScroll = current
  }, { passive: true })
  mobile.addEventListener('change', () => setOpen(false))
  window.addEventListener('sacredform:closemenu', () => setOpen(false))
  setOpen(false)
}
function initGlobal() {
  updateCartCount()
  initMenu()
  document.querySelectorAll('.discovery-category').forEach(card => {
    const p = PRODUCTS.find(
      p => p.id === card.querySelector('[data-wishlist]')?.dataset.wishlist
    )
    const image = card.querySelector('.category-photo img')
    if (p?.assetSet && image) {
      image.src = p.image
      image.alt = p.name
      image.classList.add('asset-photo')
    }
  })
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-add]')
    if (b) {
      e.preventDefault()
      addToCart(b.dataset.add)
    }
  })
  const io =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
        entries =>
          entries.forEach(e => {
            if (e.isIntersecting) {
              e.target.classList.add('visible')
              io.unobserve(e.target)
            }
          }),
        { threshold: 0.1 }
      )
      : null
  document
    .querySelectorAll('.reveal')
    .forEach(el => (io ? io.observe(el) : el.classList.add('visible')))
}
document.addEventListener('DOMContentLoaded', async () => {
  await window.SacredStore?.ready
  initGlobal()
  initCollectionFeature()
  initShop()
  initProduct()
  initShrine()
  renderCartPage()
  initCheckout()
  initOrderSuccess()
  initWishlist()
})

/* White hover information box */

const hero = document.querySelector('.hero')
const artworks = document.querySelectorAll('.artwork')
const hoverCard = document.getElementById('hoverCard')

const cardNumber = document.getElementById('cardNumber')
const cardTitle = document.getElementById('cardTitle')
const cardDescription = document.getElementById('cardDescription')

function activateArtwork(artwork, event) {
  if (!hero || !hoverCard) return
  artworks.forEach(item => item.classList.toggle('is-active', item === artwork))
  hero.classList.add('has-active-artwork')
  cardTitle.textContent = artwork.dataset.title
  hoverCard.classList.add('show')
  if (event && event.type.startsWith('pointer')) moveCard(event)
  else {
    const rect = artwork.getBoundingClientRect()
    moveCard({
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    })
  }
}
function clearArtwork() {
  artworks.forEach(item => item.classList.remove('is-active'))
  hero?.classList.remove('has-active-artwork')
  hoverCard?.classList.remove('show')
}
artworks.forEach(artwork => {
  artwork.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'touch') activateArtwork(artwork, event)
  })
  artwork.addEventListener('pointermove', event => {
    if (event.pointerType !== 'touch') moveCard(event)
  })
  artwork.addEventListener('pointerleave', () => {
    const focused = [...artworks].find(item => item.matches(':focus-visible'))
    if (focused) activateArtwork(focused)
    else clearArtwork()
  })
  artwork.addEventListener('focus', () => {
    if (artwork.matches(':focus-visible')) activateArtwork(artwork)
  })
  artwork.addEventListener('blur', clearArtwork)
})

function moveCard(event) {
  const rect = hero.getBoundingClientRect()

  const cardWidth = hoverCard.offsetWidth || 190
  const cardHeight = hoverCard.offsetHeight || 90

  let x = event.clientX - rect.left + 18
  let y = event.clientY - rect.top + 15

  if (x + cardWidth > rect.width - 12) {
    x = event.clientX - rect.left - cardWidth - 18
  }

  if (y + cardHeight > rect.height - 12) {
    y = rect.height - cardHeight - 12
  }

  hoverCard.style.left = Math.max(10, x) + 'px'
  hoverCard.style.top = Math.max(10, y) + 'px'
}

/* Text scrambling belongs only to the split text-and-arrow CTAs. */
; (() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const active = new Map()
  const selector = '.hero .cta, .split-cta'
  function stop(el) {
    const state = active.get(el)
    if (!state) return
    cancelAnimationFrame(state.frame)
    state.labels.forEach(label => label.removeAttribute('data-scrambling'))
    active.delete(el)
  }
  function animate(el) {
    if (!el || !el.matches(selector) || el.disabled || reduced.matches || window.SacredAccessibility?.reduceMotion() || document.documentElement.lang === 'my') return
    stop(el)
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    const nodes = []
    while (walker.nextNode()) {
      const node = walker.currentNode
      if (
        /[a-z]/i.test(node.textContent) &&
        !node.parentElement.closest(
          '.scramble-label, svg, [aria-hidden="true"], .cart-count, .wishlist-count'
        )
      )
        nodes.push(node)
    }
    nodes.forEach(node => {
      const label = document.createElement('span')
      label.className = 'scramble-label'
      const original = document.createElement('span')
      original.className = 'scramble-original'
      original.textContent = node.textContent
      const visual = document.createElement('span')
      visual.className = 'scramble-visual'
      visual.setAttribute('aria-hidden', 'true')
      label.append(original, visual)
      node.replaceWith(label)
    })
    const labels = [...el.querySelectorAll('.scramble-label')]
    if (!labels.length) return
    const state = { labels, frame: 0 }
    active.set(el, state)
    const start = performance.now()
    let lastStep = -1
    function tick(now) {
      if (!el.isConnected || reduced.matches || window.SacredAccessibility?.reduceMotion() || document.documentElement.lang === 'my' || now - start >= 420) {
        stop(el)
        return
      }
      const step = Math.floor((now - start) / 35)
      if (step !== lastStep) {
        lastStep = step
        labels.forEach(label => {
          const text = label.firstElementChild.textContent
          const reveal = Math.floor((text.length * (now - start)) / 420)
          label.lastElementChild.textContent = [...text]
            .map((c, i) => {
              if (i < reveal || !/[a-z]/i.test(c)) return c
              const alphabet =
                c === c.toUpperCase()
                  ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
                  : 'abcdefghijklmnopqrstuvwxyz'
              return alphabet[Math.floor(Math.random() * alphabet.length)]
            })
            .join('')
          label.setAttribute('data-scrambling', '')
        })
      }
      state.frame = requestAnimationFrame(tick)
    }
    tick(start)
  }
  for (const type of ['pointerover', 'pointerout', 'focusin', 'focusout']) {
    document.addEventListener(type, event => {
      if (event.pointerType === 'touch') return
      const el = event.target.closest(selector)
      if (
        !el ||
        (event.relatedTarget instanceof Node &&
          el.contains(event.relatedTarget))
      )
        return
      animate(el)
    })
  }
  window.addEventListener('sacredform:languagechange', () => [...active.keys()].forEach(stop))
  window.addEventListener('sacredform:accessibilitychange',()=>{if(window.SacredAccessibility?.reduceMotion())[...active.keys()].forEach(stop)})
  reduced.addEventListener('change', () => {
    if (reduced.matches) [...active.keys()].forEach(stop)
  })
})()

/* Wishlist is shared across pages and saved in this browser. */
const WISHLIST_KEY = 'sacredFormWishlist_v1'
const heartIcon =
  '<span class="site-icon icon-heart" aria-hidden="true"></span>'
function getWishlist() {
  try {
    const value = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]')
    return Array.isArray(value)
      ? [...new Set(value.filter(id => PRODUCTS.some(p => p.id === id)))]
      : []
  } catch {
    return []
  }
}
function wishlistButton(p, detail = false) {
  const saved = getWishlist().includes(p.id)
  const label = saved ? 'Remove from wishlist' : 'Save to wishlist'
  return `<button type="button" class="wishlist-toggle ${detail ? 'wishlist-detail' : 'wishlist-heart'
    }" data-wishlist="${p.id}" aria-pressed="${saved}" aria-label="${label}: ${p.name
    }" title="${label}">${heartIcon}${detail ? '<span class="wishlist-button-label">' + label + '</span>' : ''
    }</button>`
}
function syncWishlist() {
  const ids = getWishlist()
  document.querySelectorAll('.wishlist-count').forEach(el => {
    el.textContent = ids.length
    el.closest('a')?.setAttribute(
      'aria-label',
      `Wishlist, ${ids.length} saved ${ids.length === 1 ? 'piece' : 'pieces'}`
    )
  })
  document.querySelectorAll('[data-wishlist]').forEach(button => {
    const saved = ids.includes(button.dataset.wishlist)
    const p = PRODUCTS.find(p => p.id === button.dataset.wishlist)
    const label = saved ? 'Remove from wishlist' : 'Save to wishlist'
    button.setAttribute('aria-pressed', String(saved))
    button.setAttribute('aria-label', label + ': ' + p.name)
    button.title = label
    const text = button.querySelector('.wishlist-button-label')
    if (text) text.textContent = label
  })
  window.syncWishlistComparison?.()
}
function wishlistCard(p, index) {
  const photo = p.image
  return (
    '<article class="saved-piece">' +
    '<div class="saved-piece-visual"><a href="product.html?id=' +
    p.id +
    '" aria-label="View ' +
    p.name +
    '"><img src="' +
    photo +
    '" class="' +
    (p.assetSet ? 'asset-photo' : '') +
    '" alt="' +
    (p.assetSet
      ? p.name + ' — front view'
      : 'Illustrative photograph for ' + p.name) +
    '"></a><span class="saved-piece-number">' +
    String(index + 1).padStart(2, '0') +
    ' / SAVED</span>' +
    wishlistButton(p) +
    '</div>' +
    '<div class="saved-piece-info"><div class="saved-piece-title"><h2><a href="product.html?id=' +
    p.id +
    '">' +
    p.name +
    '</a></h2><span>' +
    money(p.price) +
    '</span></div><p>' +
    p.category +
    ' <span>·</span> ' +
    p.height +
    '</p>' +
    '<div class="saved-piece-actions"><button type="button" class="saved-bag" data-add="' +
    p.id +
    '"><span>Add to bag</span><span aria-hidden="true">＋</span></button><a class="saved-compare" href="compare.html?piece=' +
    encodeURIComponent(p.id) +
    '" aria-label="Add ' +
    p.name +
    ' to compare">Compare <span aria-hidden="true"><span class="site-icon icon-arrow" aria-hidden="true"></span></span></a></div></div></article>'
  )
}
function fitWishlistFirstRow() {
  const page = document.querySelector('.wishlist-page')
  if (!page) return
  if (!matchMedia('(min-width: 901px) and (min-height: 600px)').matches) {
    page.style.removeProperty('--wishlist-photo-height')
    return
  }
  const cards = [...page.querySelectorAll('.saved-piece')].slice(0, 3)
  if (!cards.length) return
  const firstPhoto = cards[0].querySelector('.saved-piece-visual')
  const photoTop = firstPhoto.getBoundingClientRect().top + window.scrollY
  const infoHeight = Math.max(
    ...cards.map(
      card =>
        card.querySelector('.saved-piece-info').getBoundingClientRect().height
    )
  )
  const height = Math.floor(
    Math.max(
      150,
      Math.min(440, window.innerHeight - photoTop - infoHeight - 26)
    )
  )
  const value = height + 'px'
  if (page.style.getPropertyValue('--wishlist-photo-height') !== value)
    page.style.setProperty('--wishlist-photo-height', value)
}
function renderWishlist() {
  const root = document.getElementById('wishlistContent')
  if (!root) return
  const ids = getWishlist()
  root.innerHTML = ids.length
    ? '<div class="saved-collection-bar"><span>' +
    String(ids.length).padStart(2, '0') +
    ' PIECES SAVED</span><a href="shop.html">Explore the collection <span aria-hidden="true"><span class="site-icon icon-arrow" aria-hidden="true"></span></span></a></div><div class="saved-pieces-grid">' +
    ids
      .map((id, index) =>
        wishlistCard(
          PRODUCTS.find(p => p.id === id),
          index
        )
      )
      .join('') +
    '</div>'
    : '<div class="empty-cart"><p class="eyebrow">Make room for a favourite</p><h2>Your wishlist is waiting.</h2><p>Tap the heart on a piece you love to keep it here.</p><a class="button button-dark" href="shop.html">Explore the collection <span><span class="site-icon icon-arrow" aria-hidden="true"></span></span></a></div>'
  requestAnimationFrame(fitWishlistFirstRow)
  window.syncWishlistComparison?.()
}
function initWishlist() {
  const wishlistPage = document.querySelector('.wishlist-page')
  if (wishlistPage) {
    window.addEventListener('resize', fitWishlistFirstRow)
    document.fonts?.ready.then(fitWishlistFirstRow)
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(() =>
        requestAnimationFrame(fitWishlistFirstRow)
      )
      observer.observe(wishlistPage)
      observer.observe(document.querySelector('.site-header'))
    }
  }
  document.querySelectorAll('.header-actions:not([data-no-store-actions])').forEach(actions => {
    actions.insertAdjacentHTML(
      'afterbegin',
      `<a class="wishlist-link" href="wishlist.html" aria-label="Wishlist"><span class="header-icon-wrap">${heartIcon}<span class="cart-count wishlist-count" aria-hidden="true">0</span></span><span class="wishlist-nav-label">Wishlist</span></a>`
    )
    if (location.pathname.endsWith('/wishlist.html'))
      actions
        .querySelector('.wishlist-link')
        .setAttribute('aria-current', 'page')
  })
  renderWishlist()
  syncWishlist()
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-wishlist]')
    if (!button) return
    event.preventDefault()
    const id = button.dataset.wishlist
    const ids = getWishlist()
    const saved = ids.includes(id)
    try {
      localStorage.setItem(
        WISHLIST_KEY,
        JSON.stringify(saved ? ids.filter(x => x !== id) : [...ids, id])
      )
      window.SacredStore?.syncWishlist(saved ? ids.filter(x => x !== id) : [...ids, id])
    } catch {
      toast(
        'Your wishlist could not be saved. Please allow browser storage and try again.'
      )
      return
    }
    const onWishlist = Boolean(document.getElementById('wishlistContent'))
    const focusIndex = onWishlist
      ? [...document.querySelectorAll('[data-wishlist]')].indexOf(button)
      : -1
    renderWishlist()
    syncWishlist()
    if (onWishlist) {
      const buttons = [...document.querySelectorAll('[data-wishlist]')]
        ; (
          buttons[Math.min(focusIndex, buttons.length - 1)] ||
          document.querySelector('#wishlistContent .button')
        )?.focus()
    }
    toast(saved ? 'Removed from your wishlist' : 'Saved to your wishlist')
  })
  window.addEventListener('storage', event => {
    if (event.key === WISHLIST_KEY || event.key === null) {
      renderWishlist()
      syncWishlist()
    }
  })
}

function initCollectionFeature() {
  const root = document.getElementById('collectionFeature')
  if (!root) return
  const slides = [...root.querySelectorAll('[data-feature-slide]')]
  const names = [
    'Home shrine collection',
    'Small & simple collection',
    'Meaningful gifts collection'
  ]
  let current = 0
  function move(step) {
    current = (current + step + slides.length) % slides.length
    slides.forEach((slide, index) => {
      slide.hidden = index !== current
    })
    document.getElementById('featureSlideCount').textContent =
      String(current + 1).padStart(2, '0') + ' / 03'
    document.getElementById('featureSlideStatus').textContent = names[current]
  }
  root.querySelectorAll('[data-feature-step]').forEach(button => {
    button.addEventListener('click', () =>
      move(Number(button.dataset.featureStep))
    )
  })
  root.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      move(event.key === 'ArrowLeft' ? -1 : 1)
    }
  })
}

/* Narrow shared interface for Room Studio; the storefront's cart stays canonical. */
window.SacredForm = Object.freeze({ products: PRODUCTS, getProduct, getProductModel, money, addToCart, getCart })

