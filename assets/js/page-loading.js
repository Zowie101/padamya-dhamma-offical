/* Placeholders follow real rendering and image loading; no artificial delay. */
;(()=>{
 const active=new Map(),seen=new WeakMap()
 const line=(width='100%')=>`<span class="skeleton-line" style="width:${width}"></span>`
 function markup(kind){
  const text=line('64%')+line('88%')+line('45%')
  if(kind==='cards')return Array.from({length:3},()=>`<div class="skeleton-card" data-skeleton-placeholder aria-hidden="true"><span class="skeleton-photo"></span>${text}</div>`).join('')
  if(kind==='form')return `<div class="skeleton-form" data-skeleton-placeholder aria-hidden="true">${line('45%')}<div class="skeleton-fields">${Array.from({length:6},()=>'<span class="skeleton-field"></span>').join('')}</div>${line('55%')}</div>`
  return `<div class="skeleton-rows" data-skeleton-placeholder aria-hidden="true">${kind==='account'?line('65%')+line('45%'):''}${Array.from({length:kind==='account'?2:3},()=>`<div class="skeleton-row">${text}</div>`).join('')}</div>`
 }
 function show(root,kind='rows'){
  if(!root||active.has(root))return
  root.innerHTML=markup(kind)
  root.classList.add('is-skeleton',...(kind==='cards'?['is-skeleton-grid']:[]));root.setAttribute('aria-busy','true')
  const status=document.createElement('span');status.className='sr-only';status.setAttribute('role','status');status.textContent='Loading content…';root.append(status)
  const finish=()=>{observer.disconnect();clearTimeout(timer);active.delete(root);root.classList.remove('is-skeleton','is-skeleton-grid');root.removeAttribute('aria-busy');status.remove()}
  const observer=new MutationObserver(()=>{if(!root.querySelector('[data-skeleton-placeholder]'))finish()})
  observer.observe(root,{childList:true})
  const timer=setTimeout(()=>{if(root.querySelector('[data-skeleton-placeholder]')){root.replaceChildren();const message=document.createElement('p');message.textContent='Loading is taking longer than expected. Refresh to try again.';root.append(message)}finish()},15000)
  active.set(root,finish)
 }
 const imageSelector='.product-image img,.category-photo img,.artwork img,.saved-image img,.room-product-image img'
 function image(img){
  if(!img.src||img.complete||seen.get(img)===img.src)return
  seen.set(img,img.src);const parent=img.parentElement;if(!parent)return
  parent.classList.add('is-image-loading')
  const finish=()=>{parent.classList.remove('is-image-loading');img.removeEventListener('load',finish);img.removeEventListener('error',finish)}
  img.addEventListener('load',finish,{once:true});img.addEventListener('error',finish,{once:true})
 }
 function scan(node){if(node.nodeType!==1)return;if(node.matches(imageSelector))image(node);node.querySelectorAll(imageSelector).forEach(image)}
 const images=new MutationObserver(records=>{for(const record of records){if(record.type==='attributes'){if(record.target.matches(imageSelector))image(record.target)}else record.addedNodes.forEach(scan)}})
 function start(){
  const targets={'productGrid':'cards','relatedGrid':'cards','wishlistContent':'cards','cartContent':'rows','checkoutRoot':'form','orderSuccessRoot':'rows','accountRoot':'account','historyList':'rows','adminOrders':'rows','adminCatalogueRoot':'cards'}
  for(const [id,kind]of Object.entries(targets)){const root=document.getElementById(id);if(root&&(!root.children.length||['accountRoot','adminCatalogueRoot'].includes(id)&&root.children.length===1&&/Connecting|Loading/.test(root.textContent)))show(root,kind)}
  const info=document.querySelector('.detail-info'),name=document.getElementById('detailName')
  if(info&&name?.textContent==='A considered piece.'){
   const overlay=document.createElement('div');overlay.className='product-info-skeleton';overlay.setAttribute('aria-hidden','true');overlay.innerHTML=markup('form');info.prepend(overlay);info.classList.add('skeleton-covered');info.setAttribute('aria-busy','true')
   const finish=()=>{overlay.remove();info.classList.remove('skeleton-covered');info.removeAttribute('aria-busy');observer.disconnect()}
   const observer=new MutationObserver(()=>{if(name.textContent!=='A considered piece.')finish()});observer.observe(name,{childList:true,characterData:true,subtree:true});setTimeout(finish,15000)
  }
  scan(document.body);images.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['src']})
 }
 window.PadamyaLoading=Object.freeze({show})
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start()
 window.addEventListener('pagehide',()=>images.disconnect())
 window.addEventListener('pageshow',event=>{if(event.persisted){scan(document.body);images.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['src']})}})
})()
