;(async()=>{
  const store=window.SacredStore;await store?.ready
  if(!store?.enabled||store.profile.role!=='admin')return
  const section=document.createElement('section');section.className='admin-catalogue';section.innerHTML='<h2>Catalogue & inventory</h2><p>Prices are in MMK. Leave stock blank when it is not yet tracked.</p><div class="admin-product-grid"></div><h3>Product media</h3><p>Public product files only. Room photos stay on the customer’s device.</p><form id="adminUpload"><label>PNG, JPEG, WebP or GLB · up to 8 MB<input type="file" accept=".png,.jpg,.jpeg,.webp,.glb" required></label><button class="admin-button" type="submit">Upload media</button><output id="adminUploadResult" aria-live="polite"></output></form>'
  document.getElementById('adminMain').append(section)
  const grid=section.querySelector('.admin-product-grid')
  async function render(){
    const products=(await store.request('admin/products')).products;grid.replaceChildren()
    for(const p of products){
      const form=document.createElement('form');form.className='admin-product-form'
      const image=document.createElement('img');image.src=p.previewImage||p.image;image.alt=p.name;form.append(image)
      const title=document.createElement('h3');title.textContent=p.name;form.append(title)
      function input(label,type,value){const field=document.createElement('label');field.textContent=label;const el=document.createElement('input');el.type=type;if(type==='checkbox')el.checked=value;else el.value=value;field.append(el);form.append(field);return el}
      const price=input('Price · MMK','number',p.price);price.required=true;price.min='0';price.max='1000000000';price.step='1'
      const stock=input('Stock · blank means untracked','number',p.stock??'');stock.min='0';stock.max='100000';stock.step='1'
      const active=input('Available to order','checkbox',p.active)
      const save=document.createElement('button');save.type='submit';save.className='admin-button';save.textContent='Save product';form.append(save)
      const result=document.createElement('p');result.setAttribute('role','status');form.append(result)
      form.onsubmit=async event=>{event.preventDefault();save.disabled=true;try{await store.request('admin/products/'+p.id,'PATCH',{price:Number(price.value),stock:stock.value===''?null:Number(stock.value),active:active.checked});await store.refreshCatalogue();result.textContent='Saved to the server.'}catch(error){result.textContent=error.message}finally{save.disabled=false}}
      grid.append(form)
    }
  }
  await render()
  document.getElementById('adminUpload').onsubmit=async event=>{
    event.preventDefault();const form=event.target,file=form.querySelector('input').files[0],button=form.querySelector('button'),output=document.getElementById('adminUploadResult')
    if(!file||file.size>8*1024*1024){output.textContent='Choose a file up to 8 MB.';return}
    button.disabled=true;output.textContent='Uploading…'
    try{const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file)});const result=await store.request('admin/media','POST',{filename:file.name,mime:file.name.toLowerCase().endsWith('.glb')?'model/gltf-binary':file.type,base64});output.textContent='Uploaded: '+result.url}catch(error){output.textContent=error.message}finally{button.disabled=false}
  }
})()
