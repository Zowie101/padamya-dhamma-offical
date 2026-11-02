const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const vm=require('node:vm')
const source=fs.readFileSync('assets/js/accessibility.js','utf8')
function boot(saved,os=false){
  const attributes=new Set(),handlers={},system={matches:os,addEventListener(type,fn){this.change=fn}}
  const styles={},root={dataset:{},style:{setProperty(name,value){styles[name]=value}},toggleAttribute(name,on){on?attributes.add(name):attributes.delete(name)}}
  const window={dispatchEvent(){},addEventListener(type,fn){handlers[type]=fn}}
  const context={window,document:{documentElement:root,readyState:'loading',addEventListener(){}},localStorage:{getItem(){return saved}},matchMedia(){return system},CustomEvent:class{},requestAnimationFrame(){return 1}}
  vm.runInNewContext(source,context)
  return {root,attributes,system,window,handlers,styles}
}
test('accessibility preferences survive navigation and combine with OS reduced motion',()=>{
  const a=boot(JSON.stringify({text:'larger',contrast:true,links:true,motion:true}))
  assert.equal(a.root.dataset.a11yText,'larger');assert.ok(a.attributes.has('data-a11y-contrast'));assert.ok(a.attributes.has('data-a11y-links'));assert.equal(a.window.SacredAccessibility.reduceMotion(),true)
  const b=boot(null,true);assert.equal(b.window.SacredAccessibility.reduceMotion(),true)
  b.system.matches=false;b.system.change();assert.equal(b.attributes.has('data-a11y-motion'),false)
})
test('corrupt or unsupported saved preferences cannot break storefront startup',()=>{
  for(const raw of ['{broken','null','[]','"text"',JSON.stringify({text:'4000px',contrast:'true',links:1,motion:'false'})]){
    const a=boot(raw);assert.equal(a.root.dataset.a11yText,'default');assert.equal(a.attributes.size,0);assert.equal(a.window.SacredAccessibility.reduceMotion(),false)
  }
})
test('cross-tab reset restores defaults while respecting the device preference',()=>{
  const a=boot(JSON.stringify({text:'large',contrast:true,motion:true}),true)
  a.handlers.storage({key:'sacredFormAccessibility_v1',newValue:null})
  assert.equal(a.root.dataset.a11yText,'default');assert.equal(a.attributes.has('data-a11y-contrast'),false);assert.equal(a.attributes.has('data-a11y-motion'),true)
})
test('continuous text-size values persist safely and legacy presets still work',()=>{
  for(const percent of [100,107,115,123,130]){
    const a=boot(JSON.stringify({text:percent}))
    assert.equal(a.styles['--sf-text-scale'],String(percent/100))
    assert.equal(a.root.dataset.a11yText,percent===100?'default':String(percent))
  }
  for(const value of [99,131,Infinity,115.5,'123'])assert.equal(boot(JSON.stringify({text:value})).root.dataset.a11yText,'default')
  assert.equal(boot(JSON.stringify({text:'large'})).styles['--sf-text-scale'],'1.15')
})
