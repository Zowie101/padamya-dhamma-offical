import readline from 'node:readline/promises'
import {stdin,stdout} from 'node:process'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { openDatabase, ROOT } from './database.mts'
import { now,passwordHash } from './security.mts'
import { credentialsSchema,validate } from './validation.mts'
const prompt=readline.createInterface({input:stdin,output:stdout})
const db=openDatabase(path.resolve(ROOT,process.env.DATABASE_PATH||'.data/sacred-form.sqlite'))
try{
  console.log('Create or update a local administrator. Password input is visible in this terminal; use a private terminal.')
  const email=await prompt.question('Admin email: '),password=await prompt.question('Password (12+ characters): ')
  const data=validate(credentialsSchema,{email,password,name:'Store administrator'})
  const old=db.prepare('SELECT id FROM profiles WHERE email=?').get(data.email)
  const hashed=await passwordHash(data.password)
  if(old){db.prepare("UPDATE profiles SET password=?,role='admin' WHERE id=?").run(hashed,old.id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(old.id)}
  else db.prepare('INSERT INTO profiles VALUES(?,?,?,?,?,?)').run(randomUUID(),data.email,hashed,data.name,'admin',now())
  console.log('Administrator saved. Sign in at /account.html?return=admin.html. No email was sent.')
}catch(error:any){console.error(error.message);process.exitCode=1}
finally{prompt.close();db.close()}
