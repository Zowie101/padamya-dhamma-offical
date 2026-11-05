const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('home hero uses requested Burmese phrase and restores English without changing other headings',async()=>{
 const events={},root={},nodes=['Make room for','stillness.','stillness.'].map((data,i)=>({data,parentElement:{tagName:i===1?'EM':'H1',closest:selector=>selector==='.home-hero-copy h1'&&i<2?{}:null}}));
 const body={querySelectorAll:()=>[]};
 const document={documentElement:root,body,currentScript:{src:'https://fixture.invalid/assets/js/language.js'},addEventListener:(name,fn)=>events[name]=fn,querySelector:()=>null,createTreeWalker:()=>{let i=0;return {nextNode(){this.currentNode=nodes[i++];return !!this.currentNode}}}};
 const window={addEventListener(){},dispatchEvent(){}};
 vm.runInNewContext(fs.readFileSync('assets/js/language.js','utf8'),{window,document,localStorage:{getItem:()=> 'en',setItem(){}},navigator:{language:'en'},NodeFilter:{SHOW_TEXT:4},MutationObserver:class{disconnect(){}observe(){}},URL,fetch:async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync('assets/locales/my.json','utf8'))}),CustomEvent:class{},requestAnimationFrame:fn=>fn()});
 await events.DOMContentLoaded();
 for(let i=0;i<3;i++){
 window.SacredFormLanguage.setLanguage('my');assert.equal(nodes[0].data,'ငြိမ်းချမ်းရာနေရာတစ်ခု');assert.equal(nodes[1].data,'ဖန်တီးပါ။');assert.equal(nodes[0].data+nodes[1].data,'ငြိမ်းချမ်းရာနေရာတစ်ခုဖန်တီးပါ။');assert.equal(nodes[2].data,'နေရာတစ်ခု။');
 window.SacredFormLanguage.setLanguage('en');assert.equal(nodes[0].data,'Make room for');assert.equal(nodes[1].data,'stillness.');
 }
});
