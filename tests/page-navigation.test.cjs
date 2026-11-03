const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs')
const source=fs.readFileSync('assets/js/page-navigation.js','utf8')
function setup(page,referrer='',last=null,blocked=false){
 const data=new Map(last?[['padamya:last-page',last]]:[]),window={},location=new URL(page)
 const sessionStorage={getItem:key=>{if(blocked)throw Error('Blocked');return data.get(key)},setItem:(key,value)=>{if(blocked)throw Error('Blocked');data.set(key,value)}}
 vm.runInNewContext(source,{window,document:{referrer},sessionStorage,location,URL,URLSearchParams})
 return {navigation:window.PadamyaNavigation,data}
}
test('Continue preserves the real previous product page including query and anchor',()=>{
 const state=setup('https://shop.test/account.html','https://shop.test/product.html?id=quiet-meditation#details','shop.html')
 assert.equal(state.navigation.accountReturn(),'product.html?id=quiet-meditation#details')
})
test('last storefront destination survives account login and reload without a role-based admin redirect',()=>{
 const state=setup('https://shop.test/account.html','https://shop.test/account.html','shrine.html?piece=one#shrine-preview')
 assert.equal(state.navigation.accountReturn(),'shrine.html?piece=one#shrine-preview')
 assert.equal(state.data.get('padamya:last-page'),'shrine.html?piece=one#shrine-preview')
})
test('explicit internal return is honored and visiting a storefront page records it',()=>{
 assert.equal(setup('https://shop.test/account.html?return=checkout.html').navigation.accountReturn(),'checkout.html')
 assert.equal(setup('https://shop.test/shop.html?category=gifts').data.get('padamya:last-page'),'shop.html?category=gifts')
})
test('external, executable, unknown and credential-bearing destinations are rejected',()=>{
 for(const destination of ['https://evil.test/shop.html','javascript:alert(1)','https://u:p@shop.test/shop.html','missing.html','https://shop.test/sub/shop.html','account.html']){
 const state=setup('https://shop.test/account.html?return='+encodeURIComponent(destination),'https://evil.test/shop.html','https://evil.test/product.html')
 assert.equal(state.navigation.accountReturn(),'shop.html')
 }
})
test('blocked session storage still allows a safe referrer and direct visits have a sensible fallback',()=>{
 assert.equal(setup('https://shop.test/account.html','https://shop.test/about.html',null,true).navigation.accountReturn(),'about.html')
 assert.equal(setup('https://shop.test/account.html').navigation.accountReturn(),'shop.html')
})
