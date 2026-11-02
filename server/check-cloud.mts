import {openPostgresStore} from './postgres-store.mts'
if(!process.env.DATABASE_URL){console.error('Add DATABASE_URL to your private .env.cloud file first.');process.exit(1)}
let store
try{
  store=await openPostgresStore(process.env.DATABASE_URL)
  const products=await store.products(true)
  console.log(`Cloud database connected. Private schema ready. ${products.length} catalogue pieces available. No customer data was copied.`)
}catch(error:any){console.error('Cloud connection failed'+(error.code?' ('+error.code+')':'')+'. Check the Session pooler URL, database password and SSL certificate. Do not post your connection string.');process.exitCode=1}
finally{await store?.close()}
