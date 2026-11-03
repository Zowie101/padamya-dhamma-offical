/* Per-tab return destinations. Only known pages on this storefront are allowed. */
;(()=>{
 const pages=new Set(['index.html','shop.html','product.html','shrine.html','about.html','cart.html','checkout.html','compare.html','wishlist.html','track-order.html','order-success.html','room.html','admin.html','admin-catalogue.html'])
 function safe(value){
  if(!value)return null
  try{const url=new URL(value,location.href),page=url.pathname.split('/').pop();if(url.origin!==location.origin||url.username||url.password||!pages.has(page)||url.pathname!==new URL(page,location.href).pathname)return null;return page+url.search+url.hash}catch{return null}
 }
 function previous(){try{return safe(sessionStorage.getItem('padamya:last-page'))}catch{return null}}
 const referrer=safe(document.referrer),last=previous()
 const accountReturn=()=>safe(new URLSearchParams(location.search).get('return'))||referrer||last||'shop.html'
 window.PadamyaNavigation=Object.freeze({accountReturn,safe})
 const current=safe(location.href)
 if(current)try{sessionStorage.setItem('padamya:last-page',current)}catch{}
})()
