import {createSage} from './sage.mts'
import {providerFailure} from './ai-provider-errors.mts'

// Opt-in, startup-only probe: no public endpoint, no customer session, no chat history.
export async function checkGemini(options:any={}){
  const key=String(options.key||process.env.GEMINI_API_KEY||'').trim()
  const model=String(options.model||process.env.GEMINI_MODEL||'').trim()
  const fetcher=options.fetch||fetch
  const report:any={model,keyConfigured:!!key,checks:[]}
  if(!key||!model)return report
  let started=Date.now()
  try{
    const response=await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{
      method:'POST',headers:{'content-type':'application/json','x-goog-api-key':key},signal:AbortSignal.timeout(options.timeoutMs??20000),
      body:JSON.stringify({contents:[{role:'user',parts:[{text:'Reply only with OK.'}]}],generationConfig:{maxOutputTokens:64,...(/^gemini-3/.test(model)?{thinkingConfig:{thinkingLevel:'minimal'}}:{})}})
    })
    if(!response.ok)throw await providerFailure(response)
    const payload=await response.json()
    report.checks.push({request:'minimal_text',ok:!!payload.candidates?.[0]?.content?.parts?.some((p:any)=>typeof p.text==='string'&&p.text.trim()),milliseconds:Date.now()-started})
  }catch(error:any){
    report.checks.push({request:'minimal_text',ok:false,code:error.httpStatus?'HTTP_'+error.httpStatus:error.name==='TimeoutError'?'TIMEOUT':'NETWORK_ERROR',reason:error.providerReason||'unknown',milliseconds:Date.now()-started})
  }
  started=Date.now()
  const products=options.products||[]
  const store={products:()=>products,product:(id:string)=>products.find((p:any)=>p.id===id),cart:()=>[]}
  const result=await createSage({provider:'gemini',key,model,fetch:fetcher,timeoutMs:options.timeoutMs??20000,retryDelayMs:options.retryDelayMs??750})({store,profile:{id:'diagnostic-no-customer'},messages:[{role:'user',content:'Hello, help me choose a statue.'}],language:'en'})
  report.checks.push({request:'sage_catalogue_and_functions',ok:result.mode==='ai',code:result.aiError||'OK',reason:result.aiReason||undefined,milliseconds:Date.now()-started})
  return report
}
