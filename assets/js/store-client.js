/* Same-origin backend bridge. Static previews retain their existing local demo. */
;(() => {
  const CART='sacredFormCart_v1',WISH='sacredFormWishlist_v1'
  const state={enabled:false,unavailable:false,profile:null,products:[],csrf:'',orders:[],queue:Promise.resolve(),sageMode:'demo'}
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch{return fallback}}
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
  const notice=message=>window.dispatchEvent(new CustomEvent('sacredform:notice',{detail:message}))
  async function request(route,method='GET',data) {
    const response=await fetch('/api/'+route,{method,credentials:'same-origin',headers:{...(data===undefined?{}:{'Content-Type':'application/json'}),'X-CSRF-Token':state.csrf},body:data===undefined?undefined:JSON.stringify(data),signal:AbortSignal.timeout(45000)})
    const payload=await response.json()
    if(!response.ok)throw Object.assign(new Error(payload.error||'The server could not complete this request.'),{status:response.status})
    if(payload.csrf)state.csrf=payload.csrf
    return payload
  }
  function applyBag(data) {
    if(data.cart)write(CART,data.cart)
    if(data.wishlist)write(WISH,data.wishlist)
    window.updateCartCount?.();window.renderCartPage?.();window.syncWishlist?.()
    window.dispatchEvent(new CustomEvent('sacredform:storechange'))
  }
  function applyProducts(products) {
    state.products=products
    if(window.SacredForm?.products)window.SacredForm.products.splice(0,window.SacredForm.products.length,...products)
  }
  async function refreshOrders() {
    if(!state.enabled||!window.SacredOrders)return
    state.orders=(await request('orders')).orders
    window.dispatchEvent(new CustomEvent('sacredform:orderschanged'))
  }
  function attachOrders() {
    const original=window.SacredOrders;if(!original||!state.enabled)return
    const matches=(order,filter)=>filter==='all'||(filter==='processing'?original.stages.findIndex(stage=>stage.id===order.status)<3:order.status===(filter==='shipped'?'out-for-delivery':filter))
    const put=order=>{state.orders=[order,...state.orders.filter(old=>old.ref!==order.ref)].sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));window.dispatchEvent(new CustomEvent('sacredform:orderschanged'));return order}
    window.SacredOrders=Object.freeze({...original,server:true,
      localHistory:(filter='all')=>state.orders.filter(order=>matches(order,filter)),
      lookupLocal:ref=>state.orders.find(order=>order.ref.toUpperCase()===String(ref).toUpperCase())||null,
      lookup:(ref,email)=>state.orders.find(order=>order.ref===ref&&order.customer.email.toLowerCase()===String(email).toLowerCase())||null,
      history:(email,filter='all')=>state.orders.filter(order=>order.customer.email===email&&matches(order,filter)),
      latest:()=>state.orders[0]||null,
      async create(customer,cart,products,preferences={}){
        await state.queue
        const saveDelivery=preferences.saveDelivery===true;const signature=JSON.stringify({customer,cart,saveDelivery});let pending
        try{pending=JSON.parse(sessionStorage.getItem('sfPendingCheckout')||'null')}catch{}
        if(!pending||pending.signature!==signature){pending={signature,key:crypto.randomUUID()};sessionStorage.setItem('sfPendingCheckout',JSON.stringify(pending))}
        const {order}=await request('orders','POST',{customer,cart,...(saveDelivery?{saveDelivery:true}:{}),idempotencyKey:pending.key})
        put(order);return order
      },
      async setDemoStage(ref,status,enabled,expectedStatus){const {order}=await request(`admin/orders/${encodeURIComponent(ref)}/stage`,'PATCH',{status,expectedStatus});return put(order)},
      async advance(ref,email,enabled){const order=state.orders.find(order=>order.ref===ref),index=original.stages.findIndex(stage=>stage.id===order?.status);if(!order||index>=4)return order;return this.setDemoStage(ref,original.stages[index+1].id,true,order.status)},
      async seedDemo(){state.orders=(await request('admin/orders/seed','POST',{})).orders;window.dispatchEvent(new CustomEvent('sacredform:orderschanged'));return state.orders}
    })
  }
  function queueBag(kind,value) {
    if(!state.enabled)return
    const snapshot=JSON.parse(JSON.stringify(value))
    state.queue=state.queue.catch(()=>{}).then(async()=>{
      try{await request(kind,'PUT',snapshot)}
      catch(error){notice(error.message);try{const current=await request(kind);applyBag(current)}catch{notice('Changes could not reach the server. Please check your connection before checkout.')}}
    })
  }
  state.request=request;state.refreshOrders=refreshOrders;state.syncCart=cart=>queueBag('cart',cart);state.syncWishlist=ids=>queueBag('wishlist',ids)
  state.flush=()=>state.queue
  state.refreshCatalogue=async()=>applyProducts((await request('catalogue')).products)
  state.authenticate=async(mode,data)=>{await request('auth/'+mode,'POST',data);const dest=new URLSearchParams(location.search).get('return');location.href=dest==='checkout.html'?'checkout.html':'account.html'+location.search}
  state.logout=async()=>{await request('auth/logout','POST',{});write(CART,[]);write(WISH,[]);location.href='account.html'}
  state.ready=(async()=>{
    try{
      const response=await fetch('/api/bootstrap',{credentials:'same-origin',signal:AbortSignal.timeout(4000)})
      if(response.status===404||!response.headers.get('content-type')?.includes('application/json'))return state
      if(!response.ok)throw Error('The store server is temporarily unavailable.')
      const data=await response.json();state.enabled=true;state.profile=data.profile;state.csrf=data.csrf;state.sageMode=data.sageMode
      try{sessionStorage.setItem('sfBackendOrigin',location.origin)}catch{}
      const imported='sfImportedBag:'+data.profile.id
      if(!read(imported,false)) {
        const cart=read(CART,[]),wishlist=read(WISH,[])
        let importedOK=true
        if(cart.length||wishlist.length){try{Object.assign(data,await request('bag/import','POST',{cart,wishlist}))}catch(error){importedOK=false;data.cart=cart;data.wishlist=wishlist;notice('Your saved bag is kept on this device. '+error.message)}}
        if(importedOK)write(imported,true)
      }
      if(document.readyState==='loading')await new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true}))
      applyProducts(data.products);applyBag(data);attachOrders()
      if(window.SacredOrders)await refreshOrders()
      return state
    }catch(error){
      try{state.unavailable=sessionStorage.getItem('sfBackendOrigin')===location.origin}catch{}
      state.enabled=false;notice('The server connection is unavailable. Please retry before placing an order.');return state
    }
  })()
  window.SacredStore=state
  document.addEventListener('DOMContentLoaded',()=>{
    window.addEventListener('sacredform:notice',event=>{
      let note=document.getElementById('storeConnectionNote')
      if(!note){note=document.createElement('p');note.id='storeConnectionNote';note.setAttribute('role','status');Object.assign(note.style,{position:'fixed',bottom:'12px',left:'12px',maxWidth:'min(420px,90vw)',padding:'12px 16px',background:'var(--paper)',color:'var(--ink)',border:'1px solid var(--accent)',borderRadius:'8px',fontSize:'12px',zIndex:'10000'});document.body.append(note)}
      note.textContent=event.detail;setTimeout(()=>note.remove(),6500)
    })
    let poll;const startPoll=()=>{clearInterval(poll);poll=setInterval(async()=>{if(!state.enabled||document.hidden||!window.SacredOrders)return;try{const orders=(await request('orders')).orders;if(JSON.stringify(orders)!==JSON.stringify(state.orders)){state.orders=orders;window.dispatchEvent(new CustomEvent('sacredform:orderschanged'))}}catch{}},4000)}
    startPoll();window.addEventListener('pagehide',()=>clearInterval(poll))
    window.addEventListener('pageshow',event=>{if(event.persisted){startPoll();refreshOrders().catch(()=>{})}})
  })
})()
