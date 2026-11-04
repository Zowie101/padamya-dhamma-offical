const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const vm=require('node:vm')

test('a valid Sage reply renders without waiting for a catalogue refresh',async()=>{
  const source=fs.readFileSync('assets/js/sage.js','utf8')
  const start=source.indexOf('  async function send('),end=source.indexOf("  $('sageLauncher').onclick",start)
  assert.ok(start>=0&&end>start)
  const controls=new Map()
  const reply={mode:'ai',message:'Consider this compact piece.',products:[]}
  let refreshes=0
  const rendered=[]
  const context=vm.createContext({
    performance,
    store:{enabled:true,flush:async()=>{},request:async()=>reply,refreshCatalogue:async()=>{refreshes++;throw Error('Catalogue offline')}},
    $:id=>{if(!controls.has(id))controls.set(id,{value:'',remove(){},removeAttribute(){}});return controls.get(id)},
    language:()=> 'en',bubble(){},save(){},scroll(){},waitForReply:async()=>{},
    revealReply:async(text,response)=>{rendered.push({text,response});return {}},mode(){},
    node:()=>({}),
  })
  await vm.runInContext(`let messages=[],pending=false,disposed=false,open=true;${source.slice(start,end)};send('Help me choose')`,context)
  assert.equal(refreshes,0)
  assert.equal(rendered.length,1)
  assert.equal(rendered[0].response,reply)
  assert.equal(controls.get('sageSend').disabled,false)
  assert.equal(controls.get('sageTyping').hidden,true)
})
