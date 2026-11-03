import http from 'node:http'
import { Readable } from 'node:stream'
import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { openDatabase, ROOT, STAGES } from './database.mts'
import { Store } from './store.mts'
import { ApiError } from './security.mts'
import { comparisonSchema,createComparison } from './comparison.mts'
import { validate, customerSchema, cartSchema, wishlistSchema, credentialsSchema, orderSchema, productPatchSchema, chatSchema } from './validation.mts'

async function body(req:any,limit=65000) {
  if(!String(req.headers['content-type']||'').startsWith('application/json'))throw new ApiError(415,'Send JSON data.')
  let size=0;const chunks=[]
  for await(const chunk of req){size+=chunk.length;if(size>limit)throw new ApiError(413,'This request is too large.');chunks.push(chunk)}
  try{return JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{throw new ApiError(400,'Invalid JSON request.')}
}
const mime:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.ttf':'font/ttf','.woff':'font/woff','.woff2':'font/woff2','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.bin':'application/octet-stream','.ktx2':'image/ktx2','.ico':'image/x-icon'}
function serveFile(req:any,res:any,file:string,contentType?:string) {
  const stat=fs.statSync(file)
  if(!stat.isFile())throw new ApiError(404,'Not found.')
  res.setHeader('Content-Type',contentType||mime[path.extname(file)]||'application/octet-stream')
  res.setHeader('Cache-Control',file.endsWith('.html')?'no-cache':'public, max-age=0, must-revalidate')
  res.setHeader('Accept-Ranges','bytes');res.setHeader('Last-Modified',stat.mtime.toUTCString())
  let start=0,end=stat.size-1
  if(req.headers.range){
    const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range)
    if(!match)throw new ApiError(416,'Unsupported range.')
    start=Number(match[1]);end=match[2]?Math.min(Number(match[2]),end):end
    if(start>end||start>=stat.size){res.setHeader('Content-Range',`bytes */${stat.size}`);throw new ApiError(416,'Invalid range.')}
    res.statusCode=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${stat.size}`)
  }
  res.setHeader('Content-Length',Math.max(0,end-start+1))
  if(req.method==='HEAD'){res.end();return}
  const stream=fs.createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res)
}
export function createApp(options:any={}) {
  const db=options.store?null:(options.db||openDatabase(options.databasePath)),store=options.store||new Store(db)
  const config={publicOrigin:process.env.PUBLIC_ORIGIN||'',secure:process.env.COOKIE_SECURE||'auto',allowDemo:process.env.ALLOW_DEMO_SEED!=='false',...options}
  // Explicitly pin the storefront origin; never trust forwarded host headers.
  if(String(config.publicOrigin).trim()){
    const origin=new URL(String(config.publicOrigin).trim())
    if(!['http:','https:'].includes(origin.protocol)||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash)throw Error('PUBLIC_ORIGIN must be the website origin only, such as https://example.trycloudflare.com')
    config.publicOrigin=origin.origin
  }else config.publicOrigin=''
  const cookie=(res:any,raw:string,secure:boolean)=>res.setHeader('Set-Cookie',`sf_session=${raw}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure?'; Secure':''}`)
  let activeComparisons=0
  const server=http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin')
    res.setHeader('Permissions-Policy','camera=(self), microphone=(), xr-spatial-tracking=(self)')
    try{
      const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`),route=url.pathname
      if(!route.startsWith('/api/')){
        if(!['GET','HEAD'].includes(req.method||''))throw new ApiError(405,'Method not allowed.')
        let decoded:string;try{decoded=decodeURIComponent(route)}catch{throw new ApiError(400,'Invalid URL.')}
        if(/^\/media\/[a-f0-9-]+\.(png|jpg|webp|glb)$/.test(decoded)){
          const entry=await store.media(path.basename(decoded))
          if(!entry)throw new ApiError(404,'Not found.')
          if(entry.url){
            // Keep assets same-origin so room-photo canvas exports stay untainted.
            const remote=await fetch(entry.url,{method:req.method==='HEAD'?'HEAD':'GET',headers:req.headers.range?{Range:String(req.headers.range)}:{},signal:AbortSignal.timeout(30000)})
            if(!remote.ok)throw new ApiError(remote.status===404?404:503,'Product media is temporarily unavailable.')
            res.statusCode=remote.status;res.setHeader('Content-Type',entry.mime);res.setHeader('Cache-Control','public, max-age=300')
            for(const name of ['content-length','content-range','accept-ranges'])if(remote.headers.get(name))res.setHeader(name,remote.headers.get(name)!)
            if(req.method==='HEAD'||!remote.body){res.end();return}
            const stream=Readable.fromWeb(remote.body as any);stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);return
          }
          return serveFile(req,res,entry.file,entry.mime)
        }
        if(decoded==='/')decoded='/index.html'
        const rootPage=/^\/[a-z-]+\.html$/.test(decoded)
        const asset=decoded.startsWith('/assets/')||decoded.startsWith('/wireframes/')
        if(!rootPage&&!asset)throw new ApiError(404,'Not found.')
        const file=path.resolve(ROOT,'.'+decoded),extension=path.extname(file)
        if(!file.startsWith(ROOT+path.sep)||!mime[extension]||!fs.existsSync(file))throw new ApiError(404,'Not found.')
        if(!fs.realpathSync(file).startsWith(ROOT+path.sep))throw new ApiError(404,'Not found.')
        return serveFile(req,res,file)
      }
      res.setHeader('Cache-Control','no-store')
      const send=(data:any,status=200)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(data))}
      if(route==='/api/health'&&req.method==='GET')return send({ok:true,storage:store.storage,mode:store.storage==='postgres'?'cloud-server':'local-server'})
      if(route==='/api/catalogue'&&req.method==='GET')return send({products:await store.products(true)})
      const raw=String(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('sf_session='))?.slice(11)
      await store.limit('api:'+(req.socket.remoteAddress||'unknown'),300,60000)
      let session=await store.session(raw)
      if(!session){session=await store.newSession(await store.createGuest());cookie(res,session.raw,config.secure==='true'||(config.secure==='auto'&&config.publicOrigin.startsWith('https:')))}
      const profile=session.profile,ip=req.socket.remoteAddress||'unknown'
      if(!['GET','HEAD'].includes(req.method||'')){
        const expectedOrigin=config.publicOrigin||`http://${req.headers.host}`
        if(req.headers.origin&&req.headers.origin!==expectedOrigin)throw new ApiError(403,'This request must come from the storefront.')
        if(req.headers['x-csrf-token']!==session.csrf)throw new ApiError(403,'Your session changed. Refresh this page and try again.')
      }
      if(route==='/api/bootstrap'&&req.method==='GET')return send({enabled:true,mode:store.storage==='postgres'?'cloud-server':'local-server',profile,csrf:session.csrf,products:await store.products(true),cart:await store.cart(profile.id),wishlist:await store.wishlist(profile.id),sageMode:process.env.SAGE_PROVIDER||'demo'})
      if(['/api/auth/register','/api/auth/login'].includes(route)&&req.method==='POST'){
        await store.limit('auth:'+ip,10,15*60000)
        const data=validate(credentialsSchema,await body(req)),account=route.endsWith('register')?await store.register(profile,data):await store.login(profile,data)
        const fresh=await store.newSession(account);cookie(res,fresh.raw,config.secure==='true'||(config.secure==='auto'&&config.publicOrigin.startsWith('https:')))
        return send({profile:account,csrf:fresh.csrf})
      }
      if(route==='/api/auth/logout'&&req.method==='POST'){
        if(raw)await store.logout(raw)
        const fresh=await store.newSession(await store.createGuest());cookie(res,fresh.raw,config.secure==='true'||(config.secure==='auto'&&config.publicOrigin.startsWith('https:')))
        return send({profile:fresh.profile,csrf:fresh.csrf})
      }
      if(route==='/api/cart'){
        if(req.method==='GET')return send({cart:await store.cart(profile.id)})
        if(req.method==='PUT')return send({cart:await store.saveCart(profile.id,validate(cartSchema,await body(req)))})
      }
      if(route==='/api/wishlist'){
        if(req.method==='GET')return send({wishlist:await store.wishlist(profile.id)})
        if(req.method==='PUT')return send({wishlist:await store.saveWishlist(profile.id,validate(wishlistSchema,await body(req)))})
      }
      if(route==='/api/bag/import'&&req.method==='POST'){
        const data=validate(z.object({cart:cartSchema,wishlist:wishlistSchema}),await body(req))
        return send(await store.importBag(profile,data))
      }
      const addressMatch=/^\/api\/account\/addresses(?:\/([\w-]{1,80})(\/default)?)?$/.exec(route)
      if(addressMatch){
        if(profile.role==='guest')throw new ApiError(401,'Sign in to manage your addresses.')
        const id=addressMatch[1]
        if(!id&&req.method==='GET')return send(await store.addressBook(profile.id))
        if((!id&&req.method==='POST')||(id&&!addressMatch[2]&&req.method==='PUT')){
          const data=validate(customerSchema.omit({note:true}).extend({label:z.string().trim().min(1).max(60),makeDefault:z.boolean().optional()}),await body(req))
          return send(await store.updateAddressBook(profile.id,id?'edit':'add',{...data,id}),id?200:201)
        }
        if(id&&addressMatch[2]&&req.method==='PATCH')return send(await store.updateAddressBook(profile.id,'default',{id}))
        if(id&&!addressMatch[2]&&req.method==='DELETE')return send(await store.updateAddressBook(profile.id,'delete',{id}))
      }
      if(route==='/api/account/delivery'){
        if(profile.role==='guest')throw new ApiError(401,'Sign in to manage your saved delivery details.')
        if(req.method==='GET')return send({details:await store.deliveryDetails(profile.id)})
        if(req.method==='PUT'){const details=validate(customerSchema.omit({note:true}),await body(req));await store.updateAddressBook(profile.id,'delivery',details);return send({details})}
        if(req.method==='DELETE'){await store.forgetDelivery(profile.id);return send({details:null})}
      }
      if(route==='/api/orders'){
        if(req.method==='GET')return send({orders:await store.orders(profile)})
        if(req.method==='POST'){if(profile.role==='guest')throw new ApiError(401,'Sign in before placing your order.');await store.limit('checkout:'+profile.id,10,60000);return send({order:await store.createOrder(profile,validate(orderSchema,await body(req)))},201)}
      }
      const orderMatch=/^\/api\/orders\/(SF-[\w-]+)$/.exec(route)
      if(orderMatch&&req.method==='GET')return send({order:await store.order(orderMatch[1],profile)})
      if(route==='/api/admin/orders/seed'&&req.method==='POST'){
        store.admin(profile);if(!config.allowDemo)throw new ApiError(403,'Sample data is disabled.')
        return send({orders:await store.seedDemo(profile)})
      }
      const stageMatch=/^\/api\/admin\/orders\/(SF-[\w-]+)\/stage$/.exec(route)
      if(stageMatch&&req.method==='PATCH'){
        store.admin(profile);const data=validate(z.object({status:z.enum(STAGES as any),expectedStatus:z.enum(STAGES as any)}),await body(req))
        return send({order:await store.updateStage(profile,stageMatch[1],data.status,data.expectedStatus)})
      }
      if(route==='/api/admin/products'&&req.method==='GET'){store.admin(profile);return send({products:await store.products(true)})}
      const productMatch=/^\/api\/admin\/products\/([a-z0-9-]+)$/.exec(route)
      if(productMatch&&req.method==='PATCH'){store.admin(profile);return send({product:await store.updateProduct(profile,productMatch[1],validate(productPatchSchema,await body(req)))})}
      if(route==='/api/admin/media'&&req.method==='POST'){
        store.admin(profile);await store.limit('uploads:'+profile.id,10,60000)
        const data=validate(z.object({filename:z.string().max(150),mime:z.enum(['image/png','image/jpeg','image/webp','model/gltf-binary']),base64:z.string().max(11200000)}),await body(req,12*1024*1024))
        if(!/^[a-zA-Z0-9+/]*={0,2}$/.test(data.base64))throw new ApiError(400,'Invalid file encoding.')
        const bytes=Buffer.from(data.base64,'base64'),ext=({'image/png':'png','image/jpeg':'jpg','image/webp':'webp','model/gltf-binary':'glb'} as any)[data.mime]
        const valid=data.mime==='image/png'?bytes.subarray(0,8).toString('hex')==='89504e470d0a1a0a':data.mime==='image/jpeg'?bytes.subarray(0,3).toString('hex')==='ffd8ff':data.mime==='image/webp'?bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP':bytes.subarray(0,4).toString()==='glTF'&&bytes.length>=20&&bytes.readUInt32LE(4)===2&&bytes.readUInt32LE(8)===bytes.length
        if(!valid||bytes.length>8*1024*1024||!bytes.length)throw new ApiError(400,'Use a valid PNG, JPEG, WebP or GLB file up to 8 MB.')
        const id=randomUUID()+'.'+ext
        const url=await store.saveMedia(id,data.mime,data.filename,profile.id,bytes)
        return send({url,mime:data.mime},201)
      }
      if(route==='/api/comparison'&&req.method==='POST'){
        await store.limit('comparison:'+profile.id,5,10*60000)
        await store.limit('comparison-ip:'+ip,60,10*60000)
        if(activeComparisons>=2)throw new ApiError(503,'AI comparison is busy. Try again shortly or use on-device comparison.')
        activeComparisons++
        try{const data=validate(comparisonSchema,await body(req,2900000));return send(await (options.comparisonHandler||createComparison())({store,data}))}
        finally{activeComparisons--}
      }
      if(route==='/api/sage'&&req.method==='POST'){
        await store.limit('sage:'+profile.id,12,60000)
        const data=validate(chatSchema,await body(req))
        if(!options.sageHandler)throw new ApiError(503,'Sage is being prepared. Please try again shortly.')
        return send(await options.sageHandler({store,profile,...data}))
      }
      throw new ApiError(404,'Not found.')
    }catch(error:any){
      if(res.headersSent){res.destroy();return}
      const status=error instanceof ApiError?error.status:500
      if(status===500&&!config.quiet)console.error('Server request failed:',error.name)
      res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify({error:status===500?'Something went wrong. Please try again.':error.message}))
    }
  })
  server.requestTimeout=30000;server.headersTimeout=15000
  return {server,store,db}
}
