import { createHash, randomBytes, timingSafeEqual, scrypt as scryptCallback } from 'node:crypto'
import { promisify } from 'node:util'
export class ApiError extends Error {
  status: number
  constructor(status: number,message: string) {super(message);this.status=status}
}
export const hash = (value: string) => createHash('sha256').update(value).digest('hex')
export const token = () => randomBytes(32).toString('base64url')
export const now = () => new Date().toISOString()
const scrypt=promisify(scryptCallback)
export async function passwordHash(password: string) {
  const salt=randomBytes(16).toString('hex'), key=await scrypt(password,salt,64) as Buffer
  return `${salt}:${key.toString('hex')}`
}
export async function passwordMatches(password: string,stored: string) {
  if(!stored || !/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(stored)) {await scrypt(password,'unavailable-account',64);return false}
  const [salt,value]=stored.split(':'), key=await scrypt(password,salt,64) as Buffer
  return timingSafeEqual(key,Buffer.from(value,'hex'))
}
export function rateLimit(db: any,bucket: string,max: number,windowMs: number) {
  const key=hash(bucket), at=Date.now(),row=db.prepare('SELECT * FROM limits WHERE bucket=?').get(key)
  if(!row || row.reset_at<=at) db.prepare('INSERT OR REPLACE INTO limits VALUES(?,1,?)').run(key,at+windowMs)
  else {
    if(row.count>=max) throw new ApiError(429,'Too many requests. Please wait a little and try again.')
    db.prepare('UPDATE limits SET count=count+1 WHERE bucket=?').run(key)
  }
  db.prepare('DELETE FROM limits WHERE reset_at<?').run(at-86400000)
}
