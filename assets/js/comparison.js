/* Local photo comparison. */
; (() => {
  const root = document.getElementById('wishlistAdviser')
  if (!root) return
  const el = id => document.getElementById(id)
  const form = el('compareForm'),
    first = el('compareFirst'),
    second = el('compareSecond')
  const result = el('comparisonResult'),
    upload = el('shrineUpload'),
    camera = el('shrineCamera')
  let photo = null,
    photoUrl = null,
    photoVersion = 0

  let requestedPiece = new URLSearchParams(location.search).get('piece')
  let chartObserver = null
  function invalidate() {
    chartObserver?.disconnect()
    result.hidden = true
    result.classList.remove('reasons-open')
    result.innerHTML = ''
    el('compareError').textContent = ''
    el('runComparison').disabled =
      !photo || !first.value || !second.value || first.value === second.value
  }
  const productPhoto = p => p.image
  function selection() {
    for (const [select, prefix] of [
      [first, 'compareFirst'],
      [second, 'compareSecond']
    ]) {
      const p = PRODUCTS.find(p => p.id === select.value),
        img = el(prefix + 'Photo')
      if (p) {
        img.src = productPhoto(p)
        img.alt = p.assetSet
          ? p.name + ' — front view'
          : 'Illustrative preview for ' + p.name
        img.classList.toggle('asset-photo', Boolean(p.assetSet))
        el(prefix + 'Meta').textContent = p.height + ' · ' + money(p.price)
      } else {
        img.removeAttribute('src')
        img.alt = ''
        el(prefix + 'Meta').textContent = ''
      }
    }
    invalidate()
  }
  function idsRequested() {
    const requested = requestedPiece
    requestedPiece = null
    return getWishlist().includes(requested) ? requested : first.value
  }
  window.syncWishlistComparison = () => {
    const ids = getWishlist(),
      a = idsRequested(),
      b = second.value
    form.hidden = ids.length < 2
    el('compareEmpty').hidden = ids.length >= 2
    for (const select of [first, second])
      select.innerHTML = ids
        .map(
          id =>
            '<option value="' +
            id +
            '">' +
            PRODUCTS.find(p => p.id === id).name +
            '</option>'
        )
        .join('')
    first.value = ids.includes(a) ? a : ids[0] || ''
    second.value =
      ids.includes(b) && b !== first.value
        ? b
        : ids.find(id => id !== first.value) || ''
    selection()
  }
  for (const select of [first, second])
    select.addEventListener('change', () => {
      if (first.value === second.value)
        (select === first ? second : first).value =
          getWishlist().find(id => id !== select.value) || ''
      selection()
    })
  el('compareHeight').addEventListener('input', invalidate)
  el('compareStyle').addEventListener('change', invalidate)
  function clearPhoto() {
    photoVersion++
    photo = null
    root.classList.remove('has-photo')
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    photoUrl = null
    upload.value = ''
    camera.value = ''
    el('comparePhoto').removeAttribute('src')
    el('photoPreviewWrap').hidden = true
    el('uploadStatus').textContent = ''
    invalidate()
  }
  el('clearComparePhoto').addEventListener('click', clearPhoto)
  el('changeComparePhoto').addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      upload.click()
    }
  })
  for (const button of [el('takeShrinePhoto'), el('retakeShrinePhoto')]) {
    button.addEventListener('click', () => camera.click())
  }
  async function readPhoto(input) {
    const file = input.files[0]
    if (!file) return
    clearPhoto()
    if (
      !['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(
        file.type
      ) ||
      file.size > 12 * 1024 * 1024
    ) {
      el('uploadStatus').textContent =
        'Choose a JPG, PNG, WebP or AVIF image smaller than 12 MB.'
      return
    }
    const version = photoVersion,
      url = URL.createObjectURL(file)
    photoUrl = url
    el('uploadStatus').textContent = 'Reading the photo on your device…'
    try {
      const img = new Image()
      img.src = url
      await img.decode()
      if (version !== photoVersion) return
      if (img.naturalWidth < 64 || img.naturalHeight < 64) throw Error('small')
      const c = document.createElement('canvas'),
        long = Math.max(img.naturalWidth, img.naturalHeight)
      c.width = Math.max(1, Math.round((192 * img.naturalWidth) / long))
      c.height = Math.max(1, Math.round((192 * img.naturalHeight) / long))
      const ctx = c.getContext('2d', { willReadFrequently: true })
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, c.width, c.height)
      ctx.drawImage(img, 0, 0, c.width, c.height)
      const px = ctx.getImageData(0, 0, c.width, c.height).data
      let brightness = 0,
        warmth = 0,
        saturation = 0
      for (let i = 0; i < px.length; i += 4) {
        const r = px[i] / 255,
          g = px[i + 1] / 255,
          b = px[i + 2] / 255,
          max = Math.max(r, g, b),
          min = Math.min(r, g, b)
        brightness += 0.2126 * r + 0.7152 * g + 0.0722 * b
        warmth += r - b
        saturation += max ? (max - min) / max : 0
      }
      const n = px.length / 4
      photo = {
        brightness: brightness / n,
        warmth: warmth / n,
        saturation: saturation / n
      }
      el('comparePhoto').src = url
      el('photoPreviewWrap').hidden = false
      root.classList.add('has-photo')
      el('uploadStatus').textContent = 'Photo ready.'
      invalidate()
    } catch {
      if (version !== photoVersion) return
      clearPhoto()
      el('uploadStatus').textContent =
        'This image could not be read. Try a larger JPG, PNG or WebP photo.'
    }
  }
  for (const input of [upload, camera])
    input.addEventListener('change', () => readPhoto(input))
  function assess(p, height, preference) {
    const gold = /gold/i.test(p.material),
      bronze = /bronze/i.test(p.material),
      ivory = /ivory/i.test(p.material),
      neutral = !gold && !bronze
    const tall = parseFloat(p.height),
      warmRoom = photo.warmth > 0.06,
      mutedRoom = photo.saturation < 0.22,
      dark = photo.brightness < 0.4,
      bright = photo.brightness > 0.7
    const criteria = []
    let fits = true
    if (height !== null) {
      const gap = Math.round((height - tall) * 10) / 10
      fits = gap >= 0
      criteria.push({
        title: 'Height clearance',
        points: gap >= 5 ? 45 : gap >= 0 ? 25 : 0,
        max: 45,
        reason:
          gap < 0
            ? p.height +
            ' exceeds your ' +
            height +
            ' cm clear height by ' +
            Math.abs(gap) +
            ' cm.'
            : gap < 5
              ? gap +
              ' cm above the statue: it fits by height, but is below our suggested 5 cm headroom.'
              : gap +
              ' cm above the statue, including at least 5 cm of suggested headroom.'
      })
    }
    criteria.push({
      title: 'Palette pairing',
      max: 20,
      points: warmRoom
        ? gold || bronze
          ? 20
          : 13
        : mutedRoom
          ? neutral
            ? 20
            : 13
          : 15,
      reason: warmRoom
        ? gold || bronze
          ? 'Its warm listed finish echoes the warm average colour in your photo.'
          : 'Its neutral listed finish gives a quieter counterpoint to the warm average colour in your photo.'
        : mutedRoom
          ? neutral
            ? 'Its neutral listed finish suits the subdued overall colour in your photo.'
            : 'Its warm listed finish adds a stronger accent to the subdued overall colour in your photo.'
          : 'Your photo has a mixed overall palette, so colour alone does not strongly favour this finish.'
    })
    criteria.push({
      title: 'Visual contrast',
      max: 15,
      points: dark
        ? ivory
          ? 15
          : gold
            ? 13
            : bronze
              ? 7
              : 10
        : bright
          ? bronze
            ? 15
            : !gold && !ivory
              ? 13
              : 10
          : 12,
      reason: dark
        ? ivory || gold
          ? 'A lighter listed finish may be more visible against the dark average background.'
          : 'Its darker or muted listed finish may blend into the dark average background.'
        : bright
          ? bronze || (!gold && !ivory)
            ? 'Its deeper or muted listed finish may stand out against the light average background.'
            : 'A light or reflective finish may need a contrasting backdrop in this bright photo.'
          : 'The mid-range photo brightness does not strongly favour a light or dark finish.'
    })
    if (preference !== 'none') {
      const points =
        preference === 'warm'
          ? gold || bronze
            ? 20
            : 10
          : preference === 'calm'
            ? neutral
              ? 20
              : 12
            : gold || bronze
              ? 20
              : 13
      criteria.push({
        title: 'Your preferred feeling',
        points,
        max: 20,
        reason:
          points === 20
            ? 'Its listed finish is a closer match for your selected style preference.'
            : 'Its listed finish is a less direct match for your selected style preference.'
      })
    }
    const score = Math.round(
      (criteria.reduce((n, c) => n + c.points, 0) /
        criteria.reduce((n, c) => n + c.max, 0)) *
      100
    )
    return { p, fits, score, criteria }
  }
  form.addEventListener('submit', event => {
    event.preventDefault()
    if (!photo || first.value === second.value) return
    const value = el('compareHeight').value,
      height = value === '' ? null : Number(value)
    if (
      height !== null &&
      (!Number.isFinite(height) || height < 1 || height > 500)
    ) {
      el('compareError').textContent =
        'Enter a clear height between 1 and 500 cm, or leave it blank.'
      return
    }
    const ids = getWishlist()
    if (!ids.includes(first.value) || !ids.includes(second.value)) {
      window.syncWishlistComparison()
      return
    }
    chartObserver?.disconnect()
    result.classList.remove('reasons-open')
    const pair = [first.value, second.value].map(id =>
      assess(
        PRODUCTS.find(p => p.id === id),
        height,
        el('compareStyle').value
      )
    )
    const eligible = pair.filter(x => x.fits).sort((a, b) => b.score - a.score),
      winner = eligible[0]
    const close =
      eligible.length === 2 && Math.abs(pair[0].score - pair[1].score) <= 5
    const poorPhoto = photo.brightness < 0.15 || photo.brightness > 0.9
    const title = !winner
      ? 'Neither clears your shelf height.'
      : close
        ? 'Both are close contenders.'
        : winner.p.name + ' is the stronger match.'
    const brightness =
      photo.brightness < 0.4
        ? 'dark'
        : photo.brightness > 0.7
          ? 'bright'
          : 'mid-brightness'
    const colour =
      photo.warmth > 0.06 ? 'warm' : photo.warmth < -0.04 ? 'cool' : 'neutral'
    const displayed =
      winner && !close ? [winner, ...pair.filter(x => x !== winner)] : pair
    const verdictNote = !winner
      ? 'Both exceed your entered shelf height.'
      : close
        ? 'Within 5 match points — either could suit your space.'
        : eligible.length === 1
          ? 'The only piece that clears your entered shelf height.'
          : 'A stronger balance of finish, contrast and your selected details.'
    result.innerHTML =
      '<div class="result-hero"><div class="result-heading"><div><p class="eyebrow">Your comparison</p><h2 id="comparisonResultTitle">' +
      title +
      '</h2><p>' +
      verdictNote +
      '</p></div><a class="text-link" href="#compareForm">Edit comparison ↑</a></div>' +
      (poorPhoto
        ? '<p class="compare-caution">Photo quality is limited. Try a naturally lit photo for a more useful comparison.</p>'
        : '') +
      '<div class="comparison-cards">' +
      displayed
        .map(x => {
          const recommended = winner === x && !close
          const badge = !x.fits
            ? 'Does not fit your shelf height'
            : recommended
              ? '✦ Stronger match'
              : close
                ? 'Close contender'
                : 'Alternative'
          return (
            '<article class="comparison-piece ' +
            (recommended ? 'recommended' : '') +
            '"><div class="result-card-top"><span class="match-badge">' +
            badge +
            '</span><span class="result-piece-height">' +
            x.p.height +
            '</span></div>' +
            '<div class="result-photo-area"><img class="comparison-result-photo ' +
            (x.p.assetSet ? 'asset-photo' : '') +
            '" src="' +
            productPhoto(x.p) +
            '" alt="' +
            (x.p.assetSet
              ? x.p.name + ' — front view'
              : 'Illustrative preview for ' + x.p.name) +
            '"></div>' +
            '<div class="result-card-footer"><div><h3>' +
            x.p.name +
            '</h3><p>' +
            money(x.p.price) +
            ' · ' +
            x.p.material +
            '</p><a class="text-link" href="product.html?id=' +
            x.p.id +
            '">View piece <span class="site-icon icon-arrow" aria-hidden="true"></span></a></div>' +
            '<div class="score-chart" role="img" aria-label="' +
            x.score +
            ' out of 100 match points" data-score="' +
            x.score +
            '" style="--score-offset:' +
            251.327 * (1 - x.score / 100) +
            '"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="score-track" cx="50" cy="50" r="40"/><circle class="score-progress" cx="50" cy="50" r="40"/></svg><span class="score-value" aria-hidden="true">' +
            x.score +
            '</span><span class="score-unit">match points</span></div></div>' +
            '<details class="piece-reasons"><summary>Why this score?</summary><ul>' +
            x.criteria
              .map(
                c =>
                  '<li><div><strong>' +
                  c.title +
                  '</strong><span>' +
                  c.points +
                  '/' +
                  c.max +
                  '</span></div><p>' +
                  c.reason +
                  '</p></li>'
              )
              .join('') +
            '</ul></details></article>'
          )
        })
        .join('') +
      '</div><p class="result-footnote">Local algorithm · Match points are a comparison score, not a probability. ' +
      (height === null
        ? 'Physical fit has not been checked.'
        : 'Height checked; confirm shelf width, depth and weight capacity.') +
      '</p></div>' +
      '<p class="photo-reading">Photo: ' +
      brightness +
      ' overall exposure · ' +
      colour +
      ' average colour.</p>' +
      '<details class="comparison-method"><summary>How this recommendation is calculated</summary><p>Match points are a weighted rule score, not a probability or an AI confidence rating. Height clearance contributes up to 45 points when entered; palette pairing 20; visual contrast 15; and your chosen style preference 20 when selected. The total is scaled to 100 using only the criteria supplied. A piece that exceeds your entered height is never recommended, regardless of its score. Within 5 match points, the result is treated as a close call.</p><p>Colour and contrast rules use listed material descriptions and whole-image pixel averages. They cannot recognise your shrine or the statue, isolate a shelf, judge sacred suitability, predict true product colour or assess width, depth and stability. Check product measurements and actual photographs before ordering.</p></details>' +
      '<p class="adviser-small">' +
      (height === null
        ? 'No shelf height was entered, so physical fit has not been assessed. '
        : 'Only vertical clearance was checked. ') +
      'Shelf width, depth, weight capacity and actual product finish still need checking.</p>'
    result.hidden = false
    const reduced = (window.SacredAccessibility?.reduceMotion() ?? matchMedia('(prefers-reduced-motion: reduce)').matches)
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          observer.unobserve(entry.target)
          const chart = entry.target
          chart.classList.add('is-animated')
          if (reduced) return
          const value = chart.querySelector('.score-value')
          const target = Number(chart.dataset.score)
          const start = performance.now()
          function count(now) {
            if (!chart.isConnected) return
            const progress = Math.min(1, (now - start) / 1000)
            value.textContent = Math.round(
              target * (1 - Math.pow(1 - progress, 3))
            )
            if (progress < 1) requestAnimationFrame(count)
          }
          requestAnimationFrame(count)
        })
      },
      { threshold: 0.6 }
    )
    chartObserver = observer
    result
      .querySelectorAll('.score-chart')
      .forEach(chart => observer.observe(chart))
    result.querySelectorAll('.piece-reasons').forEach(details => {
      details.addEventListener('toggle', () => {
        result.classList.toggle(
          'reasons-open',
          [...result.querySelectorAll('.piece-reasons')].some(d => d.open)
        )
      })
    })
    result.focus({ preventScroll: true })
    result.scrollIntoView({
      behavior: (window.SacredAccessibility?.reduceMotion() ?? matchMedia('(prefers-reduced-motion: reduce)').matches)
        ? 'instant'
        : 'smooth',
      block: 'start'
    })
  })
  document.addEventListener('DOMContentLoaded', window.syncWishlistComparison)
  window.addEventListener('pagehide', () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl)
  })
})()
