import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import core from '../assets/js/sage-core.js'
import {createSage} from '../server/sage.mts'
import {correctedProductName} from '../server/catalogue-names.mts'
const products=JSON.parse(fs.readFileSync(new URL('../server/data/catalogue.json',import.meta.url),'utf8'))
test('all six supplied assets have bilingual cultural notes and uncertain identifications stay qualified',()=>{
 for(const p of products){const context=core.product(p).culturalContext;assert.ok(context.en);assert.ok(context.my);assert.ok(context.observation);assert.ok(context.mudra)}
 assert.match(core.product(products.find((p:any)=>p.id==='earth-touching')).culturalContext.mudra,/unconfirmed/)
 assert.equal(core.product({...products[0],assetSet:'replacement'}).culturalContext,null)
})
test('old names resolve to renamed pieces without confusing the two Lotus products',()=>{
 for(const [input,id,name] of [['Earth Touching','earth-touching','Lotus Meditation'],['Gentle Blessing','gentle-blessing','Gentle Serenity'],['Lotus Stillness','lotus-stillness','Lotus Stillness']]){
 const reply=core.respond({products,messages:[{role:'user',content:'Explain '+input}]})
 assert.equal(reply.products.length,1);assert.equal(reply.products[0].id,id);assert.equal(reply.products[0].name,name);assert.ok(reply.message.length>100)
 }
 const burmese=core.respond({products,messages:[{role:'user',content:'Quiet Meditation'}],language:'my'})
 assert.match(burmese.message,/ရှင်/);assert.ok(!/ကျွန်တော်|ခင်ဗျာ/.test(burmese.message))
})
test('female respectful persona and qualified gesture notes reach OpenRouter on every turn',async()=>{
 const requests:any[]=[]
 const handler=createSage({provider:'openrouter',key:'fixture-key',model:'google/gemini-3.1-flash-lite',fetch:async(_url:any,init:any)=>{
 const body=JSON.parse(init.body);requests.push(body)
 return {ok:true,json:async()=>({choices:[{message:{role:'assistant',tool_calls:[{id:'reply',type:'function',function:{name:'respond_to_customer',arguments:JSON.stringify({message:'Happy to help!',productIds:[]})}}]}}]})}
 }})
 const store={products:()=>products,product:(id:string)=>products.find((p:any)=>p.id===id),cart:()=>[]}
 for(let i=0;i<2;i++)await handler({store,profile:{id:'fixture'},messages:[{role:'user',content:'Tell me about the mudra'}],language:'my'})
 for(const request of requests){const prompt=request.messages[0].content;assert.match(prompt,/female AI/);assert.match(prompt,/ကျွန်မ/);assert.match(prompt,/Never infer a mudra/);assert.match(prompt,/culturalContext/);assert.match(prompt,/no hand reaches toward the earth/i)}
})
test('rename changes only old default names for matching supplied assets',()=>{
 const legacy={id:'earth-touching',name:'Earth Touching',assetSet:'buddha_4',price:123,stock:4}
 assert.deepEqual(correctedProductName(legacy),{...legacy,name:'Lotus Meditation'})
 const custom={...legacy,name:'My custom statue'};assert.equal(correctedProductName(custom),custom)
 const replacement={...legacy,assetSet:'other'};assert.equal(correctedProductName(replacement),replacement)
})
