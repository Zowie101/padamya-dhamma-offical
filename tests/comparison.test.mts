import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {comparisonSchema,createComparison,jpegSize} from '../server/comparison.mts'
import {createApp} from '../server/http.mts'
import {openDatabase} from '../server/database.mts'
const products=JSON.parse(fs.readFileSync(new URL('../server/data/catalogue.json',import.meta.url),'utf8'))
// Header fixture for validation; real image decoding is left to the image service.
function image(width=256,height=256){const b=Buffer.alloc(110);b[0]=255;b[1]=216;b[2]=255;b[3]=192;b.writeUInt16BE(17,4);b[6]=8;b.writeUInt16BE(height,7);b.writeUInt16BE(width,9);b[108]=255;b[109]=217;return b.toString('base64')}
const data={ids:['golden-presence','quiet-meditation'],photo:image(),consent:true,height:20,preference:'calm',language:'en'}
const analysis=()=>({sceneVisible:true,quality:'clear',observation:'A warm wall above a simple wooden shelf.',caution:'Check actual shelf measurements.',evaluations:data.ids.map((id,index)=>({id,palette:index?14:20,contrast:index?10:15,composition:index?13:20,paletteReason:'The finish echoes the wall.',contrastReason:'The silhouette contrasts with the wall.',compositionReason:'The seated shape suits this simple setting.'}))})
const store={products:()=>products}
const mock=(args:any)=>async()=>({ok:true,json:async()=>({candidates:[{content:{parts:[{functionCall:{name:'submit_comparison',args}}]}}]})})
test('photo consent, different IDs and bounded JPEG dimensions are required',()=>{
  assert.equal(comparisonSchema.safeParse(data).success,true)
  assert.equal(comparisonSchema.safeParse({...data,consent:false}).success,false)
  assert.equal(comparisonSchema.safeParse({...data,ids:['same','same']}).success,false)
  assert.throws(()=>jpegSize(Buffer.from('not a photo')),{status:400})
  assert.throws(()=>jpegSize(Buffer.from(image(3000),'base64')),{status:400})
})
test('AI uses the actual products and server height checks override visual scores',async()=>{
  let request:any
  const run=createComparison({key:'private-fixture-key',model:'test',fetch:async(url:any,init:any)=>{request=JSON.parse(init.body);return mock(analysis())()}})
  const result=await run({store,data})
  assert.equal(result.mode,'ai');assert.equal(result.pair[0].fits,false);assert.equal(result.pair[1].fits,true)
  assert.equal(result.pair[0].criteria[0].points,0);assert.equal(result.pair[0].id,'golden-presence')
  assert.equal(request.contents[0].parts.filter((p:any)=>p.inlineData).length,3)
  assert.doesNotMatch(JSON.stringify(result),/private-fixture-key|data:image|base64/)
})
test('invented IDs, duplicate evaluations, out-of-range scores and unclear scenes fail safely',async()=>{
  for(const mutate of [(a:any)=>{a.evaluations[0].id='invented'},(a:any)=>{a.evaluations[0].id=a.evaluations[1].id},(a:any)=>{a.evaluations[0].palette=999},(a:any)=>{a.sceneVisible=false}]){
    const a=analysis();mutate(a)
    await assert.rejects(()=>createComparison({key:'private',model:'test',fetch:mock(a)})({store,data}))
  }
  await assert.rejects(()=>createComparison({key:'private',model:'test',fetch:mock(analysis())})({store,data:{...data,ids:['invented','quiet-meditation']}}),{status:400})
})
test('unavailable AI falls back through a generic error and never exposes provider response bodies',async()=>{
  await assert.rejects(()=>createComparison({key:'private-fixture-key',model:'test',fetch:async()=>({ok:false,status:503,json:async()=>({secret:'private-fixture-key'})})})({store,data}),{status:503,message:'AI comparison could not finish. Try again or use the on-device comparison.'})
})
test('comparison endpoint requires consent and CSRF before invoking vision analysis',async t=>{
  let calls=0;const db=openDatabase(':memory:'),app=createApp({db,quiet:true,comparisonHandler:async()=>{calls++;return {mode:'ai',pair:[]}}})
  await new Promise<void>(resolve=>app.server.listen(0,'127.0.0.1',resolve))
  t.after(async()=>{app.server.closeIdleConnections();await new Promise<void>(resolve=>app.server.close(()=>resolve()));db.close()})
  const base='http://127.0.0.1:'+(app.server.address() as any).port,b=await fetch(base+'/api/bootstrap'),boot=await b.json(),cookie=b.headers.get('set-cookie')!.split(';')[0]
  const post=(body:any,csrf=boot.csrf)=>fetch(base+'/api/comparison',{method:'POST',headers:{cookie,origin:base,'x-csrf-token':csrf,'content-type':'application/json'},body:JSON.stringify(body)})
  assert.equal((await post(data,'wrong')).status,403)
  assert.equal((await post({...data,consent:false})).status,400)
  assert.equal(calls,0)
  assert.equal((await post(data)).status,200);assert.equal(calls,1)
})

test('OpenRouter vision sends the room plus two references and validates structured results',async()=>{
 let request:any,endpoint:any,headers:any
 const result=await createComparison({provider:'openrouter',key:'router-fixture-key',model:'google/gemini-3.1-flash-lite',fetch:async(url:any,init:any)=>{
 endpoint=url;headers=init.headers;request=JSON.parse(init.body)
 return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(analysis())}}]})}
 }})({store,data:{...data,language:'my'}})
 assert.equal(endpoint,'https://openrouter.ai/api/v1/chat/completions');assert.equal(headers.authorization,'Bearer router-fixture-key')
 const parts=request.messages[0].content
 assert.equal(parts.filter((p:any)=>p.type==='image_url').length,3)
 assert.ok(parts.find((p:any)=>p.type==='image_url').image_url.url.startsWith('data:image/jpeg;base64,'))
 assert.match(parts[0].text,/Burmese/);assert.match(parts[0].text,/golden-presence/);assert.ok(!parts[0].text.includes('Return submit_comparison'))
 assert.equal(request.response_format.type,'json_schema');assert.equal(request.response_format.json_schema.schema.additionalProperties,false)
 assert.equal(request.response_format.json_schema.schema.properties.evaluations.items.additionalProperties,false)
 assert.equal(request.provider.require_parameters,true);assert.equal(result.mode,'ai');assert.equal(result.pair[0].fits,false)
 assert.doesNotMatch(JSON.stringify(result),/router-fixture-key|base64|data:image/)
})
test('OpenRouter rejects malformed, truncated and unsafe results and provider failures safely',async()=>{
 const bad=analysis();bad.evaluations[0].id='invented'
 const duplicate=analysis();duplicate.evaluations[0].id=duplicate.evaluations[1].id
 const range=analysis();range.evaluations[0].palette=100
 const cases=[{choices:[{message:{content:'not JSON'}}]},{choices:[{message:{content:JSON.stringify(bad)}}]},{choices:[{message:{content:JSON.stringify(duplicate)}}]},{choices:[{message:{content:JSON.stringify(range)}}]},{choices:[{finish_reason:'length',message:{content:JSON.stringify(analysis())}}]},{error:{code:429,message:'router-fixture-key'}}]
 for(const payload of cases)await assert.rejects(()=>createComparison({provider:'openrouter',key:'router-fixture-key',model:'test',fetch:async()=>({ok:true,json:async()=>payload})})({store,data}),{status:503,message:'AI comparison could not finish. Try again or use the on-device comparison.'})
 for(const status of [401,402,429,503])await assert.rejects(()=>createComparison({provider:'openrouter',key:'router-fixture-key',model:'test',fetch:async()=>({ok:false,status,json:async()=>({error:{message:'router-fixture-key'}})})})({store,data}),{status:503})
 const unclear={...analysis(),sceneVisible:false}
 await assert.rejects(()=>createComparison({provider:'openrouter',key:'fixture',model:'test',fetch:async()=>({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(unclear)}}]})})})({store,data}),{status:422})
})
test('comparison provider follows OpenRouter without requiring a direct Google key',async()=>{
 const {comparisonConfig}=await import('../server/comparison.mts')
 const env={SAGE_PROVIDER:'openrouter',OPENROUTER_API_KEY:' router-only ',OPENROUTER_MODEL:'google/gemini-3.1-flash-lite',COMPARISON_MODEL:'old-direct-gemini'}
 assert.deepEqual(comparisonConfig({},env),{provider:'openrouter',key:'router-only',model:'google/gemini-3.1-flash-lite'})
 assert.equal(comparisonConfig({},{...env,OPENROUTER_COMPARISON_MODEL:'google/other-vision'}).model,'google/other-vision')
 assert.deepEqual(comparisonConfig({},{...env,COMPARISON_PROVIDER:'gemini',GEMINI_API_KEY:'direct-key'}),{provider:'gemini',key:'direct-key',model:'old-direct-gemini'})
 assert.equal(comparisonConfig({},{SAGE_PROVIDER:'groq'}).provider,'gemini')
})
test('OpenRouter comparison timeout is bounded and does not return image data',async()=>{
 await assert.rejects(()=>createComparison({provider:'openrouter',key:'fixture',model:'test',timeoutMs:10,fetch:async(_url:any,init:any)=>new Promise((_resolve,reject)=>{const hold=setTimeout(()=>reject(Error('too slow')),100);init.signal.addEventListener('abort',()=>{clearTimeout(hold);reject(init.signal.reason)},{once:true})})})({store,data}),{status:503})
})
