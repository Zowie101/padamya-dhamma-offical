import {addressBook,defaultDelivery,changeAddress} from './delivery-book.mts'
import fs from 'node:fs'
import path from 'node:path'
import { randomUUID,randomInt } from 'node:crypto'
import { ROOT,STAGES } from './database.mts'
import { ApiError,hash,token,now,passwordHash,passwordMatches } from './security.mts'
import { cloudStorage } from './cloud-storage.mts'

// Same repository contract as the local SQLite store; HTTP awaits either one.
export class PostgresStore {
  pool:any; connection:any; assets:any; storage='postgres'
  constructor(pool:any,assets:any=null,connection:any=null){this.pool=pool;this.connection=connection||pool;this.assets=assets}
  async query(sql:string,args:any[]=[]){return (await this.connection.query(sql,args)).rows}
  async initialize(){
    await this.transaction(async store=>{
      await store.connection.query(fs.readFileSync(path.join(ROOT,'server/postgres-schema.sql'),'utf8'))
      const seed=JSON.parse(fs.readFileSync(path.join(ROOT,'server/data/catalogue.json'),'utf8'))
      for(const p of seed)await store.query('INSERT INTO padamya.products VALUES($1,$2::jsonb) ON CONFLICT DO NOTHING',[p.id,JSON.stringify(p)])
    })
  }
  async transaction(callback:(store:PostgresStore)=>Promise<any>){
    if(this.connection!==this.pool)return callback(this)
    const client=await this.pool.connect()
    try{
      await client.query('BEGIN')
      // Serialize inventory/ownership mutations across all server instances.
      await client.query('SELECT pg_advisory_xact_lock(724913021)')
      const result=await callback(new PostgresStore(this.pool,this.assets,client))
      await client.query('COMMIT');return result
    }catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
  }
  async close(){await this.pool.end()}
  async products(includeInactive=false){return (await this.query('SELECT data FROM padamya.products ORDER BY id')).map((r:any)=>r.data).filter((p:any)=>includeInactive||p.active)}
  async product(id:string){return (await this.query('SELECT data FROM padamya.products WHERE id=$1',[id]))[0]?.data||null}
  async profile(id:string){return (await this.query('SELECT id,email,name,role FROM padamya.profiles WHERE id=$1',[id]))[0]}
  async createGuest(){const id=randomUUID();await this.query('INSERT INTO padamya.profiles(id,role,created_at) VALUES($1,$2,$3)',[id,'guest',now()]);return this.profile(id)}
  async session(raw:string|undefined){
    if(!raw)return null
    const row=(await this.query('SELECT * FROM padamya.sessions WHERE token_hash=$1 AND expires>$2',[hash(raw),Date.now()]))[0]
    return row?{...row,profile:await this.profile(row.user_id)}:null
  }
  async newSession(profile:any){
    const raw=token(),csrf=token()
    await this.query('DELETE FROM padamya.sessions WHERE expires<$1',[Date.now()])
    await this.query('INSERT INTO padamya.sessions VALUES($1,$2,$3,$4)',[hash(raw),profile.id,csrf,Date.now()+30*86400000])
    return {raw,csrf,profile}
  }
  async logout(raw:string){await this.query('DELETE FROM padamya.sessions WHERE token_hash=$1',[hash(raw)])}
  async cart(id:string){return (await this.query('SELECT data FROM padamya.carts WHERE user_id=$1',[id]))[0]?.data||[]}
  async wishlist(id:string){return (await this.query('SELECT data FROM padamya.wishlists WHERE user_id=$1',[id]))[0]?.data||[]}
  async normalizeCart(items:any[]){
    const combined=new Map<string,number>()
    for(const item of items)combined.set(item.id,(combined.get(item.id)||0)+item.qty)
    const cart=[...combined].map(([id,qty])=>({id,qty}))
    for(const item of cart){const p=await this.product(item.id)
      if(!p||!p.active)throw new ApiError(400,'A piece is no longer available. Please review your bag.')
      if(item.qty>99)throw new ApiError(400,'Please choose fewer than 100 of each piece.')
      if(p.stock!==null&&item.qty>p.stock)throw new ApiError(409,`Only ${p.stock} of ${p.name} remain. Please adjust your bag.`)
    }return cart
  }
  async writeCart(id:string,cart:any[]){await this.query('INSERT INTO padamya.carts VALUES($1,$2::jsonb) ON CONFLICT(user_id) DO UPDATE SET data=EXCLUDED.data',[id,JSON.stringify(cart)]);return cart}
  async saveCart(id:string,items:any[]){return this.writeCart(id,await this.normalizeCart(items))}
  async saveWishlist(id:string,items:string[]){
    const ids=[...new Set(items)],catalogue=new Set((await this.products(true)).map((p:any)=>p.id))
    if(ids.some(id=>!catalogue.has(id)))throw new ApiError(400,'An unknown piece was selected.')
    await this.query('INSERT INTO padamya.wishlists VALUES($1,$2::jsonb) ON CONFLICT(user_id) DO UPDATE SET data=EXCLUDED.data',[id,JSON.stringify(ids)]);return ids
  }
  async importBag(profile:any,data:any){return this.transaction(async store=>{
    const combined=new Map<string,number>()
    for(const item of [...await store.cart(profile.id),...data.cart])combined.set(item.id,Math.max(combined.get(item.id)||0,item.qty))
    return {cart:await store.saveCart(profile.id,[...combined].map(([id,qty])=>({id,qty}))),wishlist:await store.saveWishlist(profile.id,[...await store.wishlist(profile.id),...data.wishlist])}
  })}
  async register(profile:any,data:any){
    if(profile.role!=='guest')throw new ApiError(409,'Please sign out before creating another account.')
    const password=await passwordHash(data.password)
    return this.transaction(async store=>{
      try{const rows=await store.query("UPDATE padamya.profiles SET email=$1,password=$2,name=$3,role='customer' WHERE id=$4 AND role='guest' RETURNING id",[data.email.toLowerCase(),password,data.name,profile.id]);if(!rows.length)throw new ApiError(409,'This account changed. Refresh and try again.')}
      catch(error:any){if(error.code==='23505')throw new ApiError(409,'This email cannot be registered. Try signing in instead.');throw error}
      await store.query('DELETE FROM padamya.sessions WHERE user_id=$1',[profile.id]);return store.profile(profile.id)
    })
  }
  async login(guest:any,data:any){
    const user=(await this.query('SELECT * FROM padamya.profiles WHERE email=$1',[data.email.toLowerCase()]))[0]
    if(!await passwordMatches(data.password,user?.password||''))throw new ApiError(401,'Email or password is incorrect.')
    if(guest.role==='guest'&&guest.id!==user.id)await this.transaction(async store=>{
      const merged=new Map<string,number>()
      for(const item of [...await store.cart(user.id),...await store.cart(guest.id)])merged.set(item.id,Math.min(99,Math.max(merged.get(item.id)||0,item.qty)))
      await store.writeCart(user.id,[...merged].map(([id,qty])=>({id,qty})))
      await store.saveWishlist(user.id,[...await store.wishlist(user.id),...await store.wishlist(guest.id)])
      await store.query('UPDATE padamya.orders SET user_id=$1 WHERE user_id=$2',[user.id,guest.id])
      await store.query('DELETE FROM padamya.sessions WHERE user_id=$1',[guest.id])
    })
    return this.profile(user.id)
  }
  async orders(profile:any){const rows=profile.role==='admin'?await this.query('SELECT data FROM padamya.orders'):await this.query('SELECT data FROM padamya.orders WHERE user_id=$1',[profile.id]);return rows.map((r:any)=>r.data).sort((a:any,b:any)=>Date.parse(b.createdAt)-Date.parse(a.createdAt))}
  async order(ref:string,profile:any){const row=(await this.query('SELECT * FROM padamya.orders WHERE ref=$1',[ref]))[0];if(!row||(profile.role!=='admin'&&row.user_id!==profile.id))throw new ApiError(404,'Order not found for this account or browser session.');return row.data}
  admin(profile:any){if(profile.role!=='admin')throw new ApiError(403,'Administrator access is required.')}
  async addressBook(userId:string){return addressBook((await this.query('SELECT data FROM padamya.saved_delivery WHERE user_id=$1',[userId]))[0]?.data||null)}
  async deliveryDetails(userId:string){return defaultDelivery(await this.addressBook(userId))}
  async updateAddressBook(userId:string,action:string,data:any={}){return this.transaction(async store=>{const book=changeAddress(await store.addressBook(userId),action,data);await store.query('INSERT INTO padamya.saved_delivery VALUES($1,$2::jsonb) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data',[userId,JSON.stringify(book)]);return book})}
  async saveDelivery(userId:string,details:any){await this.query('INSERT INTO padamya.saved_delivery VALUES($1,$2::jsonb) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data',[userId,JSON.stringify(changeAddress(await this.addressBook(userId),'delivery',details))])}
  async forgetDelivery(userId:string){await this.query('DELETE FROM padamya.saved_delivery WHERE user_id=$1',[userId])}
  async createOrder(profile:any,data:any){return this.transaction(async store=>{
    const requestHash=hash(JSON.stringify(data)),previous=(await store.query('SELECT * FROM padamya.orders WHERE user_id=$1 AND idempotency_key=$2',[profile.id,data.idempotencyKey]))[0]
    if(previous){if(previous.request_hash!==requestHash)throw new ApiError(409,'This checkout reference was already used. Please start a new checkout.');return previous.data}
    const cart=await store.normalizeCart(data.cart),items=[]
    for(const item of cart){const p=await store.product(item.id);items.push({id:p.id,qty:item.qty,name:p.name,price:p.price,image:p.image,height:p.height})}
    let ref='';for(let i=0;i<100;i++){ref='SF-'+randomInt(1000000,10000000);if(!(await store.query('SELECT 1 FROM padamya.orders WHERE ref=$1',[ref])).length)break;ref=''}
    if(!ref)throw new ApiError(503,'Unable to allocate an order reference. Try again.')
    const createdAt=now(),subtotal=items.reduce((n:number,p:any)=>n+p.qty*p.price,0)
    const order={ref,customer:data.customer,items,subtotal,deliveryFee:null,total:subtotal,currency:'MMK',createdAt,status:'placed',history:[{status:'placed',at:createdAt}],adminEvents:[],delivery:{},paymentStatus:'unpaid',localServer:true,isDemo:false}
    for(const item of cart){const p=await store.product(item.id);if(p.stock!==null){p.stock-=item.qty;await store.query('UPDATE padamya.products SET data=$1::jsonb WHERE id=$2',[JSON.stringify(p),p.id])}}
    await store.query('INSERT INTO padamya.orders VALUES($1,$2,$3::jsonb,$4,$5)',[ref,profile.id,JSON.stringify(order),data.idempotencyKey,requestHash])
    if(data.saveDelivery===true)await store.saveDelivery(profile.id,data.customer)
    await store.writeCart(profile.id,[]);return order
  })}
  async updateStage(profile:any,ref:string,status:string,expectedStatus:string){this.admin(profile);return this.transaction(async store=>{
    const order=await store.order(ref,profile),index=STAGES.indexOf(status)
    if(index<0)throw new ApiError(400,'Choose a valid stage.')
    if(order.status!==expectedStatus)throw new ApiError(409,'This order changed. Refresh and try again.')
    if(order.status===status)return order
    const at=now();order.adminEvents||=[];order.adminEvents.push({from:order.status,to:status,at,actorId:profile.id,simulated:!!order.isDemo,previousHistory:order.history})
    order.history=STAGES.slice(0,index+1).map(stage=>order.history.find((h:any)=>h.status===stage)||{status:stage,at,source:'admin',simulated:!!order.isDemo})
    order.status=status;order.delivery.shippedAt=index>=3?order.history.find((h:any)=>h.status==='out-for-delivery').at:null
    await store.query('UPDATE padamya.orders SET data=$1::jsonb WHERE ref=$2',[JSON.stringify(order),ref]);return order
  })}
  async updateProduct(profile:any,id:string,changes:any){this.admin(profile);return this.transaction(async store=>{const p=await store.product(id);if(!p)throw new ApiError(404,'Product not found.');const updated={...p,...changes};await store.query('UPDATE padamya.products SET data=$1::jsonb WHERE id=$2',[JSON.stringify(updated),id]);return updated})}
  async seedDemo(profile:any){this.admin(profile);return this.transaction(async store=>{
    const products=await store.products();if(!products.length)throw new ApiError(400,'Add a product first.')
    for(let i=0;i<3;i++){
      const ref=`SF-DEMO-${1001+i}`;if((await store.query('SELECT 1 FROM padamya.orders WHERE ref=$1',[ref])).length)continue
      const p=products[i%products.length],at=now(),stage=[1,3,4][i]
      const order={ref,customer:{name:'Sample customer',email:'demo@padamya.example',phone:'',address:'Sample address',city:'Yangon',country:'Myanmar'},items:[{id:p.id,qty:1,name:p.name,price:p.price,image:p.image,height:p.height}],subtotal:p.price,deliveryFee:null,total:p.price,currency:'MMK',createdAt:at,status:STAGES[stage],history:STAGES.slice(0,stage+1).map(status=>({status,at,simulated:true})),delivery:{},isDemo:true,simulated:true}
      await store.query('INSERT INTO padamya.orders VALUES($1,$2,$3::jsonb,$4,$5)',[ref,profile.id,JSON.stringify(order),`seed-${i}`,`seed-${i}`])
    }return store.orders(profile)
  })}
  async limit(bucket:string,max:number,windowMs:number){
    const at=Date.now(),row=(await this.query(`INSERT INTO padamya.limits VALUES($1,1,$2) ON CONFLICT(bucket) DO UPDATE SET count=CASE WHEN padamya.limits.reset_at<=$3 THEN 1 ELSE padamya.limits.count+1 END,reset_at=CASE WHEN padamya.limits.reset_at<=$3 THEN $2 ELSE padamya.limits.reset_at END RETURNING count`,[hash(bucket),at+windowMs,at]))[0]
    if(row.count>max)throw new ApiError(429,'Too many requests. Please wait a little and try again.')
    await this.query('DELETE FROM padamya.limits WHERE reset_at<$1',[at-86400000])
  }
  async media(id:string){const row=(await this.query('SELECT * FROM padamya.media WHERE id=$1',[id]))[0];return row&&this.assets?{...row,url:this.assets.url(row.storage_path)}:null}
  async saveMedia(id:string,mime:string,filename:string,owner:string,bytes:Buffer){
    if(!this.assets)throw new ApiError(503,'Cloud product uploads are not configured. Existing catalogue assets remain available.')
    await this.assets.put(id,mime,bytes)
    try{await this.query('INSERT INTO padamya.media VALUES($1,$2,$3,$4,$5,$6)',[id,mime,filename,owner,now(),id])}catch(error){await this.assets.remove(id).catch(()=>{});throw error}
    return '/media/'+id
  }
  async promote(email:string){const rows=await this.query("UPDATE padamya.profiles SET role='admin' WHERE email=$1 AND role IN('customer','admin') RETURNING id",[email.toLowerCase()]);if(!rows.length)throw new ApiError(404,'Register this account on the deployed website first.');await this.query('DELETE FROM padamya.sessions WHERE user_id=$1',[rows[0].id])}
}
export async function openPostgresStore(connectionString:string,options:any={}){
  const {Pool}=await import('pg')
  const url=new URL(connectionString)
  if(!['postgres:','postgresql:'].includes(url.protocol))throw Error('DATABASE_URL must be a PostgreSQL connection string.')
  // Do not allow connection-string SSL flags to silently disable verification.
  for(const key of ['sslmode','sslcert','sslkey','sslrootcert'])url.searchParams.delete(key)
  const bundledCA=path.join(ROOT,'prod-ca-2021.crt')
  const ca=process.env.DATABASE_CA_CERT?.replace(/\\n/g,'\n')||(url.hostname.endsWith('.pooler.supabase.com')&&fs.existsSync(bundledCA)?fs.readFileSync(bundledCA,'utf8'):undefined)
  const pool=new Pool({connectionString:url.href,max:4,connectionTimeoutMillis:15000,idleTimeoutMillis:30000,statement_timeout:20000,ssl:{rejectUnauthorized:true,...(ca?{ca}:{})}})
  pool.on('error',()=>console.error('Cloud database connection interrupted.'))
  const store=new PostgresStore(pool,options.assets===undefined?cloudStorage():options.assets)
  try{await store.initialize();return store}catch(error){await pool.end();throw error}
}
