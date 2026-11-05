import path from 'node:path'
import { createApp } from './http.mts'
import { ROOT } from './database.mts'
import { createSage } from './sage.mts'
import { checkGemini } from './sage-diagnostics.mts'
import { openPostgresStore } from './postgres-store.mts'
const databasePath=path.resolve(ROOT,process.env.DATABASE_PATH||'.data/sacred-form.sqlite')
const cloud=!!process.env.RENDER||process.env.DATABASE_PROVIDER==='postgres'
if(cloud&&!process.env.DATABASE_URL)throw Error('DATABASE_URL is required for cloud hosting; refusing temporary local storage.')
const publicOrigin=process.env.PUBLIC_ORIGIN?.trim()||process.env.RENDER_EXTERNAL_URL||''
if(cloud&&!publicOrigin.startsWith('https://'))throw Error('Cloud hosting requires the exact HTTPS PUBLIC_ORIGIN.')
const cloudStore=process.env.DATABASE_URL?await openPostgresStore(process.env.DATABASE_URL):null
const {server,db}=createApp({databasePath,...(cloudStore?{store:cloudStore}:{}),publicOrigin,sageHandler:createSage()})
const port=Number(process.env.PORT||8010),host=process.env.HOST||(cloud?'0.0.0.0':'127.0.0.1')
server.listen(port,host,()=>{console.log(`Padamya Dhamma backend ready · ${cloudStore?'PostgreSQL':'local SQLite'} · Sage ${process.env.SAGE_PROVIDER||'demo'}`);console.log('Storefront address: '+(publicOrigin||`http://${host}:${port}`))})
// Fire after startup so a diagnostic cannot hold up the Render health check.
if(process.env.GEMINI_DIAGNOSTICS==='true'){
  const diagnosticStore=cloudStore||new (await import('./store.mts')).Store(db)
  Promise.resolve(diagnosticStore.products(true)).then(products=>checkGemini({products})).then(report=>console.log('Gemini diagnostic: '+JSON.stringify(report))).catch(()=>console.warn('Gemini diagnostic: could not complete'))
}
function close(){server.close(async()=>{if(cloudStore)await cloudStore.close();else db.close();process.exit(0)});server.closeIdleConnections()}
process.on('SIGINT',close);process.on('SIGTERM',close)
