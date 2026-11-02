/* Floating shopping companion. All rich output is built with text nodes. */
;(async()=>{
  if(document.getElementById('sageRoot'))return
  if(document.readyState==='loading')await new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true}))
  if(document.body.matches('.account-page,[data-no-assistant]'))return
  const store=window.SacredStore;await store?.ready
  const api=window.SacredForm,core=window.SageCore;if(!api||!core)return
  const root=document.createElement('div');root.id='sageRoot';root.setAttribute('data-no-translate','')
  root.innerHTML='<button type="button" class="sage-launcher" id="sageLauncher" aria-label="Open Sage shopping assistant" aria-expanded="false" aria-controls="sagePanel"><span class="site-icon sage-chat-icon" aria-hidden="true"></span><span class="sage-new-dot" id="sageNewDot" aria-hidden="true"></span></button><section id="sagePanel" class="sage-panel" role="dialog" aria-labelledby="sageTitle" inert><header class="sage-header"><span class="sage-avatar" aria-hidden="true"><span class="site-icon sage-avatar-icon"></span></span><div class="sage-identity"><h2 id="sageTitle">Sage</h2><p class="sage-status" id="sageStatus">Ready to help</p></div><div class="sage-header-actions"><button class="sage-icon-button" id="sageClear" type="button" aria-label="Clear conversation" title="New conversation"><span class="site-icon sage-clear-icon" aria-hidden="true"></span></button><button class="sage-icon-button" id="sageMinimize" type="button" aria-label="Minimize Sage" title="Minimize">−</button><button class="sage-icon-button" id="sageClose" type="button" aria-label="Close Sage" title="Close"><span class="site-icon sage-close-icon" aria-hidden="true"></span></button></div></header><div class="sage-body" id="sageBody" role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversation with Sage"></div><div class="sage-typing" id="sageTyping" role="status" hidden><span>Sage is thinking</span><i></i><i></i><i></i></div><form class="sage-form" id="sageForm"><label class="sr-only" for="sageInput">Message Sage</label><textarea id="sageInput" rows="1" maxlength="2000" placeholder="Ask about a piece…" required></textarea><button type="submit" class="sage-send" id="sageSend" aria-label="Send message"><span class="site-icon" aria-hidden="true"></span></button></form><p class="sage-source" id="sageSource">Guided mode · catalogue rules · history stays in this tab</p></section>'
  document.body.append(root)
  const $=id=>document.getElementById(id),historyKey='sfSageChat_v1:'+(store?.profile?.id||'static')
  let messages=[],open=false,pending=false,disposed=false,replyPause=null
  try{const saved=JSON.parse(sessionStorage.getItem(historyKey)||'[]');if(Array.isArray(saved))messages=saved.filter(m=>m&&['user','assistant'].includes(m.role)&&typeof m.content==='string').slice(-30)}catch{}
  const money=value=>api.money(value)
  const language=()=>document.documentElement.lang==='my'?'my':'en'
  function save(){try{sessionStorage.setItem(historyKey,JSON.stringify(messages.slice(-30)))}catch{}}
  function node(tag,text,className,parent){const el=document.createElement(tag);if(text!=null)el.textContent=text;if(className)el.className=className;parent?.append(el);return el}
  function scroll(){const body=$('sageBody');body.scrollTop=body.scrollHeight}
  function mode(value='guided'){
    $('sageStatus').textContent=value==='ai'?'AI shopping assistant':value==='guided-fallback'?'Guided help · AI unavailable':'Ready · guided shopping'
    $('sageSource').textContent=value==='ai'?'AI response · product cards verified by the store':'Guided mode · catalogue rules · history stays in this tab'
  }
  function setOpen(value){
    open=value;root.classList.toggle('sage-is-open',open);$('sagePanel').inert=!open;$('sageLauncher').setAttribute('aria-expanded',String(open))
    if(open){$('sageNewDot').hidden=true;try{localStorage.setItem('sfSageSeen','1')}catch{};$('sageInput').focus({preventScroll:true});scroll()}
    else $('sageLauncher').focus({preventScroll:true})
  }
  try{$('sageNewDot').hidden=localStorage.getItem('sfSageSeen')==='1'}catch{}
  function trustedProduct(item){
    const known=api.products.find(p=>p.id===item.id);if(!known)return null
    return {...core.product(known),reason:typeof item.reason==='string'?item.reason.slice(0,240):''}
  }
  function card(item,parent){
    const p=trustedProduct(item);if(!p)return
    const article=node('article',null,'sage-product',parent),image=node('img',null,null,article);image.src=p.image;image.alt=p.name;image.loading='lazy';image.decoding='async'
    const info=node('div',null,null,article);node('h3',p.name,null,info);node('span',money(p.price),'sage-product-price',info)
    node('div',`${p.height} · ${p.stock===null?'Stock not recorded':p.stock+' in stock'}`,'sage-product-meta',article)
    if(p.reason)node('p',p.reason,'sage-product-reason',article)
    const actions=node('div',null,'sage-product-actions',article),view=node('a','View piece',null,actions);view.href='product.html?id='+encodeURIComponent(p.id)
    const add=node('button','Add to bag ＋',null,actions);add.type='button';add.disabled=p.stock===0||!p.active
    add.onclick=async()=>{
      if(add.disabled)return;add.disabled=true
      const before=api.getCart().find(line=>line.id===p.id)?.qty||0
      if(before>=99){add.textContent='Quantity limit';return}
      api.addToCart(p.id,1);await store?.flush()
      const after=api.getCart().find(line=>line.id===p.id)?.qty||0
      add.textContent=after>before?'Added ✓':'Check your bag'
      setTimeout(()=>{add.textContent='Add to bag ＋';add.disabled=p.stock===0||!p.active},1600)
    }
  }
  function renderResponse(response,parent){
    if(response.warning)node('small',response.warning,'sage-warning',parent)
    if(response.comparison?.length){
      const wrap=node('div',null,'sage-comparison',parent),table=node('table',null,null,wrap),head=node('tr',null,null,node('thead',null,null,table))
      node('th','Compare',null,head)
      const products=response.comparison.map(trustedProduct).filter(Boolean)
      for(const p of products){const th=node('th',p.name,null,head);th.scope='col'}
      const body=node('tbody',null,null,table)
      for(const [label,get] of [['Price',p=>money(p.price)],['Height',p=>p.height],['Material',p=>p.material],['Collection',p=>p.category]]){
        const row=node('tr',null,null,body);const th=node('th',label,null,row);th.scope='row';for(const p of products)node('td',get(p),null,row)
      }
    }
    if(response.products?.length){const list=node('div',null,'sage-products',parent);for(const item of response.products.slice(0,3))card(item,list)}
    if(response.cart){
      const summary=node('div',null,'sage-cart',parent);node('small','Bag snapshot',null,summary)
      const cart=core.cartSummary(api.products,response.cart.items.map(p=>({id:p.id,qty:p.qty})))
      for(const item of cart.items){const row=node('div',null,'sage-cart-row',summary);node('span',`${item.name} × ${item.qty}`,null,row);node('span',money(item.price*item.qty),null,row)}
      const total=node('div',null,'sage-cart-row sage-cart-total',summary);node('span','Subtotal',null,total);node('span',money(cart.total),null,total)
    }
    if(response.actions?.length){
      const links=node('div',null,'sage-links',parent)
      for(const action of response.actions){if(!Object.hasOwn(core.pages,action.page))continue;const link=node('a',String(action.label||'Explore'),'sage-link',links);link.href=core.pages[action.page]}
    }
  }
  function bubble(role,text,response,animate=false){const article=node('div',null,'sage-message sage-message-'+role+(animate?' sage-message-new':''),$('sageBody'));node('p',text,null,article);if(response)renderResponse(response,article);return article}
  function finishReplyPause(){
    if(!replyPause)return
    clearTimeout(replyPause.timer);replyPause.resolve();replyPause=null
  }
  async function waitForReply(started){
    if((window.SacredAccessibility?.reduceMotion() ?? matchMedia('(prefers-reduced-motion: reduce)').matches)||disposed)return
    const remaining=650-(performance.now()-started)
    if(remaining<=0)return
    await new Promise(resolve=>{replyPause={resolve,timer:setTimeout(()=>{replyPause=null;resolve()},remaining)}})
  }
  function revealPause(ms){
    if(disposed)return Promise.resolve()
    return new Promise(resolve=>{replyPause={resolve,timer:setTimeout(()=>{replyPause=null;resolve()},ms)}})
  }
  async function revealReply(text,response){
    if(disposed)return
    if((window.SacredAccessibility?.reduceMotion() ?? matchMedia('(prefers-reduced-motion: reduce)').matches))return bubble('assistant',text,response)
    const body=$('sageBody'),article=node('div',null,'sage-message sage-message-assistant sage-message-new',body)
    // Keep partial words out of the live log; announce the finished reply once.
    article.setAttribute('aria-busy','true');body.setAttribute('aria-busy','true')
    const paragraph=node('p',null,null,article)
    const segments=typeof Intl.Segmenter==='function'
      ?Array.from(new Intl.Segmenter(language(),{granularity:'word'}).segment(text),item=>item.segment)
      :text.match(/\S+\s*|\s+/gu)||[text]
    const interval=Math.max(12,Math.min(38,5000/Math.max(1,segments.length)))
    function follow(change){const nearEnd=body.scrollHeight-body.scrollTop-body.clientHeight<65;change();if(nearEnd)scroll()}
    $('sageTyping').hidden=true
    for(const segment of segments){
      if(disposed)return
      if(window.SacredAccessibility?.reduceMotion())break
      follow(()=>node('span',segment,'sage-word',paragraph))
      await revealPause(/\s/u.test(segment)?8:interval)
    }
    if(!window.SacredAccessibility?.reduceMotion())await revealPause(150)
    if(disposed)return
    paragraph.textContent=text
    if(response){
      const staging=document.createElement('div');renderResponse(response,staging)
      for(const block of [...staging.children]){
        if(disposed)return
        if(!window.SacredAccessibility?.reduceMotion())await revealPause(140)
        if(disposed)return
        if(block.classList.contains('sage-products')){
          const cards=[...block.children];block.replaceChildren();follow(()=>article.append(block))
          for(const product of cards){
            if(disposed)return
            product.classList.add('sage-rich-enter');follow(()=>block.append(product));if(!window.SacredAccessibility?.reduceMotion())await revealPause(180)
          }
        }else{block.classList.add('sage-rich-enter');follow(()=>article.append(block))}
      }
    }
    article.removeAttribute('aria-busy');body.removeAttribute('aria-busy')
    return article
  }
  function welcome(){
    $('sageBody').replaceChildren()
    bubble('assistant',language()==='my'?'မင်္ဂလာပါ၊ ကျွန်ုပ်က Sage ပါ။ ဘတ်ဂျက်နှင့် ထားရှိမည့်နေရာကို ပြောပြပေးပါ။':'A little guidance, thoughtfully chosen. I’m Sage—tell me your budget or the space you have in mind.')
    if(!messages.length){
      const quick=node('div',null,'sage-quick',$('sageBody'));quick.id='sageQuick'
      for(const [label,prompt] of [['Find My Perfect Buddha','Help me find my perfect Buddha'],['Shop Under My Budget','Help me shop under my budget'],['Compare Statues','I want to compare statues'],['Help Me Choose a Gift','I want a gift for my parents'],['Find a Statue for My Room','Find a statue for my room'],['Track My Order','How do I track my order?']]){const button=node('button',label,null,quick);button.type='button';button.onclick=()=>send(prompt)}
    }
    for(const message of messages)bubble(message.role,message.content,message.response)
    mode(messages.filter(m=>m.response).at(-1)?.response.mode||'guided');scroll()
  }
  async function send(text,retry=false){
    text=String(text||'').trim();if(!text||pending||text.length>2000)return
    const started=performance.now()
    pending=true;$('sageSend').disabled=true;$('sageClear').disabled=true;$('sageTyping').hidden=false
    if(!retry){messages.push({role:'user',content:text});bubble('user',text);save()}
    $('sageQuick')?.remove();$('sageInput').value='';scroll()
    try{
      const context=messages.slice(-12).map(({role,content})=>({role,content:content.slice(0,2000)}))
      let response
      if(store?.enabled){await store.flush();response=await store.request('sage','POST',{messages:context,language:language()});await store.refreshCatalogue()}
      else response=core.respond({products:api.products,messages:context,cart:api.getCart(),language:language()})
      await waitForReply(started)
      if(disposed)return
      const content=String(response.message||'What would you like to explore next?')
      await revealReply(content,response)
      if(disposed)return
      messages.push({role:'assistant',content,response});messages=messages.slice(-30);mode(response.mode);save()
      if(!open)$('sageNewDot').hidden=false
    }catch(error){
      await waitForReply(started)
      if(disposed)return
      const article=await revealReply(error.status===429?'A little pause—please wait a minute before sending another message.':'Sage couldn’t connect. Your bag is unchanged. Please try again.')
      if(disposed||!article)return
      const retryButton=node('button','Try again','sage-link',article);retryButton.type='button';retryButton.onclick=()=>{retryButton.remove();send(text,true)}
    }finally{pending=false;$('sageSend').disabled=false;$('sageClear').disabled=false;$('sageTyping').hidden=true;$('sageBody').removeAttribute('aria-busy')}
  }
  $('sageLauncher').onclick=()=>setOpen(!open)
  $('sageMinimize').onclick=()=>setOpen(false)
  $('sageClose').onclick=()=>{setOpen(false);$('sageInput').value=''}
  $('sageClear').onclick=()=>{if(pending)return;messages=[];save();welcome();$('sageInput').focus()}
  $('sageForm').onsubmit=event=>{event.preventDefault();send($('sageInput').value)}
  $('sageInput').onkeydown=event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();send($('sageInput').value)}}
  root.addEventListener('keydown',event=>{if(event.key==='Escape'&&open){event.preventDefault();setOpen(false)}})
  // Outside interactions keep their normal action and focus destination.
  document.addEventListener('pointerdown',event=>{
    if(!open||event.composedPath().includes(root))return
    open=false;root.classList.remove('sage-is-open');$('sagePanel').inert=true;$('sageLauncher').setAttribute('aria-expanded','false')
  })
  const viewport=()=>{const vv=window.visualViewport;root.style.setProperty('--sage-vh',(vv?.height||window.innerHeight)+'px');root.style.setProperty('--sage-keyboard-offset',Math.max(0,window.innerHeight-(vv?.height||window.innerHeight)-(vv?.offsetTop||0))+'px')}
  window.visualViewport?.addEventListener('resize',viewport);window.addEventListener('resize',viewport)
  window.addEventListener('pagehide',()=>{disposed=true;finishReplyPause();window.visualViewport?.removeEventListener('resize',viewport);window.removeEventListener('resize',viewport)})
  window.addEventListener('pageshow',event=>{if(event.persisted){disposed=false;window.visualViewport?.addEventListener('resize',viewport);window.addEventListener('resize',viewport);viewport();welcome()}})
  window.addEventListener('sacredform:languagechange',()=>{if(!messages.length)welcome()})
  viewport();welcome()
})()
