/* Progressive enhancement. Real links, browser history, hashes and app dialogs
   keep their native behavior. No HTML fetching or replacement of page content. */
;(() => {
  const root = document.documentElement
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
  const reduce=()=>window.SacredAccessibility?.reduceMotion() ?? reducedMotion.matches
  const native = 'onpagereveal' in window && 'onpageswap' in window && location.protocol !== 'file:'
  root.dataset.pageMotion = native ? 'native' : 'fallback'
  let leaving = false, timer, recovery
  function reset() {
    clearTimeout(timer); clearTimeout(recovery)
    leaving = false
    root.classList.remove('page-is-leaving')
  }
  function navigate(destination) {
    const url = new URL(destination, location.href)
    if (native || reduce()) { location.assign(url.href); return }
    if (leaving) return
    leaving = true
    root.classList.add('page-is-leaving')
    timer = setTimeout(() => {
      try { location.assign(url.href) } catch { reset() }
      // Restore interaction if a leave-page confirmation is cancelled.
      recovery = setTimeout(reset, 900)
    }, 140)
  }
  window.SacredPageMotion = Object.freeze({ navigate })
  // Register after storefront/Room Studio handlers so cancelled links stay local.
  window.addEventListener('load', () => {
    if (native) return
    document.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || reduce()) return
      const link = event.target.closest?.('a[href]')
      if (!link || link.hasAttribute('download') || link.hasAttribute('data-no-page-transition') || (link.target && link.target !== '_self')) return
      const url = new URL(link.href, location.href)
      if (url.origin !== location.origin || !['http:', 'https:', 'file:'].includes(url.protocol) || !url.pathname.endsWith('.html')) return
      // In-page anchors and reloads retain browser scrolling and focus behavior.
      if (url.pathname === location.pathname && url.search === location.search) return
      event.preventDefault()
      navigate(url.href)
    })
  }, { once: true })
  window.addEventListener('pageshow', reset)
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) reset() })
  window.addEventListener('sacredform:accessibilitychange',()=>{if(reduce())reset()})
})()
