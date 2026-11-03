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
 return {events,classes,styles,frames,leaves,lights,observer,document,scene,setTop:value=>top=value,flush:()=>{for(const[id,fn]of frames){frames.delete(id);fn()}},ready:async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve()}}
}
test('tree starts after its asset is ready, then starts particles after the canopy reveal',async()=>{
 const state=boot();await state.ready();assert.ok(state.classes.has('is-ready'));assert.equal(state.classes.has('is-grown'),false)
 state.events['canopy:animationend']({animationName:'bodhi-canopy-open'});assert.ok(state.classes.has('is-grown'))
 assert.equal(state.leaves.items.length,9);assert.equal(state.lights.items.length,13)
})
test('decorative animation pauses outside the viewport and in hidden tabs; cleanup cancels pending work',async()=>{
 const state=boot();await state.ready();state.observer.callback([{isIntersecting:false}]);assert.ok(state.classes.has('is-paused'))
 state.observer.callback([{isIntersecting:true}]);assert.equal(state.classes.has('is-paused'),false)
 state.document.hidden=true;state.events['document:visibilitychange']();assert.ok(state.classes.has('is-paused'))
 state.events.pagehide({persisted:false});assert.equal(state.frames.size,0);assert.equal(state.observer.disconnected,true)
})
test('mobile particles are limited, reduced motion is static and scroll events coalesce into one frame',async()=>{
 const mobile=boot({small:true,reduced:true});await mobile.ready();assert.equal(mobile.leaves.items.length,5);assert.equal(mobile.lights.items.length,7);assert.ok(mobile.classes.has('is-grown'))
 mobile.setTop(-400);mobile.flush();assert.equal(mobile.styles['--bodhi-y'],'0px')
 const normal=boot();normal.flush();normal.setTop(-400);for(let i=0;i<20;i++)normal.events.scroll();assert.equal(normal.frames.size,1);normal.flush();assert.equal(normal.styles['--bodhi-y'],'32.5px')
})
