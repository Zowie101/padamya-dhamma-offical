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
