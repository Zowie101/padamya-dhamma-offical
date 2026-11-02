/* Local preferences complement native browser and assistive-technology controls. */
;(() => {
  const root=document.documentElement,key='sacredFormAccessibility_v1'
  const system=matchMedia('(prefers-reduced-motion: reduce)')
  const defaults={text:'default',contrast:false,links:false,motion:false}
  function validate(value){return {text:['default','large','larger'].includes(value?.text)||(Number.isInteger(value?.text)&&value.text>=100&&value.text<=130)?value.text:'default',contrast:value?.contrast===true,links:value?.links===true,motion:value?.motion===true}}
  const textPercent=()=>typeof settings.text==='number'?settings.text:settings.text==='large'?115:settings.text==='larger'?130:100
  let settings={...defaults},dialog,returnTo,frame,resizeTimer,closeTimer,closing=false
  try{settings=validate(JSON.parse(localStorage.getItem(key)||'null'))}catch{}
  const reduced=()=>settings.motion||system.matches
  function apply(){
    root.dataset.a11yText=textPercent()===100?'default':String(settings.text)
    root.toggleAttribute('data-a11y-contrast',settings.contrast)
    root.toggleAttribute('data-a11y-links',settings.links)
    root.toggleAttribute('data-a11y-motion',reduced())
    root.style.setProperty('--sf-text-scale',String(textPercent()/100))
    window.dispatchEvent(new CustomEvent('sacredform:accessibilitychange',{detail:{...settings,reducedMotion:reduced()}}))
  }
  apply()
  window.SacredAccessibility=Object.freeze({reduceMotion:reduced,open:()=>openPanel()})
  system.addEventListener('change',apply)
  window.addEventListener('storage',event=>{if(event.key!==key&&event.key!==null)return;try{settings=validate(JSON.parse(event.newValue||'null'))}catch{settings={...defaults}}apply();sync();scheduleText()})
  function save(){try{localStorage.setItem(key,JSON.stringify(settings))}catch{}apply();sync();scheduleText()}
  const copy={
    en:{title:'Accessibility',intro:'Make Padamya Dhamma more comfortable for you.',size:'Text size',normal:'Default',large:'Larger · 115%',larger:'Largest · 130%',contrast:'Higher contrast',contrastHelp:'Stronger text, borders and controls.',links:'Underline links',linksHelp:'Make links easier to recognise.',motion:'Reduce motion',motionHelp:'Pause decorative motion and show replies immediately.',system:'Your device already requests reduced motion.',reset:'Reset preferences',close:'Close accessibility settings',skip:'Skip to main content',saved:'Accessibility preferences updated.',resetDone:'Accessibility preferences reset.'},
    my:{title:'အသုံးပြုရလွယ်ကူရေး',intro:'သင့်အတွက် ပိုမိုအဆင်ပြေစေရန် ချိန်ညှိပါ။',size:'စာလုံးအရွယ်အစား',normal:'မူလအရွယ်',large:'ပိုကြီး · 115%',larger:'အကြီးဆုံး · 130%',contrast:'အရောင်ကွဲပြားမှု မြှင့်ရန်',contrastHelp:'စာသားနှင့် ခလုတ်များကို ပိုမိုထင်ရှားစေသည်။',links:'လင့်ခ်များကို မျဉ်းသားရန်',linksHelp:'လင့်ခ်များကို အလွယ်တကူ သိရှိနိုင်သည်။',motion:'လှုပ်ရှားမှု လျှော့ရန်',motionHelp:'အလှဆင်လှုပ်ရှားမှုများကို ရပ်ထားမည်။',system:'သင့်စက်တွင် လှုပ်ရှားမှု လျှော့ရန် သတ်မှတ်ထားသည်။',reset:'မူလအတိုင်း ပြန်ထားရန်',close:'ပိတ်ရန်',skip:'အဓိကအကြောင်းအရာသို့ ကျော်ရန်',saved:'အသုံးပြုမှု ဆက်တင်များ ပြောင်းလဲပြီးပါပြီ။',resetDone:'မူလဆက်တင်များသို့ ပြန်ထားပြီးပါပြီ။'}
  }
  const words=()=>copy[root.lang==='my'?'my':'en']
  function sync(){
    if(!dialog)return
    const t=words()
    document.querySelectorAll('[data-a11y-copy]').forEach(el=>{const value=t[el.dataset.a11yCopy];if(value)el.textContent=value})
    dialog.querySelector('[data-a11y-close]').setAttribute('aria-label',t.close)
    const slider=dialog.querySelector('#a11yTextSize'),percent=textPercent()
    slider.value=percent;slider.setAttribute('aria-valuetext',percent+'%')
    slider.style.setProperty('--a11y-range-fill',((percent-100)/30*100)+'%')
    dialog.querySelector('#a11yTextValue').textContent=percent+'%'
    for(const field of ['contrast','links','motion'])dialog.querySelector('[name="'+field+'"]').checked=settings[field]
    dialog.querySelector('#a11ySystemMotion').hidden=!system.matches
  }
  function openPanel(){
    if(!dialog||dialog.open)return
    returnTo=document.activeElement
    window.dispatchEvent(new CustomEvent('sacredform:closeaccountdrawer'))
    sync();dialog.showModal();scheduleText();dialog.querySelector('[data-a11y-close]').focus()
  }
  function finishClose(){
    clearTimeout(closeTimer);closing=false;dialog.classList.remove('is-closing');dialog.close()
    const usable=el=>el?.isConnected&&!el.closest('[inert]')&&el.getClientRects().length
    const target=usable(returnTo)?returnTo:[...document.querySelectorAll('#menuToggle,#accountToggle,.accessibility-open')].find(usable)
    target?.focus({preventScroll:true})
  }
  function closePanel(){
    if(!dialog.open||closing)return
    if(reduced()){finishClose();return}
    closing=true;dialog.classList.add('is-closing');closeTimer=setTimeout(finishClose,210)
  }
  // Fixed-pixel typography is measured unscaled, then enlarged without zooming
  // photos, 3D models, gesture coordinates or the browser viewport.
  function scaleText(){
    frame=null
    if(textPercent()===100)return
    root.dataset.a11yText='default'
    const selector='h1,h2,h3,h4,h5,h6,p,a,button,label,legend,li,dt,dd,small,summary,input,select,textarea,th,td,span,strong,em,output'
    const nodes=[...document.body.querySelectorAll(selector)].filter(el=>!el.closest('svg,[aria-hidden="true"],.scramble-visual,[data-a11y-fixed]')&&!el.matches('.site-icon,.sage-word')&&el.getClientRects().length&&(el.matches('input,select,textarea')||[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())))
    const sizes=nodes.map(el=>parseFloat(getComputedStyle(el).fontSize))
    nodes.forEach((el,index)=>{if(Number.isFinite(sizes[index])){el.style.setProperty('--sf-base-font',sizes[index]+'px');el.setAttribute('data-sf-text','')}})
    root.dataset.a11yText=String(settings.text)
  }
  function scheduleText(){if(textPercent()!==100&&!frame)frame=requestAnimationFrame(scaleText)}
  function init(){
    const main=document.querySelector('main')
    if(main){
      if(!main.id)main.id='main-content'
      if(!main.hasAttribute('tabindex'))main.tabIndex=-1
      const skip=document.createElement('a');skip.className='skip-link';skip.href='#'+main.id;skip.dataset.a11yCopy='skip';skip.dataset.noTranslate='';skip.dataset.noPageTransition='';skip.textContent=words().skip
      skip.addEventListener('click',event=>{event.preventDefault();main.focus({preventScroll:true});main.scrollIntoView({behavior:'instant',block:'start'})})
      document.body.prepend(skip)
    }
    document.querySelectorAll('.main-nav').forEach(nav=>nav.setAttribute('aria-label','Main navigation'))
    document.querySelectorAll('.main-nav a[href]').forEach(a=>{if(new URL(a.href).pathname===location.pathname)a.setAttribute('aria-current','page')})
    const toast=document.querySelector('#toastRoot');if(toast){toast.setAttribute('role','status');toast.setAttribute('aria-atomic','true')}
    dialog=document.createElement('dialog');dialog.id='accessibilityPanel';dialog.className='accessibility-panel';dialog.dataset.noTranslate='';dialog.setAttribute('aria-labelledby','accessibilityTitle')
    dialog.innerHTML=`<header><h2 id="accessibilityTitle" data-a11y-copy="title"></h2><button type="button" class="a11y-close" data-a11y-close><span aria-hidden="true">×</span></button></header><p data-a11y-copy="intro"></p><div class="a11y-size"><div class="a11y-size-heading"><label for="a11yTextSize" data-a11y-copy="size"></label><output id="a11yTextValue" for="a11yTextSize">100%</output></div><input type="range" id="a11yTextSize" min="100" max="130" step="1" value="100"><div class="a11y-range-labels" aria-hidden="true"><span>100%</span><span>130%</span></div></div>${['contrast','links','motion'].map(field=>`<label class="a11y-option"><span><strong data-a11y-copy="${field}"></strong><small id="a11y-${field}-help" data-a11y-copy="${field}Help"></small></span><input type="checkbox" name="${field}" aria-describedby="a11y-${field}-help"></label>`).join('')}<p id="a11ySystemMotion" data-a11y-copy="system" hidden></p><button type="button" class="a11y-reset" data-a11y-copy="reset"></button><p id="a11yFeedback" role="status" aria-live="polite"></p>`
    dialog.setAttribute('data-xr-ui','')
    ;(document.querySelector('#roomOverlay')||document.body).append(dialog)
    dialog.querySelector('[data-a11y-close]').onclick=closePanel
    dialog.addEventListener('animationend',event=>{if(closing&&event.target===dialog&&event.animationName==='a11y-exit')finishClose()})
    dialog.addEventListener('cancel',event=>{event.preventDefault();closePanel()})
    dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closePanel()}})
    dialog.querySelector('#a11yTextSize').oninput=event=>{settings.text=Number(event.target.value);save()}
    dialog.querySelector('#a11yTextSize').onchange=()=>{dialog.querySelector('#a11yFeedback').textContent=words().saved}
    dialog.querySelectorAll('input[type="checkbox"]').forEach(input=>input.onchange=()=>{settings[input.name]=input.checked;save();dialog.querySelector('#a11yFeedback').textContent=words().saved})
    dialog.querySelector('.a11y-reset').onclick=()=>{settings={...defaults};save();dialog.querySelector('#a11yFeedback').textContent=words().resetDone}
    // Explicit loop supplements native modal focus containment in older engines.
    dialog.addEventListener('keydown',event=>{if(event.key!=='Tab')return;const nodes=[...dialog.querySelectorAll('button,input,select')].filter(el=>!el.disabled),first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}})
    function addEntry(parent){if(!parent||parent.querySelector('.accessibility-open'))return;const button=document.createElement('button');button.type='button';button.className='accessibility-open';button.dataset.noTranslate='';button.dataset.noScramble='';button.dataset.a11yCopy='title';button.textContent=words().title;button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls',dialog.id);button.onclick=openPanel;parent.append(button)}
    addEntry(document.querySelector('.account-drawer-preferences'))
    addEntry(document.querySelector('.room-panel-bottom'))
    const observer=new MutationObserver(records=>{
      if(!document.querySelector('.account-drawer-preferences .accessibility-open'))addEntry(document.querySelector('.account-drawer-preferences'))
      if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&!n.matches('.sage-word,.scramble-visual,.scramble-original'))))scheduleText()
    });observer.observe(document.body,{childList:true,subtree:true})
    window.addEventListener('sacredform:languagechange',()=>{sync();scheduleText()})
    window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(scheduleText,150)})
    window.addEventListener('pagehide',()=>{clearTimeout(closeTimer);closing=false;dialog.classList.remove('is-closing');if(dialog.open)dialog.close();cancelAnimationFrame(frame);frame=null;clearTimeout(resizeTimer)})
    window.addEventListener('pageshow',scheduleText)
    sync();scheduleText()
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init()
})()
