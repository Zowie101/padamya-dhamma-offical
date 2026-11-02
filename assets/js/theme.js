/* Apply before styles load so navigation never flashes the opposite theme. */
; (() => {
  const key = 'sacredFormTheme_v1'
  const root = document.documentElement
  const system = window.matchMedia('(prefers-color-scheme: dark)')
  let preference = null
  let toggle
  try {
    const saved = localStorage.getItem(key)
    if (saved === 'light' || saved === 'dark') preference = saved
  } catch {
    /* The switch still works if browser storage is blocked. */
  }

  function apply() {
    const dark = (preference || (system.matches ? 'dark' : 'light')) === 'dark'
    root.dataset.theme = dark ? 'dark' : 'light'
    const browserColour = document.querySelector('meta[name="theme-color"]')
    if (browserColour) browserColour.content = dark ? '#181c18' : '#f8f7f3'
    if (!toggle) return
    const label = dark ? 'Switch to light mode' : 'Switch to dark mode'
    toggle.setAttribute('aria-label', label)
    toggle.setAttribute('aria-pressed', String(dark))
    toggle.title = label
  }
  apply()
  system.addEventListener('change', () => {
    if (!preference) apply()
  })
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return
    preference =
      event.newValue === 'light' || event.newValue === 'dark'
        ? event.newValue
        : null
    apply()
  })
  document.addEventListener('DOMContentLoaded', () => {
    const actions = document.querySelector('.site-header .header-actions')
    if (!actions) return
    toggle = document.createElement('button')
    toggle.type = 'button'
    toggle.className = 'theme-toggle'
    toggle.setAttribute('data-no-scramble', '')
    toggle.innerHTML =
      '<span class="site-icon icon-moon theme-icon-moon" aria-hidden="true"></span><span class="site-icon icon-sun theme-icon-sun" aria-hidden="true"></span>'
    toggle.addEventListener('click', () => {
      preference = root.dataset.theme === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(key, preference)
      } catch { }
      apply()
    })
    actions.append(toggle)
    apply()
  })
})()
