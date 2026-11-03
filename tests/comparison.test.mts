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
