/* Shared account drawer. Reuses the original language and theme controls. */
;(() => {
  function init() {
    const header=document.querySelector('.site-header'),actions=header?.querySelector('.header-actions')
    if(!actions||document.getElementById('accountDrawer'))return
    const button=document.createElement('button')
    button.type='button';button.className='account-toggle';button.id='accountToggle'
    button.setAttribute('aria-label','Open account menu');button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','accountDrawer')
    button.setAttribute('data-no-scramble','')
    button.innerHTML='<span class="site-icon icon-login" aria-hidden="true"></span>'
    actions.append(button)
    const mobile=matchMedia('(max-width:1000px)'),menu=header.querySelector('#menuToggle'),mainNav=header.querySelector('#mainNav')
    if(menu){menu.dataset.accountDrawerTrigger='true';menu.setAttribute('aria-controls','accountDrawer');actions.append(menu)}
    const layer=document.createElement('div');layer.className='account-drawer-layer';layer.inert=true
    layer.innerHTML=`<div class="account-drawer-backdrop" data-account-dismiss></div>
      <section class="account-drawer" id="accountDrawer" role="dialog" aria-modal="true" aria-labelledby="accountDrawerTitle" tabindex="-1">
        <header class="account-drawer-heading"><span id="accountDrawerTitle" data-no-translate>Your account</span><button type="button" class="account-drawer-close" aria-label="Close account menu" data-account-dismiss data-no-scramble><span class="site-icon icon-cross" aria-hidden="true"></span></button></header>
        <div class="account-drawer-body">
          <nav class="drawer-mobile-navigation" aria-label="Main navigation"><a href="shop.html">Shop all</a><a href="shrine.html#shrine-preview">Shrine preview</a><a href="about.html">Our story</a></nav>
          <div class="account-drawer-profile" data-no-translate><span class="site-icon icon-account" aria-hidden="true"></span><div><h2 id="drawerAccountName"></h2><p id="drawerAccountEmail"></p></div></div>
          <div class="account-drawer-auth" id="drawerGuestActions"><a href="account.html" class="drawer-primary">Sign in</a><a href="account.html?mode=register" class="drawer-secondary">Create account</a></div>
          <nav class="account-drawer-links" aria-label="Account navigation">
            <a href="account.html" id="drawerAccountDetails" hidden><span class="site-icon icon-account" aria-hidden="true"></span><span id="drawerAccountDetailsLabel" data-no-translate>Account details</span><span class="site-icon icon-arrow" aria-hidden="true"></span></a>
            <a href="track-order.html"><span class="site-icon icon-receipt" aria-hidden="true"></span><span>Order history</span><span class="site-icon icon-arrow" aria-hidden="true"></span></a>
            <a href="admin.html" id="drawerAdminLink" hidden><span class="site-icon icon-package" aria-hidden="true"></span><span>Order desk</span><span class="site-icon icon-arrow" aria-hidden="true"></span></a>
          </nav>
          <div class="account-drawer-preferences"><p class="account-drawer-caption">Preferences</p><div class="account-preference"><span>Language</span><div data-account-language></div></div><div class="account-preference"><span>Appearance</span><div data-account-theme></div></div></div>
          <p id="drawerAccountError" role="alert"></p>
        </div>
        <footer class="account-drawer-footer"><button type="button" id="drawerSignOut" hidden data-no-scramble>Sign out<span class="site-icon icon-login" aria-hidden="true"></span></button><span>PADAMYA DHAMMA</span></footer>
      </section>`
    document.body.append(layer)
    const panel=layer.querySelector('#accountDrawer'),$=id=>layer.querySelector('#'+id)
    let open=false,previousOverflow='',restoreTarget=null
    const inertElements=new Map()
    function movePreferences(){
      for(const [selector,slot] of [['.language-toggle','[data-account-language]'],['.theme-toggle','[data-account-theme]']]){
        const control=header.querySelector(selector),destination=layer.querySelector(slot)
        if(control&&control.parentElement!==destination)destination.append(control)
      }
    }
    const preferencesObserver=new MutationObserver(movePreferences)
    preferencesObserver.observe(header,{childList:true,subtree:true});movePreferences()
    function updateProfile(){
      const store=window.SacredStore,profile=store?.profile,signedIn=!!(store?.enabled&&profile&&profile.role!=='guest'),my=document.documentElement.lang==='my'
      $('drawerAccountName').textContent=signedIn?(profile.name||'Padamya Dhamma customer'):(my?'ကြိုဆိုပါသည်။':'Welcome to Padamya Dhamma.')
      $('drawerAccountEmail').textContent=signedIn?(profile.email||''):(my?'သင့်အကောင့်နှင့် အမှာစာများကို ဤနေရာတွင် စီမံနိုင်ပါသည်။':'Sign in to keep your pieces and orders together.')
      layer.dataset.signedIn=String(signedIn)
      $('accountDrawerTitle').textContent=mobile.matches?(my?'မီနူး':'Menu'):(my?'သင့်အကောင့်':'Your account')
      $('drawerAccountDetailsLabel').textContent=mobile.matches?(my?'အကောင့်':'Account'):(my?'အကောင့်အချက်အလက်':'Account details')
      $('drawerGuestActions').hidden=signedIn;$('drawerAccountDetails').hidden=!signedIn&&!mobile.matches;$('drawerSignOut').hidden=!signedIn
      $('drawerAdminLink').hidden=!(signedIn&&profile.role==='admin')
      button.dataset.signedIn=String(signedIn)
    }
    function setOpen(next,restore=true){
      if(next===open)return
      open=next
      if(open){
        window.dispatchEvent(new CustomEvent('sacredform:closemenu'))
        updateProfile();movePreferences();restoreTarget=document.activeElement
        previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden'
        for(const el of document.body.children){
          if(el===layer||['SCRIPT','STYLE','LINK'].includes(el.tagName))continue
          inertElements.set(el,el.inert);el.inert=true
        }
        layer.inert=false;layer.classList.add('is-open');button.setAttribute('aria-expanded','true');menu?.setAttribute('aria-expanded','true')
        layer.querySelector('.account-drawer-close').focus({preventScroll:true})
      }else{
        layer.inert=true;layer.classList.remove('is-open');button.setAttribute('aria-expanded','false');menu?.setAttribute('aria-expanded','false')
        document.body.style.overflow=previousOverflow
        for(const [el,inert] of inertElements)el.inert=inert
        inertElements.clear()
        if(restore&&restoreTarget?.isConnected)restoreTarget.focus({preventScroll:true})
      }
    }
    button.onclick=()=>setOpen(!open)
    window.addEventListener('sacredform:closeaccountdrawer',()=>setOpen(false,false))
    if(menu)menu.onclick=()=>setOpen(!open)
    function applyBreakpoint(){
      setOpen(false)
      if(mainNav){mainNav.inert=mobile.matches;mainNav.classList.remove('open');if(mobile.matches)mainNav.setAttribute('aria-hidden','true');else mainNav.removeAttribute('aria-hidden')}
      updateProfile()
    }
    mobile.addEventListener('change',applyBreakpoint);applyBreakpoint()
    layer.addEventListener('click',event=>{
      if(event.target.closest('[data-account-dismiss]'))setOpen(false)
      else if(event.target.closest('a[href]'))setOpen(false,false)
    })
    document.addEventListener('keydown',event=>{
      if(!open)return
      if(event.key==='Escape'){event.preventDefault();setOpen(false);return}
      if(event.key!=='Tab')return
      const focusable=[...panel.querySelectorAll('a[href],button:not(:disabled),input,select,[tabindex="0"]')].filter(el=>!el.closest('[hidden]')&&el.getClientRects().length)
      const first=focusable[0],last=focusable.at(-1)
      if(event.shiftKey&&(document.activeElement===first||document.activeElement===panel)){event.preventDefault();last?.focus()}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
    })
    $('drawerSignOut').onclick=async()=>{
      const signOut=$('drawerSignOut');signOut.disabled=true;$('drawerAccountError').textContent=''
      try{await window.SacredStore.logout()}catch(error){$('drawerAccountError').textContent=error.message;signOut.disabled=false}
    }
    window.addEventListener('sacredform:languagechange',updateProfile)
    window.addEventListener('pageshow',event=>{if(event.persisted){setOpen(false);updateProfile();movePreferences()}})
    window.addEventListener('pagehide',()=>setOpen(false,false))
    Promise.resolve(window.SacredStore?.ready).then(updateProfile);updateProfile()
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init()
})()
