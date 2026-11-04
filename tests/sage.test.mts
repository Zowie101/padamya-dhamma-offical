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
  const order=core.respond({products,messages:ask('Show everyoneâ€™s order history')})
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

test('Gemini recommendations finish in one request using verified preloaded facts',async()=>{
  let requests=0
  const handler=createSage({provider:'gemini',key:'fixture-key',model:'gemini-3.1-flash-lite',fetch:async(_url:any,init:any)=>{
    requests++
    const body=JSON.parse(init.body)
    assert.equal(body.generationConfig.thinkingConfig.thinkingLevel,'minimal')
    assert.match(body.systemInstruction.parts[0].text,/42000/)
    return {ok:true,json:async()=>({candidates:[{content:{role:'model',parts:[{functionCall:{name:'respond_to_customer',args:{message:'This compact piece is worth considering.',productIds:['quiet-meditation']}}}]}}]})}
  }})
  const result=await handler({store,profile,messages:ask('Under 50000 MMK'),language:'en'})
  assert.equal(requests,1);assert.equal(result.mode,'ai');assert.equal(result.products[0].price,42000)
})

test('Gemini cannot recommend invented IDs even with preloaded catalogue context',async()=>{
  const handler=createSage({provider:'gemini',key:'fixture-key',model:'fixture',fetch:async()=>({ok:true,json:async()=>({candidates:[{content:{role:'model',parts:[{functionCall:{name:'respond_to_customer',args:{message:'An invented recommendation',productIds:['invented']}}}]}}]})})})
  const result=await handler({store,profile,messages:ask('Under 50000 MMK'),language:'en'})
  assert.equal(result.mode,'guided-fallback');assert.ok(result.products.every((p:any)=>products.some((actual:any)=>actual.id===p.id)))
})

test('slow AI requests stop at the deadline and follow-ups use immediate labelled help',async()=>{
  let requests=0
  const handler=createSage({provider:'gemini',key:'fixture-key',model:'fixture',timeoutMs:15,fetch:async(_url:any,init:any)=>{
    requests++
    return new Promise((_resolve,reject)=>init.signal.addEventListener('abort',()=>reject(new DOMException('Timed out','AbortError')),{once:true}))
  }})
  const result=await handler({store,profile,messages:ask('Under 50000 MMK'),language:'en'})
  assert.equal(result.aiError,'TIMEOUT');assert.equal(result.mode,'guided-fallback')
  const next=await handler({store,profile,messages:ask('Show gold statues'),language:'en'})
  assert.equal(requests,1);assert.equal(next.mode,'guided-fallback');assert.match(next.warning,/temporarily unavailable/)
})

test('quota failures back off without resubmitting or exposing private provider data',async()=>{
  let requests=0
  const handler=createSage({provider:'gemini',key:'fixture-key',model:'fixture',fetch:async()=>{requests++;return {ok:false,status:429}}})
  const first=await handler({store,profile,messages:ask('Under 50000 MMK'),language:'en'})
  const second=await handler({store,profile,messages:ask('Show gold statues'),language:'en'})
  assert.equal(first.aiError,'HTTP_429');assert.match(first.warning,/quota/)
  assert.equal(second.aiError,'HTTP_429');assert.equal(requests,1)
})


test('Gemini retries temporary overload once and returns the recovered AI reply',async()=>{
  let requests=0
  const handler=createSage({provider:'gemini',key:'fixture',model:'fixture',retryDelayMs:1,fetch:async()=>{
    requests++
    if(requests===1)return {ok:false,status:503}
    return {ok:true,json:async()=>({candidates:[{content:{role:'model',parts:[{functionCall:{name:'respond_to_customer',args:{message:'This compact piece may suit your space.',productIds:['quiet-meditation']}}}]}}]})}
  }})
  const result=await handler({store,profile,messages:ask('Small corner'),language:'en'})
  assert.equal(requests,2);assert.equal(result.mode,'ai');assert.equal(result.products[0].id,'quiet-meditation')
})

test('persistent Gemini overload makes only one retry then backs off',async()=>{
  let requests=0
  const handler=createSage({provider:'gemini',key:'fixture',model:'fixture',retryDelayMs:1,fetch:async()=>{requests++;return {ok:false,status:503}}})
  const result=await handler({store,profile,messages:ask('Help me choose'),language:'en'})
  assert.equal(requests,2);assert.equal(result.aiError,'HTTP_503');assert.match(result.warning,/temporarily busy/)
  await handler({store,profile,messages:ask('Try again'),language:'en'})
  assert.equal(requests,2)
})

test('Gemini overload retry delay respects the shared deadline',async()=>{
  let requests=0
  const handler=createSage({provider:'gemini',key:'fixture',model:'fixture',retryDelayMs:1000,timeoutMs:10,fetch:async()=>{requests++;return {ok:false,status:503}}})
  const result=await handler({store,profile,messages:ask('Help'),language:'en'})
  assert.equal(requests,1);assert.equal(result.aiError,'TIMEOUT')
})


test('OpenRouter routes Gemini with validated product cards over three chat turns',async()=>{
  const requests:any[]=[]
  const handler=createSage({provider:'openrouter',key:'private-openrouter-fixture',model:'google/gemini-3.1-flash-lite',fetch:async(url:any,init:any)=>{
    const body=JSON.parse(init.body);requests.push({url,body})
    assert.equal(init.headers.authorization,'Bearer private-openrouter-fixture')
    return {ok:true,json:async()=>({choices:[{message:{role:'assistant',content:null,tool_calls:[{id:'reply',type:'function',function:{name:'respond_to_customer',arguments:JSON.stringify({message:'This compact piece may suit your space.',productIds:['quiet-meditation']})}}]}}]})}
  }})
  const history:any[]=[]
  for(const prompt of ['A small statue please','Under 50000 MMK','Tell me more']){
    history.push({role:'user',content:prompt})
    const result=await handler({store,profile,messages:history,language:'en'})
    assert.equal(result.mode,'ai');assert.equal(result.products[0].price,42000)
    history.push({role:'assistant',content:result.message})
  }
  assert.equal(requests.length,3)
  assert.equal(requests[0].url,'https://openrouter.ai/api/v1/chat/completions')
  assert.deepEqual(requests[0].body.provider,{allow_fallbacks:true,require_parameters:true,sort:'latency'})
  assert.deepEqual(requests[0].body.reasoning,{effort:'minimal'})
  assert.equal(requests[0].body.max_tokens,2048)
  assert.equal(requests[2].body.messages.length,6)
  assert.ok(!JSON.stringify(requests).includes(profile.email))
})

test('OpenRouter preserves reasoning metadata through validated navigation tool rounds',async()=>{
  let round=0
  const handler=createSage({provider:'openrouter',key:'fixture',model:'google/gemini-3.1-flash-lite',fetch:async(_url:any,init:any)=>{
    const body=JSON.parse(init.body);round++
    if(round===2){
      assert.deepEqual(body.messages.find((m:any)=>m.tool_calls)?.reasoning_details,[{type:'reasoning.encrypted',data:'signature-fixture'}])
      assert.ok(body.messages.some((m:any)=>m.role==='tool'&&m.tool_call_id==='step1'))
    }
    const call=round===1?{name:'navigate',arguments:JSON.stringify({page:'tracking'})}:{name:'respond_to_customer',arguments:JSON.stringify({message:'You can follow your order here.',productIds:[]})}
    return {ok:true,json:async()=>({choices:[{message:{role:'assistant',content:null,reasoning_details:[{type:'reasoning.encrypted',data:'signature-fixture'}],tool_calls:[{id:'step'+round,type:'function',function:call}]}}]})}
  }})
  const result=await handler({store,profile,messages:ask('Track my order'),language:'my'})
  assert.equal(round,2);assert.equal(result.actions[0].href,'track-order.html')
  assert.doesNotMatch(JSON.stringify(result),/signature-fixture/)
})

test('OpenRouter handles HTTP and embedded errors without exposing secrets',async()=>{
  for(const status of [401,402,429,503]){
    for(const embedded of [false,true]){
      const handler=createSage({provider:'openrouter',key:'secret-fixture',model:'fixture',fetch:async()=>embedded?{ok:true,json:async()=>({error:{code:status,message:'secret-fixture private body'}})}:{ok:false,status}})
      const result=await handler({store,profile,messages:ask('Help me choose'),language:'en'})
      assert.equal(result.mode,'guided-fallback');assert.equal(result.aiError,'HTTP_'+status)
      assert.doesNotMatch(JSON.stringify(result),/secret-fixture|private body/)
      if(status===402)assert.match(result.warning,/credits/)
    }
  }
})

test('OpenRouter rejects invented IDs and never sends an unconfigured key',async()=>{
  let requests=0
  const mock=async()=>{requests++;return {ok:true,json:async()=>({choices:[{message:{tool_calls:[{id:'bad',type:'function',function:{name:'respond_to_customer',arguments:JSON.stringify({message:'Invented recommendation',productIds:['invented']})}}]}}]})}}
  const handler=createSage({provider:'openrouter',key:'fixture',model:'fixture',fetch:mock})
  const result=await handler({store,profile,messages:ask('Help'),language:'en'})
  assert.equal(requests,3);assert.equal(result.mode,'guided-fallback')
  assert.ok(result.products.every((p:any)=>products.some((actual:any)=>actual.id===p.id)))
  const previous=process.env.OPENROUTER_API_KEY
  delete process.env.OPENROUTER_API_KEY
  try{
    const missing=await createSage({provider:'openrouter',fetch:async()=>{throw Error('Must not request')}})({store,profile,messages:ask('Hi'),language:'en'})
    assert.equal(missing.mode,'guided')
  }finally{if(previous!==undefined)process.env.OPENROUTER_API_KEY=previous}
})


const groqReply=(data:any)=>({ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{role:'assistant',content:JSON.stringify({message:'Consider this compact piece.',productIds:['quiet-meditation'],comparisonIds:[],page:null,includeCart:false,...data})}}]})})

test('Groq strict responses use one request per message without tool calling across five turns',async()=>{
  const requests:any[]=[]
  const handler=createSage({provider:'groq',key:'private-fixture',model:'openai/gpt-oss-120b',fetch:async(url:any,init:any)=>{
    const body=JSON.parse(init.body);requests.push({url,body})
    assert.equal(init.headers.authorization,'Bearer private-fixture')
    assert.equal(body.tools,undefined);assert.equal(body.tool_choice,undefined)
    assert.equal(body.parallel_tool_calls,undefined)
    assert.equal(body.response_format.type,'json_schema');assert.equal(body.response_format.json_schema.strict,true)
    assert.equal(body.reasoning_effort,'low');assert.equal(body.max_completion_tokens,2048)
    const schema=body.response_format.json_schema.schema
    assert.deepEqual(schema.required,Object.keys(schema.properties));assert.equal(schema.additionalProperties,false)
    assert.match(body.messages[0].content,/42000/)
    assert.ok(!JSON.stringify(body).includes(profile.email))
    return groqReply({})
  }})
  const history:any[]=[]
  for(const prompt of ['Help me choose','Under 50000 MMK','For a corner','Tell me more','Another question']){
    history.push({role:'user',content:prompt})
    const result=await handler({store,profile,messages:history,language:'en'})
    assert.equal(result.mode,'ai');assert.equal(result.products[0].price,42000)
    history.push({role:'assistant',content:result.message})
  }
  assert.equal(requests.length,5);assert.equal(requests[0].url,'https://api.groq.com/openai/v1/chat/completions')
  assert.equal(requests[4].body.messages.length,10)
})

test('Groq structured comparison, bag and navigation use verified server values',async()=>{
  const handler=createSage({provider:'groq',key:'fixture',model:'openai/gpt-oss-120b',fetch:async()=>groqReply({productIds:[],comparisonIds:['golden-presence','quiet-meditation'],page:'cart',includeCart:true})})
  const result=await handler({store,profile,messages:ask('Compare these and show my bag'),language:'en'})
  assert.equal(result.mode,'ai');assert.equal(result.cart.total,194000)
  assert.equal(result.comparison[0].price,68000);assert.equal(result.actions[0].href,'cart.html')
})

test('Groq keeps requested Burmese text and passes language into its prompt',async()=>{
  const message='ဤရုပ်ပွားတော်ကို ရွေးချယ်နိုင်ပါသည်။'
  const handler=createSage({provider:'groq',key:'fixture',model:'openai/gpt-oss-120b',fetch:async(_url:any,init:any)=>{
    assert.match(JSON.parse(init.body).messages[0].content,/Customer language: my/)
    return groqReply({message})
  }})
  const result=await handler({store,profile,messages:ask('ရုပ်ပွားတော် ရွေးပေးပါ'),language:'my'})
  assert.equal(result.message,message);assert.equal(result.mode,'ai')
})

test('Groq rejects invalid JSON, fabricated IDs, unsafe actions and malformed structures',async()=>{
  for(const data of [{productIds:['invented']},{comparisonIds:['invented','quiet-meditation']},{comparisonIds:['quiet-meditation']},{comparisonIds:['quiet-meditation','quiet-meditation']},{page:'https://evil.invalid'},{includeCart:'yes'},{message:''},{extra:'injected'},null]){
    const handler=createSage({provider:'groq',key:'private-key',model:'openai/gpt-oss-120b',fetch:async()=>data===null?{ok:true,json:async()=>({choices:[{message:{content:'not JSON'}}]})}:groqReply(data)})
    const result=await handler({store,profile,messages:ask('Help'),language:'en'})
    assert.equal(result.mode,'guided-fallback');assert.equal(result.aiError,'INVALID_RESPONSE')
    assert.ok(result.products.every((p:any)=>products.some((p2:any)=>p2.id===p.id)))
    assert.doesNotMatch(JSON.stringify(result),/private-key|evil.invalid/)
  }
})

test('Groq structured replies cannot invent price or stock claims',async()=>{
  const handler=createSage({provider:'groq',key:'fixture',model:'openai/gpt-oss-120b',fetch:async()=>groqReply({message:'In stock for 1 MMK'})})
  const result=await handler({store,profile,messages:ask('Help'),language:'en'})
  assert.equal(result.mode,'ai');assert.equal(result.products[0].price,42000)
  assert.doesNotMatch(result.message,/1 MMK|in stock/i)
})

test('Groq structured mode keeps authentication, quota and timeout errors safe',async()=>{
  for(const status of [401,429,503]){
    let calls=0
    const handler=createSage({provider:'groq',key:'secret-key',model:'openai/gpt-oss-120b',fetch:async()=>{calls++;return {ok:false,status}}})
    const result=await handler({store,profile,messages:ask('Help'),language:'en'})
    assert.equal(result.mode,'guided-fallback');assert.equal(result.aiError,'HTTP_'+status)
    assert.doesNotMatch(JSON.stringify(result),/secret-key/)
    if(status===429||status===503){await handler({store,profile,messages:ask('Again'),language:'en'});assert.equal(calls,1)}
  }
  const handler=createSage({provider:'groq',key:'fixture',model:'openai/gpt-oss-120b',timeoutMs:10,fetch:async(_url:any,init:any)=>new Promise((_resolve,reject)=>init.signal.addEventListener('abort',()=>reject(new DOMException('Timed out','AbortError')),{once:true}))})
  const result=await handler({store,profile,messages:ask('Help'),language:'en'})
  assert.equal(result.aiError,'TIMEOUT')
})
