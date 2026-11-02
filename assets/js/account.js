;(async()=>{
  const store=window.SacredStore,root=document.getElementById('accountRoot')
  await store?.ready
  if(!store?.enabled){root.innerHTML='<h1>Your <em>account.</em></h1><p>Start the Node backend to use accounts: <code>node --run start</code>.</p><a class="button button-dark" href="shop.html">Explore the collection</a>';return}
  const destination=new URLSearchParams(location.search).get('return')
  const allowed=new Set(['admin.html','checkout.html','track-order.html','wishlist.html'])
  if(store.profile.role!=='guest'){
    root.innerHTML='<p class="eyebrow">YOUR PADAMYA DHAMMA ACCOUNT</p><h1>Welcome <em>back.</em></h1><p id="accountIdentity"></p><div class="account-actions"><a class="button button-dark" id="accountContinue">Continue</a><a class="text-link" href="track-order.html">My orders</a><button class="button button-outline" id="accountLogout" type="button">Sign out</button></div><p id="accountError" role="alert"></p>'
    document.getElementById('accountIdentity').textContent=store.profile.name||store.profile.email
    document.getElementById('accountContinue').href=allowed.has(destination)?destination:store.profile.role==='admin'?'admin.html':'shop.html'
    document.getElementById('accountLogout').onclick=async()=>{try{await store.logout()}catch(error){document.getElementById('accountError').textContent=error.message}}
    return
  }
  let mode='login'
  root.innerHTML='<p class="eyebrow">A PLACE FOR YOUR PIECES</p><h1>Your <em>account.</em></h1><div class="account-tabs"><button type="button" data-account-mode="login" aria-pressed="true">Sign in</button><button type="button" data-account-mode="register" aria-pressed="false">Create account</button></div><form id="accountForm"><label id="accountNameLabel" hidden>Full name<input name="name" autocomplete="name" maxlength="120"></label><label>Email address<input name="email" type="email" autocomplete="username" required maxlength="254"></label><label>Password<span class="password-field"><input id="accountPassword" aria-label="Password" name="password" type="password" autocomplete="current-password" minlength="12" maxlength="128" required><button class="password-visibility" type="button" aria-label="Show password" aria-pressed="false" aria-controls="accountPassword" data-no-scramble><span class="password-eye eye-show" aria-hidden="true"></span><span class="password-eye eye-hide" aria-hidden="true"></span></button></span></label><p class="account-helper">Use at least 12 characters. Your bag and orders are connected to this account.</p><button class="button button-dark" type="submit">Sign in</button><p id="accountError" role="alert"></p></form>'
  const form=document.getElementById('accountForm'),submit=form.querySelector('[type=submit]')
  const visibility=form.querySelector('.password-visibility')
  visibility.onclick=()=>{const shown=form.elements.password.type==='password';form.elements.password.type=shown?'text':'password';visibility.setAttribute('aria-pressed',String(shown));visibility.setAttribute('aria-label',shown?'Hide password':'Show password')}
  document.querySelectorAll('[data-account-mode]').forEach(button=>button.onclick=()=>{
    mode=button.dataset.accountMode;document.querySelectorAll('[data-account-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)))
    document.getElementById('accountNameLabel').hidden=mode!=='register';form.elements.password.autocomplete=mode==='register'?'new-password':'current-password';submit.textContent=mode==='register'?'Create account':'Sign in'
  })
  if(new URLSearchParams(location.search).get('mode')==='register')document.querySelector('[data-account-mode=register]').click()
  form.onsubmit=async event=>{
    event.preventDefault();if(submit.disabled)return;submit.disabled=true;document.getElementById('accountError').textContent=''
    try{await store.authenticate(mode,Object.fromEntries(new FormData(form)))}catch(error){document.getElementById('accountError').textContent=error.message;submit.disabled=false}
  }
})()
