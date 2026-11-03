import { randomUUID, randomInt } from 'node:crypto'
import { transaction, STAGES } from './database.mts'
import { ApiError, hash, token, now, passwordHash, passwordMatches } from './security.mts'
import { rateLimit } from './security.mts'
import fs from 'node:fs'
import path from 'node:path'
import { ROOT } from './database.mts'
export class Store {
  db: any
  constructor(db:any) {this.db=db}
  storage='sqlite'
  limit(bucket:string,max:number,windowMs:number){return rateLimit(this.db,bucket,max,windowMs)}
  logout(raw:string){this.db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(raw))}
  importBag(profile:any,data:any){return transaction(this.db,()=>{
    const combined=new Map<string,number>()
    for(const item of [...this.cart(profile.id),...data.cart])combined.set(item.id,Math.max(combined.get(item.id)||0,item.qty))
    return {cart:this.saveCart(profile.id,[...combined].map(([id,qty])=>({id,qty}))),wishlist:this.saveWishlist(profile.id,[...this.wishlist(profile.id),...data.wishlist])}
  })}
  media(id:string){const entry=this.db.prepare('SELECT * FROM media WHERE id=?').get(id);return entry?{...entry,file:path.join(ROOT,'.data/media',entry.id)}:null}
  saveMedia(id:string,mime:string,filename:string,owner:string,bytes:Buffer){
    const folder=path.join(ROOT,'.data/media');fs.mkdirSync(folder,{recursive:true});const file=path.join(folder,id);fs.writeFileSync(file,bytes,{flag:'wx'})
    try{this.db.prepare('INSERT INTO media VALUES(?,?,?,?,?)').run(id,mime,filename,owner,now())}catch(error){fs.unlinkSync(file);throw error}
    return '/media/'+id
  }
  products(includeInactive=false) {return this.db.prepare('SELECT data FROM products').all().map((row:any)=>JSON.parse(row.data)).filter((p:any)=>includeInactive||p.active)}
  product(id:string) {const row=this.db.prepare('SELECT data FROM products WHERE id=?').get(id);return row?JSON.parse(row.data):null}
  profile(id:string) {return this.db.prepare('SELECT id,email,name,role FROM profiles WHERE id=?').get(id)}
  createGuest() {const id=randomUUID();this.db.prepare('INSERT INTO profiles(id,role,created_at) VALUES(?,?,?)').run(id,'guest',now());return this.profile(id)}
  session(raw:string|undefined) {
    if(!raw) return null
    const row=this.db.prepare('SELECT * FROM sessions WHERE token_hash=? AND expires>?').get(hash(raw),Date.now())
    return row?{...row,profile:this.profile(row.user_id)}:null
  }
  newSession(profile:any) {
    const raw=token(), csrf=token()
    this.db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now())
    this.db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(hash(raw),profile.id,csrf,Date.now()+30*86400000)
    return {raw,csrf,profile}
  }
  cart(userId:string) {const row=this.db.prepare('SELECT data FROM carts WHERE user_id=?').get(userId);return row?JSON.parse(row.data):[]}
  wishlist(userId:string) {const row=this.db.prepare('SELECT data FROM wishlists WHERE user_id=?').get(userId);return row?JSON.parse(row.data):[]}
  normalizeCart(items:any[]) {
    const combined=new Map<string,number>()
    for(const item of items) combined.set(item.id,(combined.get(item.id)||0)+item.qty)
    const cart=[...combined].map(([id,qty])=>({id,qty}))
    for(const item of cart) {
      const p=this.product(item.id)
      if(!p||!p.active)throw new ApiError(400,'A piece is no longer available. Please review your bag.')
      if(item.qty>99)throw new ApiError(400,'Please choose fewer than 100 of each piece.')
      if(p.stock!==null && item.qty>p.stock)throw new ApiError(409,`Only ${p.stock} of ${p.name} remain. Please adjust your bag.`)
    }
    return cart
  }
  saveCart(id:string,items:any[]) {const cart=this.normalizeCart(items);this.db.prepare('INSERT OR REPLACE INTO carts VALUES(?,?)').run(id,JSON.stringify(cart));return cart}
  saveWishlist(id:string,items:string[]) {
    const ids=[...new Set(items)]
    if(ids.some(id=>!this.product(id)))throw new ApiError(400,'An unknown piece was selected.')
    this.db.prepare('INSERT OR REPLACE INTO wishlists VALUES(?,?)').run(id,JSON.stringify(ids));return ids
  }
  async register(profile:any,data:any) {
    if(profile.role!=='guest')throw new ApiError(409,'Please sign out before creating another account.')
    const password=await passwordHash(data.password)
    try {this.db.prepare("UPDATE profiles SET email=?,password=?,name=?,role='customer' WHERE id=?").run(data.email,password,data.name,profile.id)}
    catch {throw new ApiError(409,'This email cannot be registered. Try signing in instead.')}
    this.db.prepare('DELETE FROM sessions WHERE user_id=?').run(profile.id)
    return this.profile(profile.id)
  }
  async login(guest:any,data:any) {
    const user=this.db.prepare('SELECT * FROM profiles WHERE email=?').get(data.email)
    if(!await passwordMatches(data.password,user?.password||''))throw new ApiError(401,'Email or password is incorrect.')
    if(guest.role==='guest'&&guest.id!==user.id) transaction(this.db,()=>{
      const merged=new Map<string,number>()
      for(const item of [...this.cart(user.id),...this.cart(guest.id)]) merged.set(item.id,Math.min(99,Math.max(merged.get(item.id)||0,item.qty)))
      // Merging saves the bag as a draft; stock is rechecked during checkout.
      this.db.prepare('INSERT OR REPLACE INTO carts VALUES(?,?)').run(user.id,JSON.stringify([...merged].map(([id,qty])=>({id,qty}))))
      this.saveWishlist(user.id,[...this.wishlist(user.id),...this.wishlist(guest.id)])
      this.db.prepare('UPDATE orders SET user_id=? WHERE user_id=?').run(user.id,guest.id)
      this.db.prepare('DELETE FROM sessions WHERE user_id=?').run(guest.id)
    })
    return this.profile(user.id)
  }
  orders(profile:any) {
    const rows=profile.role==='admin'?this.db.prepare('SELECT data FROM orders').all():this.db.prepare('SELECT data FROM orders WHERE user_id=?').all(profile.id)
    return rows.map((row:any)=>JSON.parse(row.data)).sort((a:any,b:any)=>Date.parse(b.createdAt)-Date.parse(a.createdAt))
  }
  order(ref:string,profile:any) {
    const row=this.db.prepare('SELECT * FROM orders WHERE ref=?').get(ref)
    if(!row || (profile.role!=='admin'&&row.user_id!==profile.id))throw new ApiError(404,'Order not found for this account or browser session.')
    return JSON.parse(row.data)
  }
  deliveryDetails(userId:string) {const row=this.db.prepare('SELECT data FROM saved_delivery WHERE user_id=?').get(userId);return row?JSON.parse(row.data):null}
  saveDelivery(userId:string,details:any) {this.db.prepare('INSERT OR REPLACE INTO saved_delivery VALUES(?,?)').run(userId,JSON.stringify(details))}
  forgetDelivery(userId:string) {this.db.prepare('DELETE FROM saved_delivery WHERE user_id=?').run(userId)}
  createOrder(profile:any,data:any) {
    return transaction(this.db,()=>{
      const requestHash=hash(JSON.stringify(data)),previous=this.db.prepare('SELECT * FROM orders WHERE user_id=? AND idempotency_key=?').get(profile.id,data.idempotencyKey)
      if(previous) {if(previous.request_hash!==requestHash)throw new ApiError(409,'This checkout reference was already used. Please start a new checkout.');return JSON.parse(previous.data)}
      const cart=this.normalizeCart(data.cart)
      const items=cart.map((item:any)=>{const p=this.product(item.id);return {id:p.id,qty:item.qty,name:p.name,price:p.price,image:p.image,height:p.height}})
      let ref=''
      for(let i=0;i<100;i++){ref='SF-'+randomInt(1000000,10000000);if(!this.db.prepare('SELECT 1 FROM orders WHERE ref=?').get(ref))break;ref=''}
      if(!ref)throw new ApiError(503,'Unable to allocate an order reference. Try again.')
      const createdAt=now(),subtotal=items.reduce((n:number,p:any)=>n+p.qty*p.price,0)
      const order={ref,customer:data.customer,items,subtotal,deliveryFee:null,total:subtotal,currency:'MMK',createdAt,status:'placed',history:[{status:'placed',at:createdAt}],adminEvents:[],delivery:{},paymentStatus:'unpaid',localServer:true,isDemo:false}
      for(const item of cart){const p=this.product(item.id);if(p.stock!==null){p.stock-=item.qty;this.db.prepare('UPDATE products SET data=? WHERE id=?').run(JSON.stringify(p),p.id)}}
      this.db.prepare('INSERT INTO orders VALUES(?,?,?,?,?)').run(ref,profile.id,JSON.stringify(order),data.idempotencyKey,requestHash)
      if(data.saveDelivery===true){const {name,phone,email,address,city,country}=data.customer;this.db.prepare('INSERT OR REPLACE INTO saved_delivery VALUES(?,?)').run(profile.id,JSON.stringify({name,phone,email,address,city,country}))}
      this.db.prepare('INSERT OR REPLACE INTO carts VALUES(?,?)').run(profile.id,'[]')
      return order
    })
  }
  admin(profile:any) {if(profile.role!=='admin')throw new ApiError(403,'Administrator access is required.')}
  updateStage(profile:any,ref:string,status:string,expectedStatus:string) {
    this.admin(profile)
    return transaction(this.db,()=>{
      const order=this.order(ref,profile),index=STAGES.indexOf(status)
      if(index<0)throw new ApiError(400,'Choose a valid stage.')
      if(order.status!==expectedStatus)throw new ApiError(409,'This order changed. Refresh and try again.')
      if(order.status===status)return order
      const at=now();order.adminEvents||=[]
      order.adminEvents.push({from:order.status,to:status,at,actorId:profile.id,simulated:!!order.isDemo,previousHistory:order.history})
      order.history=STAGES.slice(0,index+1).map(stage=>order.history.find((h:any)=>h.status===stage)||{status:stage,at,source:'admin',simulated:!!order.isDemo})
      order.status=status;order.delivery.shippedAt=index>=3?order.history.find((h:any)=>h.status==='out-for-delivery').at:null
      this.db.prepare('UPDATE orders SET data=? WHERE ref=?').run(JSON.stringify(order),ref)
      return order
    })
  }
  updateProduct(profile:any,id:string,changes:any) {
    this.admin(profile);const p=this.product(id);if(!p)throw new ApiError(404,'Product not found.')
    const updated={...p,...changes};this.db.prepare('UPDATE products SET data=? WHERE id=?').run(JSON.stringify(updated),id);return updated
  }
  seedDemo(profile:any) {
    this.admin(profile)
    return transaction(this.db,()=>{
      const products=this.products();if(!products.length)throw new ApiError(400,'Add a product first.')
      for(let i=0;i<3;i++) {
        const ref=`SF-DEMO-${1001+i}`;if(this.db.prepare('SELECT 1 FROM orders WHERE ref=?').get(ref))continue
        const p=products[i%products.length],at=now(),stage=[1,3,4][i]
        const order={ref,customer:{name:'Sample customer',email:'demo@sacredform.example',phone:'',address:'Sample address',city:'Yangon',country:'Myanmar'},items:[{id:p.id,qty:1,name:p.name,price:p.price,image:p.image,height:p.height}],subtotal:p.price,deliveryFee:null,total:p.price,currency:'MMK',createdAt:at,status:STAGES[stage],history:STAGES.slice(0,stage+1).map(status=>({status,at,simulated:true})),delivery:{},isDemo:true,simulated:true}
        this.db.prepare('INSERT INTO orders VALUES(?,?,?,?,?)').run(ref,profile.id,JSON.stringify(order),`seed-${i}`,`seed-${i}`)
      }
      return this.orders(profile)
    })
  }
}
