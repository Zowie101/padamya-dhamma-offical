const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs')
const source=fs.readFileSync('assets/js/bodhi-banner.js','utf8')
function boot({small=false,reduced=false}={}){
 const events={},classes=new Set(),styles={},frames=new Map();let serial=0,observer,top=0
 const children=()=>({items:[],replaceChildren(){this.items=[]},append(node){this.items.push(node)}})
 const leaves=children(),lights=children(),canopy={decode:()=>Promise.resolve(),addEventListener:(name,fn)=>events['canopy:'+name]=fn}
 const scene={classList:{add:c=>classes.add(c),toggle:(c,on)=>on?classes.add(c):classes.delete(c)},style:{setProperty:(key,value)=>styles[key]=value},querySelector:s=>s==='.bodhi-leaves'?leaves:s==='.bodhi-fireflies'?lights:canopy,querySelectorAll:()=>[canopy],hidden:false}
 const hero={querySelector:()=>scene,offsetHeight:800,getBoundingClientRect:()=>({top})}
 const document={hidden:false,querySelector:()=>hero,createElement:()=>({style:{},className:'',innerHTML:''}),addEventListener:(name,fn)=>events['document:'+name]=fn}
 const window={SacredAccessibility:{reduceMotion:()=>reduced},addEventListener:(name,fn)=>events[name]=fn}
 const media={matches:reduced,addEventListener(){}},mobile={matches:small,addEventListener(){}}
 class Observer{constructor(fn){this.callback=fn;observer=this}observe(){}disconnect(){this.disconnected=true}}
 window.IntersectionObserver=Observer
 vm.runInNewContext(source,{document,window,matchMedia:query=>query.includes('max-width')?mobile:media,AbortController,IntersectionObserver:Observer,requestAnimationFrame:fn=>{const id=++serial;frames.set(id,fn);return id},cancelAnimationFrame:id=>frames.delete(id),Promise})
 return {events,classes,styles,frames,leaves,lights,observer,document,scene,setTop:value=>top=value,flush:(time=0)=>{const pending=[...frames.values()];frames.clear();for(const fn of pending)fn(time)},ready:async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve()}}
}
function grow(state,start=0){for(let time=start;time<=start+7700;time+=100)state.flush(time)}
test('connected growth starts after decoding, completes once, then reverses with scroll',async()=>{
 const state=boot();await state.ready();state.flush(0)
 assert.ok(state.classes.has('is-ready'));assert.equal(state.styles['--growth-time'],'0.000s')
 state.flush(100);assert.equal(state.styles['--growth-time'],'0.100s')
 grow(state,200);assert.ok(state.classes.has('is-grown'));assert.ok(state.classes.has('has-grown'));assert.equal(state.frames.size,0)
 state.setTop(-400);for(let i=0;i<20;i++)state.events.scroll();assert.equal(state.frames.size,1);state.flush(8000)
 assert.equal(state.styles['--growth-time'],'3.800s');assert.equal(state.styles['--bodhi-y'],'10px');assert.equal(state.classes.has('is-grown'),false)
 state.setTop(0);state.events.scroll();state.flush(8100);assert.equal(state.styles['--growth-time'],'7.600s')
 assert.equal(state.leaves.items.length,9);assert.equal(state.lights.items.length,13)
})
test('growth pauses offscreen and in hidden tabs without jumping on resume; cleanup cancels work',async()=>{
 const state=boot();await state.ready();state.flush(0);state.flush(100)
 state.observer.callback([{isIntersecting:false}]);state.flush(5000);assert.ok(state.classes.has('is-paused'));assert.equal(state.styles['--growth-time'],'0.100s');assert.equal(state.frames.size,0)
 state.observer.callback([{isIntersecting:true}]);state.flush(6000);state.flush(6100);assert.equal(state.styles['--growth-time'],'0.200s')
 state.document.hidden=true;state.events['document:visibilitychange']();state.flush(7000);assert.ok(state.classes.has('is-paused'));assert.equal(state.styles['--growth-time'],'0.200s')
 state.document.hidden=false;state.events['document:visibilitychange']();state.flush(9000);assert.equal(state.styles['--growth-time'],'0.200s')
 state.events.pagehide({persisted:false});assert.equal(state.frames.size,0);assert.equal(state.observer.disconnected,true)
})
test('mobile particles stay limited and reduced motion shows a static mature tree',async()=>{
 const mobile=boot({small:true,reduced:true});await mobile.ready();mobile.flush(0)
 assert.equal(mobile.leaves.items.length,5);assert.equal(mobile.lights.items.length,7);assert.ok(mobile.classes.has('is-grown'));assert.equal(mobile.frames.size,0)
 mobile.setTop(-400);mobile.events.scroll();assert.equal(mobile.frames.size,0);assert.equal(mobile.styles['--growth-time'],'7.600s');assert.equal(mobile.styles['--bodhi-y'],'0px')
})
