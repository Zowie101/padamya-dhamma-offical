// Promote an existing verified-by-password site account using a private CLI.
// This never changes the customer's password or exposes an HTTP admin bootstrap.
import readline from 'node:readline/promises'
import {stdin,stdout} from 'node:process'
import {openPostgresStore} from './postgres-store.mts'
if(!process.env.DATABASE_URL)throw Error('Set DATABASE_URL in your private environment first.')
const prompt=readline.createInterface({input:stdin,output:stdout})
let store
try{
  store=await openPostgresStore(process.env.DATABASE_URL)
  const email=(await prompt.question('Email of your registered website account: ')).trim().toLowerCase()
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Enter a valid email address.')
  await store.promote(email)
  console.log('Administrator access granted. Sign in again on your deployed website.')
}catch(error:any){console.error(error.code?'Cloud administrator setup failed. Check the database connection.':error.message);process.exitCode=1}
finally{prompt.close();await store?.close()}
