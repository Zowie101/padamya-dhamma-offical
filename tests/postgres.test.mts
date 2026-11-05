import test from 'node:test'
import assert from 'node:assert/strict'
import {PGlite} from '@electric-sql/pglite'
import {PostgresStore} from '../server/postgres-store.mts'
import {createApp} from '../server/http.mts'
import {createSage} from '../server/sage.mts'
import {cloudStorage} from '../server/cloud-storage.mts'
// PostgreSQL engine, not a SQL-result mock. Connections are serialized because
// PGlite is single-connection; production uses pg's independent pooled clients.
async function fixture(t:any){
  const engine=new PGlite();await engine.waitReady
  let tail=Promise.resolve()
  const query=(sql:string,args:any[]=[])=>!args.length&&sql.includes('CREATE SCHEMA')?engine.exec(sql).then(results=>results.at(-1)):engine.query(sql,args)
  const pool={query,async connect(){let unlock:any;const previous=tail;tail=new Promise(resolve=>{unlock=resolve});await previous;return {query,release:unlock}},end:()=>engine.close()}
  const store=new PostgresStore(pool);await store.initialize();t.after(()=>engine.close())
  return {store,engine,pool}
}
const customer={name:'Cloud test',email:'cloud@example.invalid',phone:'123',address:'Test shelf',city:'Yangon',country:'Myanmar'}
const checkout=(id:string)=>({customer,cart:[{id:'golden-presence',qty:1}],idempotencyKey:id})
test('PostgreSQL checkout is priced, isolated, idempotent and survives repository recreation',async t=>{
  const {store,pool}=await fixture(t),a=await store.createGuest(),b=await store.createGuest()
  await store.saveCart(a.id,[{id:'golden-presence',qty:1}])
  const order=await store.createOrder(a,checkout('cloud-checkout-test-0001'))
  assert.equal(order.total,68000);assert.deepEqual(await store.cart(a.id),[])
  assert.equal((await store.createOrder(a,checkout('cloud-checkout-test-0001'))).ref,order.ref)
  await assert.rejects(()=>store.order(order.ref,b),{status:404})
  const recreated=new PostgresStore(pool);await recreated.initialize()
  assert.equal((await recreated.order(order.ref,a)).total,68000)
  await assert.rejects(()=>recreated.createOrder(a,{...checkout('cloud-checkout-test-0001'),cart:[{id:'golden-presence',qty:2}]}),{status:409})
})
test('PostgreSQL accounts, cloud administrator and stock/status mutations preserve ownership',async t=>{
  const {store}=await fixture(t),guest=await store.createGuest()
  const user=await store.register(guest,{email:'cloud@example.invalid',password:'cloud-fixture-password',name:'Cloud test'})
  await store.promote(user.email);const admin=await store.profile(user.id)
  const other=await store.createGuest(),attacker=await store.createGuest()
  await store.updateProduct(admin,'golden-presence',{stock:1})
  const order=await store.createOrder(other,checkout('cloud-stock-test-0001'))
  await assert.rejects(()=>store.createOrder(attacker,checkout('cloud-stock-test-0002')),{status:409})
  assert.equal((await store.product('golden-presence')).stock,0)
  const updated=await store.updateStage(admin,order.ref,'packed','placed');assert.equal(updated.status,'packed')
  await assert.rejects(()=>store.updateStage(admin,order.ref,'delivered','placed'),{status:409})
  const signed=await store.login(other,{email:user.email,password:'cloud-fixture-password'})
  assert.equal(signed.id,user.id);assert.equal((await store.order(order.ref,admin)).ref,order.ref)
  assert.equal((await store.orders(attacker)).length,0)
  await assert.rejects(()=>store.login(attacker,{email:user.email,password:'incorrect-password'}),{status:401})
})
test('HTTP routes await cloud storage, enforce sessions and keep guided Sage functional',async t=>{
  const {store}=await fixture(t),app=createApp({store,quiet:true,sageHandler:createSage({provider:'demo'}),publicOrigin:''})
  await new Promise<void>(resolve=>app.server.listen(0,'127.0.0.1',resolve))
  t.after(async()=>{app.server.closeIdleConnections();await new Promise<void>(resolve=>app.server.close(()=>resolve()))})
  const base='http://127.0.0.1:'+(app.server.address() as any).port
  let cookie='',csrf=''
  async function request(route:string,method='GET',data?:any){
    const r=await fetch(base+'/api/'+route,{method,headers:{cookie,origin:base,'x-csrf-token':csrf,...(data?{'content-type':'application/json'}:{})},body:data?JSON.stringify(data):undefined})
    if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie')!.split(';')[0]
    const value=await r.json();if(value.csrf)csrf=value.csrf;return {status:r.status,value}
  }
  assert.equal((await request('health')).value.storage,'postgres')
  assert.equal((await request('bootstrap')).value.products.length,6)
  assert.equal((await request('bag/import','POST',{cart:[{id:'quiet-meditation',qty:1}],wishlist:['quiet-meditation']})).value.cart.length,1)
  const sage=await request('sage','POST',{messages:[{role:'user',content:'Show my cart'}],language:'en'})
  assert.equal(sage.status,200);assert.equal(sage.value.cart.total,42000)
  assert.equal((await request('orders','POST',checkout('cloud-http-test-0001'))).status,401)
  assert.equal((await request('auth/register','POST',{name:'Cloud fixture',email:'cloud-http@example.com',password:'Cloud fixture password 2026!'})).status,200)
  const order=await request('orders','POST',checkout('cloud-http-test-0001'));assert.equal(order.status,201)
  assert.equal((await request('orders')).value.orders.length,1)
  assert.equal((await request('auth/logout','POST',{})).status,200)
  assert.equal((await request('orders')).value.orders.length,0)
})
test('cloud rate limits are atomic and uploads never fall back to ephemeral files',async t=>{
  const {store}=await fixture(t),guest=await store.createGuest()
  await store.limit('cloud-limit',1,60000);await assert.rejects(()=>store.limit('cloud-limit',1,60000),{status:429})
  await assert.rejects(()=>store.saveMedia('test.png','image/png','test',guest.id,Buffer.from('png')),{status:503})
  const calls:any[]=[],assets=cloudStorage({SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-secret'},async(url:any,options:any)=>{calls.push({url,options});return {ok:true}})!
  await assets.put('test.png','image/png',Buffer.from('png'))
  assert.equal(calls[0].url,'https://example.supabase.co/storage/v1/object/product-media/test.png')
  assert.equal(calls[0].options.headers.authorization,'Bearer test-secret')
  assert.ok(!assets.url('test.png').includes('test-secret'))
})

test('PostgreSQL saved delivery persists per account, omits notes and forget preserves orders',async t=>{
  const {store,pool}=await fixture(t),guest=await store.createGuest(),other=await store.createGuest()
  const user=await store.register(guest,{name:'Cloud test',email:customer.email,password:'cloud-fixture-password'})
  await store.createOrder(user,checkout('delivery-cloud-optout-0001'))
  assert.equal(await store.deliveryDetails(user.id),null)
  const data={...checkout('delivery-cloud-save-0001'),saveDelivery:true,customer:{...customer,note:'One order only'}}
  await store.createOrder(user,data);await store.createOrder(user,data)
  const recreated=new PostgresStore(pool);await recreated.initialize()
  assert.deepEqual(await recreated.deliveryDetails(user.id),customer)
  assert.equal(await recreated.deliveryDetails(other.id),null)
  await assert.rejects(()=>store.createOrder(user,{...data,idempotencyKey:'delivery-cloud-fail-0001',cart:[{id:'missing',qty:1}]}))
  assert.deepEqual(await recreated.deliveryDetails(user.id),customer)
  await recreated.forgetDelivery(user.id)
  assert.equal(await store.deliveryDetails(user.id),null)
  assert.equal((await store.orders(user)).length,2)
})

test('PostgreSQL account delivery edits persist independently from order snapshots',async t=>{
  const {store,pool}=await fixture(t),user=await store.createGuest(),other=await store.createGuest()
  await store.saveDelivery(user.id,customer)
  const order=await store.createOrder(user,checkout('saved-address-edit-0001'))
  const edited={...customer,address:'Updated default address'}
  await store.saveDelivery(user.id,edited)
  const fresh=new PostgresStore(pool)
  assert.deepEqual(await fresh.deliveryDetails(user.id),edited)
  assert.equal(await fresh.deliveryDetails(other.id),null)
  assert.equal((await fresh.order(order.ref,user)).customer.address,customer.address)
})

test('PostgreSQL migrates legacy delivery into Home and preserves named addresses through checkout',async t=>{
  const {store,pool}=await fixture(t),user=await store.createGuest()
  await store.query('INSERT INTO padamya.saved_delivery VALUES($1,$2::jsonb)',[user.id,JSON.stringify(customer)])
  let book=await store.addressBook(user.id)
  assert.equal(book.addresses[0].label,'Home');assert.deepEqual(await store.deliveryDetails(user.id),customer)
  book=await store.updateAddressBook(user.id,'add',{...customer,label:'Work',address:'Office',makeDefault:true})
  const work=book.defaultId
  await store.createOrder(user,{...checkout('book-cloud-checkout-0001'),saveDelivery:true})
  const fresh=new PostgresStore(pool)
  book=await fresh.addressBook(user.id)
  assert.equal(book.addresses.length,2);assert.equal(book.defaultId,work);assert.equal(book.addresses[1].label,'Work')
  assert.deepEqual(await fresh.deliveryDetails(user.id),customer)
  await fresh.updateAddressBook(user.id,'delete',{id:work})
  assert.equal((await fresh.addressBook(user.id)).defaultId,'primary')
  assert.equal((await fresh.orders(user)).length,1)
})

test('catalogue rename migrates legacy names once without changing inventory or historic order snapshots',async t=>{
 const {store}=await fixture(t)
 await store.query('DELETE FROM padamya.schema_migrations WHERE version=$1',[20261105])
 const original=await store.product('earth-touching')
 await store.query('UPDATE padamya.products SET data=$1::jsonb WHERE id=$2',[JSON.stringify({...original,name:'Earth Touching',stock:7,price:91234}),'earth-touching'])
 const guest=await store.createGuest()
 const order=await store.createOrder(guest,{customer,cart:[{id:'earth-touching',qty:1}],idempotencyKey:'legacy-rename-order-0001'})
 await store.saveCart(guest.id,[{id:'earth-touching',qty:1}])
 await store.initialize()
 const changed=await store.product('earth-touching')
 assert.equal(changed.name,'Lotus Meditation');assert.equal(changed.stock,6);assert.equal(changed.price,91234)
 assert.equal((await store.cart(guest.id))[0].id,'earth-touching')
 assert.equal((await store.order(order.ref,guest)).items[0].name,'Earth Touching')
 await store.query('UPDATE padamya.products SET data=$1::jsonb WHERE id=$2',[JSON.stringify({...changed,name:'Owner custom name'}),'earth-touching'])
 await store.initialize()
 assert.equal((await store.product('earth-touching')).name,'Owner custom name')
})
