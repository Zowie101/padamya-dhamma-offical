import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import core from '../assets/js/sage-core.js'
import { createSage,createTools } from '../server/sage.mts'
const products=JSON.parse(fs.readFileSync(new URL('../server/data/catalogue.json',import.meta.url),'utf8'))
const ask=(content:string)=>[{role:'user',content}]
const store={products:()=>products,product:(id:string)=>products.find((p:any)=>p.id===id),cart:()=>[{id:'quiet-meditation',qty:3},{id:'golden-presence',qty:1}]}
const profile={id:'fixture',email:'private-fixture@example.invalid'}
test('guided budget, rooms, finishes and gifts use only actual catalogue details',()=>{
  const response=core.respond({products,messages:ask('Show statues under 50000 MMK')})
  assert.deepEqual(response.products.map((p:any)=>p.price),[36000,42000]);assert.ok(response.products.every((p:any)=>p.stock===null))
  const dollars=core.respond({products,messages:ask('Find me a Buddha statue under $100')})
  assert.equal(dollars.products.length,0);assert.match(dollars.message,/MMK/)
  assert.ok(core.respond({products,messages:ask('For a small meditation corner')}).products.every((p:any)=>parseFloat(p.height)<=20))
  assert.ok(core.respond({products,messages:ask('Show golden Buddha statues')}).products.every((p:any)=>p.material.toLowerCase().includes('gold')))
  assert.ok(core.respond({products,messages:ask('I want a gift for my parents')}).products.every((p:any)=>p.category==='Meaningful Gifts'))
  const noStock=products.map((p:any)=>({...p,stock:0}));assert.equal(core.search(noStock).length,0)
})
test('comparison and bag totals are grounded; order help exposes no private orders',()=>{
  const comparison=core.respond({products,messages:ask('Compare Golden Presence and Quiet Meditation')})
  assert.deepEqual(comparison.comparison.map((p:any)=>p.price),[68000,42000])
  const cart=core.respond({products,messages:ask('Show my cart'),cart:store.cart()})
  assert.equal(cart.cart.total,194000);assert.equal(cart.actions[1].href,'checkout.html')
  const order=core.respond({products,messages:ask('Show everyone’s order history')})
  assert.equal(order.actions[0].href,'track-order.html');assert.equal(order.cart,undefined)
})
test('tools reject invented IDs, unsafe navigation, hidden orders and unsearched recommendations',()=>{
  const tools=createTools(store,profile)
  assert.throws(()=>tools.execute('get_all_orders',{}))
  assert.throws(()=>tools.execute('navigate',{page:'https://untrusted.example'}))
  assert.throws(()=>tools.execute('compare_products',{ids:['invented','golden-presence']}))
  assert.throws(()=>tools.execute('respond_to_customer',{message:'Buy it',productIds:['golden-presence']}))
  tools.execute('search_products',{maxPriceMMK:50000})
  tools.execute('respond_to_customer',{message:'These are in stock at 1 MMK',productIds:['quiet-meditation']})
  assert.equal(tools.state.products[0].price,42000);assert.doesNotMatch(tools.state.message,/1 MMK|in stock/)
})
test('Gemini function loop validates results without including private customer records',async()=>{
  const requests:any[]=[]
  const mock=async(url:string,init:any)=>{
    requests.push({url,body:JSON.parse(init.body),headers:init.headers})
    const call=requests.length===1?{name:'search_products',args:{maxPriceMMK:50000}}:{name:'respond_to_customer',args:{message:'These are compact options to consider.',productIds:['quiet-meditation']}}
    return {ok:true,json:async()=>({candidates:[{content:{role:'model',parts:[{functionCall:call,thoughtSignature:'fixture-signature'}]}}]})}
  }
  const response=await createSage({provider:'gemini',key:'fixture-key',model:'fixture-model',fetch:mock})({store,profile,messages:ask('Under 50000 MMK'),language:'en'})
  assert.equal(response.mode,'ai');assert.equal(response.products[0].price,42000)
  assert.equal(requests.length,2);assert.equal(requests[0].headers['x-goog-api-key'],'fixture-key')
  assert.ok(!JSON.stringify(requests).includes(profile.email));assert.match(JSON.stringify(requests[1].body),/fixture-signature/)
})
test('OpenAI tools work with Responses; API failures use a labelled guided fallback',async()=>{
  let round=0
  const mock=async()=>({ok:true,json:async()=>({output:[{type:'function_call',call_id:'fixture-'+round,name:round++===0?'search_products':'respond_to_customer',arguments:round===1?JSON.stringify({color:'gold'}):JSON.stringify({message:'Here are the listed finishes.',productIds:['golden-presence']})}]})})
  const response=await createSage({provider:'openai',key:'fixture-key',model:'fixture-model',fetch:mock})({store,profile,messages:ask('Show gold statues'),language:'en'})
  assert.equal(response.mode,'ai');assert.equal(response.products[0].id,'golden-presence')
  const failed=await createSage({provider:'gemini',key:'fixture-key',model:'fixture-model',fetch:async()=>({ok:false})})({store,profile,messages:ask('Under 50000 MMK'),language:'en'})
  assert.equal(failed.mode,'guided-fallback');assert.match(failed.warning,/could not respond/)
})

test('NVIDIA Chat Completions preserves tool history and returns verified catalogue cards',async()=>{
  const requests:any[]=[]
  const mock=async(url:string,init:any)=>{
    const body=JSON.parse(init.body);requests.push({url,body,headers:init.headers})
    const first=requests.length===1
    return {ok:true,json:async()=>({choices:[{message:{role:'assistant',content:null,reasoning_content:'provider fixture metadata',tool_calls:[{id:'fixture-'+requests.length,type:'function',function:{name:first?'search_products':'respond_to_customer',arguments:JSON.stringify(first?{maxPriceMMK:50000}:{message:'These pieces suit your budget.',productIds:['quiet-meditation']})}}]}}]})}
  }
  const response=await createSage({provider:'nvidia',key:'fixture-nvidia-key',model:'deepseek-ai/deepseek-v4.1-flash',fetch:mock})({store,profile,messages:ask('Under 50000 MMK'),language:'en'})
  assert.equal(response.mode,'ai');assert.equal(response.products[0].price,42000)
  assert.equal(requests.length,2)
  assert.equal(requests[0].url,'https://integrate.api.nvidia.com/v1/chat/completions')
  assert.equal(requests[0].headers.authorization,'Bearer fixture-nvidia-key')
  assert.equal(requests[0].body.stream,false)
  assert.equal(requests[0].body.tools[0].function.name,'search_products')
  const tool=requests[1].body.messages.find((m:any)=>m.role==='tool')
  assert.equal(tool.tool_call_id,'fixture-1');assert.match(tool.content,/quiet-meditation/)
  assert.equal(requests[1].body.messages.find((m:any)=>m.tool_calls)?.reasoning_content,'provider fixture metadata')
  assert.ok(!JSON.stringify(requests).includes(profile.email))
})

test('NVIDIA errors and invalid tool responses fall back without exposing keys or invented products',async()=>{
  for(const mock of [async()=>({ok:false}),async()=>({ok:true,json:async()=>({choices:[{message:{content:'Invented item for 1 MMK'}}]})}),async()=>({ok:true,json:async()=>({choices:[{message:{tool_calls:[{id:'bad',type:'function',function:{name:'respond_to_customer',arguments:JSON.stringify({message:'Buy this',productIds:['invented']})}}]}}]})})]){
    const response=await createSage({provider:'nvidia',key:'fixture-private-key',model:'fixture',fetch:mock})({store,profile,messages:ask('Under 50000 MMK'),language:'en'})
    assert.equal(response.mode,'guided-fallback')
    assert.ok(response.products.every((p:any)=>products.some((actual:any)=>actual.id===p.id)))
    assert.ok(!JSON.stringify(response).includes('fixture-private-key'))
  }
})

test('Gemini failures expose a safe status code without provider body or API key',async()=>{
  const result=await createSage({provider:'gemini',key:'private-test-key',model:'test',fetch:async()=>({ok:false,status:404,json:async()=>({error:{message:'private-test-key confidential body'}})})})({store,profile,messages:ask('Show gold statues'),language:'en'})
  assert.equal(result.mode,'guided-fallback');assert.equal(result.aiError,'HTTP_404')
  assert.doesNotMatch(JSON.stringify(result),/private-test-key|confidential body/)
})
