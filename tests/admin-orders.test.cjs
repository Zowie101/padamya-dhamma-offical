const {test}=require('node:test')
const assert=require('node:assert/strict')
const factory=require('../assets/js/orders.js')
const {webcrypto}=require('node:crypto')
function setup(){
  const data=new Map(), storage={getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)}
  const api=factory(storage,webcrypto)
  const order=api.create({name:'Customer',email:'customer@example.com',address:'Yangon'},[{id:'piece',qty:2}],[{id:'piece',name:'Statue',price:42000,image:'assets/images/test.png',height:'18 cm'}])
  return {api,order,data,storage}
}
test('demo admin explicitly moves each stage and preserves order and customer details',()=>{
  const {api,order}=setup()
  for(const stage of api.stages.slice(1)){
    const before=api.lookupLocal(order.ref)
    const updated=api.setDemoStage(order.ref,stage.id,true,before.status)
    assert.equal(updated.status,stage.id)
    assert.deepEqual(updated.items,order.items);assert.deepEqual(updated.customer,order.customer)
    assert.equal(updated.total,order.total);assert.equal(updated.createdAt,order.createdAt)
    assert.equal(updated.adminEvents.at(-1).from,before.status)
    assert.equal(updated.adminEvents.at(-1).to,stage.id)
    assert.ok(Number.isFinite(Date.parse(updated.adminEvents.at(-1).at)))
    assert.equal(updated.simulated,true)
    assert.equal(api.lookup(order.ref,order.customer.email).status,stage.id)
  }
  assert.equal(api.lookupLocal(order.ref).history.length,5)
  assert.equal(api.localHistory('delivered').length,1)
})
test('jumping forward and correcting backward keeps an audit and coherent timeline',()=>{
  const {api,order}=setup()
  let updated=api.setDemoStage(order.ref,'delivered',true,'placed')
  assert.deepEqual(updated.history.map(event=>event.status),api.stages.map(stage=>stage.id))
  assert.ok(updated.delivery.shippedAt)
  updated=api.setDemoStage(order.ref,'confirmed',true,'delivered')
  assert.deepEqual(updated.history.map(event=>event.status),['placed','confirmed'])
  assert.equal(updated.delivery.shippedAt,null)
  assert.equal(updated.adminEvents.at(-1).previousHistory.length,5)
  assert.equal(updated.adminEvents.length,2)
  assert.equal(updated.delivery.trackingNumber,undefined)
  assert.equal(updated.delivery.trackingUrl,undefined)
  api.setDemoStage(order.ref,'confirmed',true,'confirmed')
  assert.equal(api.lookupLocal(order.ref).adminEvents.length,2,'same stage is a no-op')
})
test('invalid, disabled, stale or failed updates never alter stored orders',()=>{
  const {api,order,data,storage}=setup()
  const original=data.get('sacredFormOrders_v1')
  assert.throws(()=>api.setDemoStage(order.ref,'packed',false),/disabled/)
  assert.throws(()=>api.setDemoStage(order.ref,'unknown',true),/valid/)
  assert.throws(()=>api.setDemoStage('missing','packed',true),/available/)
  assert.throws(()=>api.setDemoStage(order.ref,'packed',true,'delivered'),/another tab/)
  assert.equal(data.get('sacredFormOrders_v1'),original)
  storage.setItem=()=>{throw new Error('Storage full')}
  assert.throws(()=>api.setDemoStage(order.ref,'packed',true,'placed'),/Storage full/)
  assert.equal(data.get('sacredFormOrders_v1'),original)
})
