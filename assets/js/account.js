;(async()=>{
  const store=window.SacredStore,root=document.getElementById('accountRoot')
  await store?.ready
  if(!store?.enabled){root.innerHTML='<h1>Your <em>account.</em></h1><p>Start the Node backend to use accounts: <code>node --run start</code>.</p><a class="button button-dark" href="shop.html">Explore the collection</a>';return}
  const destination=new URLSearchParams(location.search).get('return')
  const allowed=new Set(['admin.html','admin-catalogue.html','checkout.html','track-order.html','wishlist.html'])
  if(store.profile.role!=='guest'){
    root.classList.add('account-with-delivery')
    root.innerHTML='<p class="eyebrow">YOUR PADAMYA DHAMMA ACCOUNT</p><h1>Welcome <em>back.</em></h1><div class="account-identity"><p id="accountIdentity" data-no-translate></p><p id="accountEmail" data-no-translate></p></div><div class="account-actions"><a class="button button-dark" id="accountContinue">Continue</a><button class="button button-outline" id="accountLogout" type="button">Sign out</button></div><p id="accountError" role="alert"></p>'
    document.getElementById('accountIdentity').textContent=store.profile.name||'Your account'
    document.getElementById('accountEmail').textContent=store.profile.email
    document.getElementById('accountContinue').href=allowed.has(destination)?destination:store.profile.role==='admin'?'admin.html':'shop.html'
    document.getElementById('accountLogout').onclick=async()=>{if(!await accountConfirm('Sign out of your account?','Your saved addresses and orders will be here when you sign in again.','Sign out'))return;try{await store.logout()}catch(error){document.getElementById('accountError').textContent=error.message}}
    initAccountDelivery(root,store)
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

function accountConfirm(title,description,action){
  return new Promise(resolve=>{
    const dialog=document.createElement('dialog');dialog.className='account-dialog account-confirm'
    dialog.innerHTML='<h2 id="accountConfirmTitle"></h2><p></p><div class="account-dialog-actions"><button type="button" class="button button-outline" data-cancel>Cancel</button><button type="button" class="button button-dark account-danger" data-confirm></button></div>'
    dialog.querySelector('h2').textContent=title;dialog.querySelector('p').textContent=description;dialog.querySelector('[data-confirm]').textContent=action
    dialog.setAttribute('aria-labelledby','accountConfirmTitle')
    const finish=value=>{dialog.close();dialog.remove();resolve(value)}
    dialog.querySelector('[data-cancel]').onclick=()=>finish(false);dialog.querySelector('[data-confirm]').onclick=()=>finish(true)
    dialog.addEventListener('cancel',event=>{event.preventDefault();finish(false)})
    dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)finish(false)}})
    document.body.append(dialog);dialog.showModal();dialog.querySelector('[data-cancel]').focus()
  })
}
function addressIcon(label){
  const name=String(label).trim().toLowerCase()
  if(/\bhome\b|အိမ်/.test(name))return 'home'
  if(/\bwork\b|\boffice\b|အလုပ်|ရုံး/.test(name))return 'work'
  return 'other'
}
async function initAccountDelivery(root,store){
  const section=document.createElement('section');section.className='account-delivery'
  section.innerHTML='<div class="address-heading"><div><h2>Delivery details</h2><p>Choose a default address for your future orders.</p></div><button class="button button-outline" type="button" data-add-address disabled><span class="site-icon icon-add" aria-hidden="true"></span>Add address</button></div><div class="address-list"></div><p class="address-status" role="status" aria-live="polite">Loading delivery details…</p>'
  root.insertBefore(section,root.querySelector('.account-actions'))
  const list=section.querySelector('.address-list'),status=section.querySelector('[role=status]'),add=section.querySelector('[data-add-address]')
  let book={addresses:[],defaultId:null},busy=false
  function render(){
    list.replaceChildren()
    if(!book.addresses.length){const empty=document.createElement('p');empty.className='address-empty';empty.textContent='No saved addresses yet. Add your first delivery address.';list.append(empty)}
    for(const entry of book.addresses){
      const card=document.createElement('article');card.className='address-card'+(entry.id===book.defaultId?' is-default':'')
      card.innerHTML='<div class="address-info"><span class="address-place-icon" aria-hidden="true"></span><span class="address-title" data-no-translate></span><span class="address-recipient" data-no-translate></span><span class="address-lines" data-no-translate></span></div><div class="address-tools"><button type="button" class="address-icon-button address-edit-action" aria-label="Edit address" title="Edit address"><span class="address-action-icon address-pencil" aria-hidden="true"></span></button><button type="button" class="address-icon-button address-delete" aria-label="Delete address" title="Delete address"><span class="address-action-icon address-trash" aria-hidden="true"></span></button></div><button type="button" class="address-default"></button>'
      const details=entry.details
      card.querySelector('.address-title').textContent=entry.label
      card.querySelector('.address-recipient').textContent=details.name
      card.querySelector('.address-lines').textContent=[details.address,details.city,details.country].filter(Boolean).join(', ')
      card.querySelector('.address-place-icon').classList.add('address-place-'+addressIcon(entry.label))
      card.querySelector('.address-edit-action').onclick=()=>openEditor(entry)
      const select=card.querySelector('.address-default');select.textContent=entry.id===book.defaultId?'Default address':'Set as default';select.setAttribute('aria-pressed',String(entry.id===book.defaultId));select.disabled=entry.id===book.defaultId
      select.onclick=()=>mutate('account/addresses/'+encodeURIComponent(entry.id)+'/default','PATCH',{})
      card.querySelector('.address-delete').onclick=async()=>{if(await accountConfirm('Delete this address?',entry.label,'Delete address'))await mutate('account/addresses/'+encodeURIComponent(entry.id),'DELETE')}
      list.append(card)
    }
    add.disabled=book.addresses.length>=10
  }
  async function mutate(route,method,data){
    if(busy)return;busy=true;section.setAttribute('aria-busy','true');section.querySelectorAll('button').forEach(button=>button.disabled=true)
    try{book=await store.request(route,method,data);status.textContent='';toast('Address book updated.')}
    catch(error){status.textContent=error.message||'Unable to update your addresses. Please try again.'}
    finally{busy=false;section.removeAttribute('aria-busy');render()}
  }
  function openEditor(entry){
    if(busy)return
    const dialog=document.createElement('dialog');dialog.className='account-dialog address-editor'
    dialog.setAttribute('aria-labelledby','addressEditorTitle')
    dialog.innerHTML=`<h2 id="addressEditorTitle">${entry?'Edit address':'Add address'}</h2><form id="accountDeliveryForm"><label class="delivery-full">Address name<input name="label" placeholder="Home, Work…" maxlength="60" required></label><label>Full name<input name="name" autocomplete="name" maxlength="120" required></label><label>Phone number<input name="phone" autocomplete="tel" maxlength="60" required></label><label class="delivery-full">Email address<input name="email" type="email" autocomplete="email" maxlength="254" required></label><label class="delivery-full">Delivery address<textarea name="address" autocomplete="street-address" maxlength="1000" rows="3" required></textarea></label><label>City / Township<input name="city" autocomplete="address-level2" maxlength="120" required></label><label>Country<select name="country" autocomplete="country-name"><option>Myanmar</option><option>Thailand</option><option>Singapore</option><option>Other</option></select></label><label class="address-default-check delivery-full"><input type="checkbox" name="makeDefault"><span>Use as default for future orders</span></label><p class="delivery-full" role="alert"></p><div class="account-dialog-actions delivery-full"><button type="button" class="button button-outline" data-cancel>Cancel</button><button class="button button-dark" type="submit">Save address</button></div></form>`
    const form=dialog.querySelector('form'),submit=form.querySelector('[type=submit]'),error=form.querySelector('[role=alert]')
    const values=entry?{...entry.details,label:entry.label}:{name:store.profile.name,email:store.profile.email,country:'Myanmar'}
    for(const [key,value]of Object.entries(values)){const field=form.elements.namedItem(key);if(field)field.value=value}
    form.elements.namedItem('makeDefault').checked=!book.defaultId||entry?.id===book.defaultId
    form.elements.namedItem('makeDefault').disabled=!!entry&&entry.id===book.defaultId
    const close=()=>{dialog.close();dialog.remove();add.focus()}
    form.querySelector('[data-cancel]').onclick=()=>{if(!submit.disabled)close()}
    dialog.addEventListener('cancel',event=>{event.preventDefault();if(!submit.disabled)close()})
    form.onsubmit=async event=>{
      event.preventDefault();if(submit.disabled)return;submit.disabled=true;error.textContent=''
      const data=Object.fromEntries(new FormData(form));data.makeDefault=form.elements.namedItem('makeDefault').checked
      try{book=await store.request('account/addresses'+(entry?'/'+encodeURIComponent(entry.id):''),entry?'PUT':'POST',data);render();status.textContent='';close();toast('Address saved.')}
      catch(issue){error.textContent=issue.message||'Unable to save this address. Please try again.';submit.disabled=false}
    }
    document.body.append(dialog);dialog.showModal();form.elements.namedItem('label').focus()
  }
  add.onclick=()=>openEditor(null)
  try{book=await store.request('account/addresses');render();status.textContent=''}
  catch{status.textContent='Unable to load your addresses. Please refresh to try again.'}
}
