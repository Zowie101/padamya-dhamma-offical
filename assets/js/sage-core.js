/* Shared catalogue rules. This mode is explicitly labelled, never presented as AI. */
;(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.SageCore=factory()})(typeof window==='undefined'?globalThis:window,function(){
  const pages={shop:'shop.html',cart:'cart.html',checkout:'checkout.html',tracking:'track-order.html',shrine:'shrine.html#shrine-preview',wishlist:'wishlist.html'}
  const number=value=>String(value).replace(/[၀-၉]/g,ch=>String(ch.charCodeAt(0)-0x1040))
  function product(p,reason='') {return {id:p.id,name:p.name,price:p.price,currency:'MMK',category:p.category,material:p.material,height:p.height,colors:p.colors||p.material.toLowerCase().match(/gold|bronze|ivory|orange|black/g)||[],stock:Number.isInteger(p.stock)?p.stock:null,active:p.active!==false,image:p.previewImage||p.image,description:p.desc,reason}}
  function search(products,options={}) {
    let rows=products.filter(p=>p.active!==false&&p.stock!==0)
    if(Number.isFinite(options.maxPriceMMK))rows=rows.filter(p=>p.price<=options.maxPriceMMK)
    if(Number.isFinite(options.maxHeightCm))rows=rows.filter(p=>parseFloat(p.height)<=options.maxHeightCm)
    if(options.category)rows=rows.filter(p=>p.category.toLowerCase().includes(options.category.toLowerCase()))
    if(options.color)rows=rows.filter(p=>(p.material+' '+(p.colors||[]).join(' ')).toLowerCase().includes(options.color.toLowerCase()))
    if(options.query){const words=options.query.toLowerCase().split(/\s+/).filter(Boolean);rows=rows.filter(p=>words.every(word=>(p.name+' '+p.material+' '+p.category+' '+p.desc).toLowerCase().includes(word)))}
    return rows.sort((a,b)=>options.sort==='height'?parseFloat(a.height)-parseFloat(b.height):a.price-b.price).slice(0,6).map(p=>product(p))
  }
  function cartSummary(products,cart) {
    const items=[]
    for(const line of cart||[]){const p=products.find(p=>p.id===line.id);if(p&&Number.isInteger(line.qty)&&line.qty>0&&line.qty<=99)items.push({...product(p),qty:line.qty})}
    return {items,total:items.reduce((n,p)=>n+p.price*p.qty,0),currency:'MMK'}
  }
  function respond({products,messages,cart=[],language='en'}) {
    const last=number(messages.at(-1)?.content||'').toLowerCase(),history=messages.slice(-6).map(m=>number(m.content||'').toLowerCase()).join(' ')
    const response={mode:'guided',message:'',products:[],actions:[]}
    const action=(page,label)=>({page,label,href:pages[page]})
    const pick=(en,my)=>language==='my'?my:en
    if(/\$|\busd\b|dollars?|ဒေါ်လာ/.test(last)){
      response.message=pick('Our catalogue prices are in MMK. What budget would you like to use in MMK? I won’t assume an exchange rate.','ဈေးနှုန်းများကို ကျပ်ဖြင့် ဖော်ပြထားပါသည်။ သင်၏ဘတ်ဂျက်ကို ကျပ်ဖြင့် ပြောပြပေးပါ။');return response
    }
    if(/track|order|delivery|အော်ဒါ/.test(last)){
      response.message=pick('Open My order history to see orders from this account or browser session. Sign in to the same account on another device. I cannot look up or disclose another customer’s orders.','မိမိအကောင့် သို့မဟုတ် ယခုဘရောက်ဇာမှ အော်ဒါများကို အော်ဒါမှတ်တမ်းတွင် ကြည့်နိုင်ပါသည်။ အခြားဖောက်သည်၏ အချက်အလက်များကို မဖော်ပြပါ။')
      response.actions=[action('tracking','Track my order')];return response
    }
    if(/\bcart\b|\bbag\b|checkout|ခြင်း/.test(last)){
      response.cart=cartSummary(products,cart);response.message=response.cart.items.length?pick('Here is your bag, calculated from the current catalogue. Delivery charges are confirmed separately.','သင်၏ခြင်းထဲရှိ ပစ္စည်းများနှင့် ကျပ်ဖြင့် စုစုပေါင်းကို ဖော်ပြထားပါသည်။ ပို့ဆောင်ခကို သီးခြား အတည်ပြုပါမည်။'):pick('Your bag is empty. Tell me your budget or where you will place your piece.','သင်၏ခြင်းမှာ လွတ်နေပါသည်။ ဘတ်ဂျက် သို့မဟုတ် ထားရှိမည့်နေရာကို ပြောပြပေးပါ။')
      response.actions=[action('cart','View bag'),...(response.cart.items.length?[action('checkout','Go to checkout')]:[])];return response
    }
    const mentioned=products.filter(p=>last.includes(p.name.toLowerCase())||last.includes(p.id)||new RegExp('\\b'+p.name.toLowerCase().split(' ')[0]+'\\b').test(last))
    const comparing=/compar|difference|versus|\bvs\b|နှိုင်းယှဉ်/.test(last)||(/compar|difference|နှိုင်းယှဉ်/.test(history)&&mentioned.length>=2)
    if(comparing){
      if(mentioned.length<2){response.message=pick('Which two pieces would you like to compare? Tell me their names, such as Golden Presence and Quiet Meditation.','မည်သည့် ရုပ်ပွားတော်နှစ်ဆူကို နှိုင်းယှဉ်လိုပါသနည်း။ အမည်နှစ်ခုကို ပြောပြပေးပါ။');response.products=search(products,{}).slice(0,3);return response}
      response.message=pick('Here are their listed differences. Measure your available space before choosing; photos cannot confirm a physical fit.','စာရင်းပါ ဈေးနှုန်း၊ အမြင့်နှင့် ပစ္စည်းအမျိုးအစားကို နှိုင်းယှဉ်ပြထားပါသည်။ မရွေးချယ်မီ ထားရှိမည့်နေရာကို တိုင်းတာပါ။')
      response.comparison=mentioned.slice(0,4).map(p=>product(p));response.products=response.comparison;return response
    }
    let budget
    const budgetPattern=/(?:under|below|budget|up to|maximum|less than|within|ကျပ်)\s*(?:mmk\s*)?([\d,]+(?:\.\d+)?)\s*(k|thousand|သိန်း)?/i
    const match=budgetPattern.exec(last)||(/budget|gift|ဘတ်ဂျက်/.test(history)?/^\s*([\d,]+(?:\.\d+)?)\s*(k|thousand|သိန်း)?(?:\s*(?:mmk|ကျပ်))?\s*$/.exec(last):null)
    if(match)budget=Number(match[1].replace(/,/g,''))*(match[2]==='သိန်း'?100000:match[2]?1000:1)
    if(budget===undefined&&/budget|under|below|ဘတ်ဂျက်/.test(last)){
      response.message=pick('What is your maximum budget in MMK? For example, “under 50,000 MMK”.','သင်၏ အများဆုံးဘတ်ဂျက်ကို ကျပ်ဖြင့် ပြောပြပေးပါ။ ဥပမာ — ၅၀,၀၀၀ ကျပ်အောက်။');return response
    }
    const options={maxPriceMMK:budget}
    if(/small|compact|corner|shelf|bedside|သေး|တရားထိုင်/.test(last))options.maxHeightCm=20
    if(/gold|ရွှေ/.test(last))options.color='gold'
    if(/ivory|white|ဖြူ/.test(last))options.color='ivory'
    if(/gift|parents|လက်ဆောင်/.test(last))options.category='Meaningful Gifts'
    if(/living room|home shrine|altar/.test(last)&&!options.maxHeightCm)options.category='Home Shrine'
    if(mentioned.length===1&&!Object.values(options).some(v=>v!==undefined)){
      response.products=mentioned.map(p=>product(p,`Listed material: ${p.material}.`));response.message=pick('Here are the current catalogue details for this piece.','ဤရုပ်ပွားတော်၏ လက်ရှိစာရင်းပါ အချက်အလက်များကို ဖော်ပြထားပါသည်။');return response
    }
    const useful=Object.values(options).some(v=>v!==undefined)||/statue|buddha|show|recommend|living|room|meditation|ရုပ်ပွား/.test(last)
    if(!useful){response.message=pick('I’m Sage. Tell me your budget in MMK, the space you have, or two pieces you want to compare.','ကျွန်ုပ်က Sage ပါ။ ဘတ်ဂျက်၊ ထားရှိမည့်နေရာ သို့မဟုတ် နှိုင်းယှဉ်လိုသည့် ရုပ်ပွားတော်နှစ်ဆူကို ပြောပြပေးပါ။');return response}
    response.products=search(products,options).slice(0,3).map(p=>({...p,reason:options.maxHeightCm?`Listed height: ${p.height}; check your shelf clearance.`:options.category?`From the ${p.category} collection.`:options.color?`Listed finish: ${p.material}.`:'Matches your catalogue budget filter.'}))
    response.message=response.products.length?pick('These pieces match your preferences in the current catalogue. Stock is shown only when it has been recorded.','လက်ရှိစာရင်းမှ သင်၏ရွေးချယ်မှုနှင့် ကိုက်ညီသော ရုပ်ပွားတော်များကို ဖော်ပြထားပါသည်။ လက်ကျန်အရေအတွက်ကို မှတ်တမ်းရှိမှသာ ဖော်ပြပါမည်။'):pick('No pieces match those filters. Would you like to increase the budget or consider another size or finish?','ယခုရွေးချယ်မှုနှင့် ကိုက်ညီသော ပစ္စည်း မရှိသေးပါ။ ဘတ်ဂျက်၊ အရွယ်အစား သို့မဟုတ် အရောင်ကို ပြောင်းလိုပါသလား။')
    if(/gift|parents|လက်ဆောင်/.test(last)&&budget===undefined)response.message+=' '+pick('What budget do you have for the gift?','လက်ဆောင်အတွက် ဘတ်ဂျက်မည်မျှရှိပါသနည်း။')
    if(/room|living|space/.test(last))response.actions=[action('shrine','Explore shrine sizes')]
    return response
  }
  return {respond,search,product,cartSummary,pages}
})
