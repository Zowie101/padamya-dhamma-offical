const {test}=require('node:test')
const assert=require('node:assert/strict')
const vm=require('node:vm')
const fs=require('node:fs')
const source=fs.readFileSync('assets/js/app.js','utf8')
const helper=source.slice(source.indexOf('async function initDeliveryDetails('),source.indexOf('function initCheckout()'))
test('checkout prefills account defaults without overwriting edits',async()=>{
  const fields=Object.fromEntries(['name','phone','email','address','city','country','saveDelivery'].map(name=>[name,{value:'',checked:true}]))
  const listeners={},message={textContent:''},forget={hidden:true,addEventListener(type,fn){this.click=fn}},requests=[]
  let resolve
  const pending=new Promise(done=>resolve=done)
  const form={querySelector:s=>s.includes('status')?message:forget,elements:{namedItem:name=>fields[name]},addEventListener:(type,fn)=>listeners[type]=fn}
  const store={enabled:true,profile:{name:'Account name',email:'account@example.test'},request:async(route,method)=>{requests.push({route,method});return method==='DELETE'?{details:null}:pending}}
  const context=vm.createContext({window:{SacredStore:store}})
  vm.runInContext(helper+';this.initialize=initDeliveryDetails',context)
  const loading=context.initialize(form)
  assert.equal(fields.name.value,'Account name')
  fields.address.value='Newly typed address';listeners.input({target:{name:'address'}})
  resolve({details:{name:'Saved name',phone:'123',address:'Previous address',city:'Yangon',country:'Myanmar'}})
  await loading
  assert.equal(fields.address.value,'Newly typed address');assert.equal(fields.name.value,'Saved name');assert.equal(fields.phone.value,'123')

})
test('saved delivery loading failure keeps checkout usable',async()=>{
  const message={textContent:''},fields={name:{},email:{}},forget={addEventListener(){}}
  const form={querySelector:s=>s.includes('status')?message:forget,elements:{namedItem:name=>fields[name]},addEventListener(){}}
  const context=vm.createContext({window:{SacredStore:{enabled:true,profile:{name:'Account'},request:async()=>{throw Error('Offline')}}}})
  vm.runInContext(helper+';this.initialize=initDeliveryDetails',context)
  await context.initialize(form)
  assert.equal(fields.name.value,'Account');assert.match(message.textContent,/could not be loaded/)
})

test('checkout has no forget action; account includes an editable delivery form',()=>{assert.doesNotMatch(source,/data-forget-delivery/);const account=fs.readFileSync('assets/js/account.js','utf8');assert.match(account,/accountDeliveryForm/);assert.match(account,/store.request\('account\/addresses'/)})
