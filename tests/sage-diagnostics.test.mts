import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {checkGemini} from '../server/sage-diagnostics.mts'
import {providerFailure} from '../server/ai-provider-errors.mts'
const products=JSON.parse(fs.readFileSync(new URL('../server/data/catalogue.json',import.meta.url),'utf8'))
const success=(tools:boolean)=>({ok:true,json:async()=>({candidates:[{content:{role:'model',parts:tools?[{functionCall:{name:'respond_to_customer',args:{message:'How can I help you choose?',productIds:[]}}}]:[{text:'OK'}]}}]})})
test('private Gemini probe separates minimal text from full catalogue requests',async()=>{
 const calls:any[]=[]
 const report=await checkGemini({key:' fixture-secret ',model:' gemini-3.1-flash-lite ',products,fetch:async(url:any,init:any)=>{calls.push({url,init});return success(!!JSON.parse(init.body).tools)}})
 assert.equal(calls.length,2);assert.ok(report.checks.every((c:any)=>c.ok));assert.equal(calls[0].init.headers['x-goog-api-key'],'fixture-secret')
 assert.ok(!JSON.stringify(report).includes('fixture-secret'));assert.ok(!JSON.stringify(calls).includes('private-fixture'))
})
test('probe identifies overload only in the Sage function path',async()=>{
 const report=await checkGemini({key:'fixture-secret',model:'gemini-3.1-flash-lite',products,retryDelayMs:1,fetch:async(_url:any,init:any)=>JSON.parse(init.body).tools?{ok:false,status:503,json:async()=>({error:{status:'UNAVAILABLE',message:'High demand fixture-secret'}})}:success(false)})
 assert.equal(report.checks[0].ok,true);assert.equal(report.checks[1].ok,false);assert.equal(report.checks[1].reason,'overloaded');assert.ok(!JSON.stringify(report).includes('fixture-secret'))
})
test('provider diagnostics classify safe reasons and respect retry-after',async()=>{
 const err=await providerFailure({status:429,headers:{get:()=> '60'},json:async()=>({error:{message:'Quota exceeded secret-value'}})})
 assert.equal(err.providerReason,'quota_or_rate_limit');assert.equal(err.retryAfterMs,60000);assert.ok(!JSON.stringify(err).includes('secret-value'))
 const region=await providerFailure({status:400,json:async()=>({error:{message:'User location is not supported'}})})
 assert.equal(region.providerReason,'region_restricted')
})
