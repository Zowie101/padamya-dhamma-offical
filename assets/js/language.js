/* Local English/Burmese UI translations. Product IDs, values and customer input
 * stay canonical; only displayed copy and accessible labels are localized. */
; (() => {
  const key = 'sacredFormLanguage_v1',
    root = document.documentElement
  let language = 'en'
  try {
    language =
      localStorage.getItem(key) ||
      (navigator.language?.startsWith('my') ? 'my' : 'en')
  } catch { }
  if (!['en', 'my'].includes(language)) language = 'en'
  root.lang = language
  const textSources = new WeakMap(),
    attributeSources = new WeakMap()
  const ignored =
    'script,style,svg,pre,code,textarea,[data-no-translate],[translate="no"],.scramble-visual,.brand-mark,#orderCustomerName,#orderCustomerAddress,#orderCustomerEmail'
  const attributes = [
    'aria-label',
    'title',
    'placeholder',
    'alt',
    'aria-valuetext'
  ]
  let dictionary = {},
    lookup = new Map(),
    observer,
    toggle,
    scheduled = false,
    ready = false
  const normalize = text => text.replace(/\s+/g, ' ').trim()
  function phrase(text) {
    return dictionary[text] ?? lookup.get(text.toLowerCase())
  }
  function translate(text) {
    if (language === 'en' || !/[A-Za-z]/.test(text)) return text
    const source = normalize(text),
      exact = phrase(source)
    if (exact !== undefined) return text.replace(text.trim(), exact)
    // Buttons sometimes keep their arrow or plus sign in the same text node.
    const core = source.replace(/^[＋+↗→←↺↶↓×✦\s]+|[＋+↗→←↺↶↓×↑\s]+$/g, '')
    const mapped = phrase(core)
    if (mapped !== undefined && core) return text.replace(core, mapped)
    const names = [
      'Golden Presence',
      'Quiet Meditation',
      'Earth Touching',
      'Lotus Stillness',
      'Gentle Blessing',
      'Temple Gold'
    ]
    const name = s => phrase(s) || s
    const patterns = [
      [
        /^(Decrease|Increase) (.+)$/,
        m =>
          `${name(m[2])} အရေအတွက် ${m[1] === 'Decrease' ? 'လျှော့ရန်' : 'တိုးရန်'
          }`
      ],
      [/^(.+) × (\d+)$/, m => `${name(m[1])} × ${m[2]}`],
      [
        /^Interactive 3D model of (.+)\. Drag to rotate\.$/,
        m => `${name(m[1])} 3D ပုံစံ။ လှည့်ရန် ဆွဲပါ။`
      ],
      [
        /^Wishlist, (\d+) saved pieces?$/,
        m => `စိတ်ကြိုက်စာရင်း၊ ${m[1]} ဆူ သိမ်းထားသည်`
      ],
      [/^Shopping bag, (\d+) items?$/, m => `ဈေးခြင်း၊ ပစ္စည်း ${m[1]} ခု`],
      [/^(.+) \| Padamya Dhamma$/, m => `${name(m[1])} | Padamya Dhamma`],
      [/^View (.+) — (front|side|back)$/, m => `${name(m[1])} — ${name(m[2])}`],
      [
        /^(\d+) out of 100 match points$/,
        m => `လိုက်ဖက်မှုအမှတ် 100 အနက် ${m[1]}`
      ],
      [
        /^This ([\d.]+) cm statue exceeds the clear height by ([\d.]+) cm\. Choose a smaller height or more space\.$/,
        m =>
          `ဤ ${m[1]} cm ရုပ်ပွားတော်သည် နေရာအမြင့်ထက် ${m[2]} cm ပိုမြင့်နေသည်။ ပိုသေးသော အရွယ် သို့မဟုတ် ပိုကျယ်သော နေရာကို ရွေးပါ။`
      ],
      [
        /^Only ([\d.]+) cm above the statue\. Allow at least 5 cm of headroom\.$/,
        m =>
          `ရုပ်ပွားတော်အပေါ်တွင် ${m[1]} cm သာ လွတ်နေသည်။ အနည်းဆုံး 5 cm ချန်ထားပါ။`
      ],
      [
        /^Preparing (.+) in 3D…$/,
        m => `${name(m[1])} 3D ပုံစံကို ပြင်ဆင်နေသည်…`
      ],
      [/^(\d+) (?:piece|pieces)$/, m => `${m[1]} ဆူ`],
      [/^(\d+) saved pieces$/i, m => `သိမ်းထားသော ရုပ်ပွားတော် ${m[1]} ဆူ`],
      [/^(\d+) PIECES SAVED$/, m => `သိမ်းထားသော ရုပ်ပွားတော် ${m[1]} ဆူ`],
      [/^([\d,.]+) MMK$/, m => `${m[1]} ကျပ်`],
      [
        /^(.+) is the stronger match\.$/,
        m => `${name(m[1])} က ပိုမိုသင့်လျော်ပါသည်။`
      ],
      [
        /^(.+) added to your bag\.$/,
        m => `${name(m[1])} ကို ဈေးခြင်းထဲသို့ ထည့်ပြီးပါပြီ။`
      ],
      [
        /^Remove (.+) from preview$/,
        m => `${name(m[1])} ကို အစမ်းမြင်ကွင်းမှ ဖယ်ရန်`
      ],
      [
        /^Select (.+), placement (\d+)$/,
        m => `${name(m[1])}၊ နေရာ ${m[2]} ကို ရွေးရန်`
      ],
      [/^(\d+) of (\d+)$/, m => `${m[2]} ခုအနက် ${m[1]} ခုမြောက်`],
      [
        /^(\d+) (?:piece|pieces) placed$/,
        m => `ရုပ်ပွားတော် ${m[1]} ဆူ နေရာချထားသည်`
      ],
      [
        /^([\d.]+) cm statue(?: · (.+))?$/,
        m => `${m[1]} cm ရုပ်ပွားတော်${m[2] ? ' · ' + name(m[2]) : ''}`
      ],
      [/^(.+) — front view$/, m => `${name(m[1])} — ရှေ့မြင်ကွင်း`],
      [
        /^Save to wishlist: (.+)$/,
        m => `${name(m[1])} ကို စိတ်ကြိုက်စာရင်းတွင် သိမ်းရန်`
      ],
      [
        /^Remove from wishlist: (.+)$/,
        m => `${name(m[1])} ကို စိတ်ကြိုက်စာရင်းမှ ဖယ်ရန်`
      ],
      [/^View (.+)$/, m => `${name(m[1])} ကို ကြည့်ရန်`],
      [/^Loading (.+) in 3D…$/, m => `${name(m[1])} 3D ပုံစံကို ပြင်ဆင်နေသည်…`],
      [
        /^(.+) exceeds your ([\d.]+) cm clear height by ([\d.]+) cm\.$/,
        m =>
          `ရုပ်ပွားတော်အမြင့် ${m[1]} သည် သင်သတ်မှတ်ထားသော ${m[2]} cm ထက် ${m[3]} cm ပိုမြင့်နေသည်။`
      ],
      [
        /^([\d.]+) cm above the statue: it fits by height, but is below our suggested 5 cm headroom\.$/,
        m =>
          `အပေါ်ဘက်တွင် ${m[1]} cm လွတ်နေသည်။ အမြင့်အရ ဆံ့သော်လည်း အကြံပြုထားသော 5 cm ထက် နည်းနေသည်။`
      ],
      [
        /^([\d.]+) cm above the statue, including at least 5 cm of suggested headroom\.$/,
        m =>
          `ရုပ်ပွားတော်အပေါ်ဘက်တွင် ${m[1]} cm လွတ်နေပြီး အကြံပြုထားသော အနည်းဆုံး 5 cm ကို ပြည့်မီသည်။`
      ]
    ]
    for (const [pattern, format] of patterns) {
      const match = source.match(pattern)
      if (match) return format(match)
    }
    // Composite metadata keeps punctuation, quantities and measurements intact.
    if (source.includes(' · '))
      return source
        .split(' · ')
        .map(s => translate(s))
        .join(' · ')
    const sentences = source.split(/(?<=[.!?])\s+/)
    if (sentences.length > 1) return sentences.map(s => translate(s)).join(' ')
    for (const n of names)
      if (source.startsWith(n + ' · '))
        return source.replace(n, name(n)).replace(/ MMK\b/g, ' ကျပ်')
    return text
  }
  function original(cache, current) {
    return cache && (current === cache.rendered || current === cache.source)
      ? cache.source
      : current
  }
  function apply() {
    if (!ready || !document.body) return
    observer?.disconnect()
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT
    )
    while (walker.nextNode()) {
      const node = walker.currentNode,
        parent = node.parentElement
      if (!parent || parent.closest(ignored)) continue
      const source = original(textSources.get(node), node.data),
        rendered = translate(source)
      if (parent.tagName === 'OPTION' && !parent.hasAttribute('value'))
        parent.value = parent.textContent
      textSources.set(node, { source, rendered })
      if (node.data !== rendered) node.data = rendered
    }
    for (const el of document.body.querySelectorAll(
      attributes.map(a => `[${a}]`).join(',')
    )) {
      if (el.closest(ignored)) continue
      const cache = attributeSources.get(el) || new Map()
      for (const attribute of attributes) {
        if (!el.hasAttribute(attribute)) continue
        const source = original(
          cache.get(attribute),
          el.getAttribute(attribute)
        ),
          rendered = translate(source)
        cache.set(attribute, { source, rendered })
        if (el.getAttribute(attribute) !== rendered)
          el.setAttribute(attribute, rendered)
      }
      attributeSources.set(el, cache)
    }
    const title = document.querySelector('title')
    if (title) {
      const source = original(textSources.get(title), title.textContent),
        rendered = translate(source)
      textSources.set(title, { source, rendered })
      title.textContent = rendered
    }
    if (toggle) {
      toggle.textContent = language === 'en' ? 'မြန်မာ' : 'EN'
      toggle.lang = language === 'en' ? 'my' : 'en'
      toggle.setAttribute(
        'aria-label',
        language === 'en' ? 'Switch to Burmese' : 'အင်္ဂလိပ်ဘာသာသို့ ပြောင်းရန်'
      )
      toggle.title = language === 'en' ? 'မြန်မာဘာသာ' : 'English'
    }
    observer?.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: attributes
    })
  }
  function schedule() {
    if (scheduled) return
    scheduled = true
    requestAnimationFrame(() => {
      scheduled = false
      apply()
    })
  }
  function setLanguage(next) {
    if (!['en', 'my'].includes(next)) return
    language = next
    root.lang = next
    try {
      localStorage.setItem(key, next)
    } catch { }
    apply()
    window.dispatchEvent(
      new CustomEvent('sacredform:languagechange', {
        detail: { language: next }
      })
    )
  }
  window.SacredFormLanguage = {
    get language() {
      return language
    },
    setLanguage,
    translate
  }
  window.addEventListener('storage', event => {
    if (event.key === key && ['en', 'my'].includes(event.newValue)) {
      language = event.newValue
      root.lang = language
      apply()
    }
  })
  const dictionaryReady = fetch(
    new URL('../locales/my.json?v=20261103-address-book-1', document.currentScript.src)
  )
    .then(r => {
      if (!r.ok) throw Error('Translation file unavailable')
      return r.json()
    })
    .then(data => {
      dictionary = data
      lookup = new Map(
        Object.entries(data).map(([en, my]) => [en.toLowerCase(), my])
      )
      ready = true
    })
    .catch(() => {
      language = 'en'
      root.lang = 'en'
    })
  document.addEventListener('DOMContentLoaded', async () => {
    await dictionaryReady
    if (!ready) return
    const actions = document.querySelector(
      '.site-header .header-actions'
    )
    if (actions) {
      toggle = document.createElement('button')
      toggle.type = 'button'
      toggle.className = 'language-toggle'
      toggle.setAttribute('data-no-translate', '')
      toggle.setAttribute('data-no-scramble', '')
      toggle.addEventListener('click', () =>
        setLanguage(language === 'en' ? 'my' : 'en')
      )
      if (actions.closest('.site-header')) {
        // Keep Wishlist and Bag adjacent in both visual and keyboard order.
        actions.insertBefore(toggle, actions.querySelector('.theme-toggle'))
      } else actions.prepend(toggle)
    }
    observer = new MutationObserver(schedule)
    apply()
  })
})()
