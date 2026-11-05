import {CATALOGUE_NAMES_VERSION,correctedProductName} from './catalogue-names.mts'
import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const STAGES = ['placed','confirmed','packed','out-for-delivery','delivered']
export function openDatabase(filename = path.join(ROOT,'.data/sacred-form.sqlite')) {
  if (filename !== ':memory:') fs.mkdirSync(path.dirname(filename),{recursive:true})
  const db = new DatabaseSync(filename)
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS profiles(id TEXT PRIMARY KEY,email TEXT UNIQUE COLLATE NOCASE,password TEXT,name TEXT NOT NULL DEFAULT '',role TEXT NOT NULL CHECK(role IN('guest','customer','admin')),created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES profiles(id),csrf TEXT NOT NULL,expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS products(id TEXT PRIMARY KEY,data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS saved_delivery(user_id TEXT PRIMARY KEY REFERENCES profiles(id),data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS carts(user_id TEXT PRIMARY KEY REFERENCES profiles(id),data TEXT NOT NULL DEFAULT '[]');
    CREATE TABLE IF NOT EXISTS wishlists(user_id TEXT PRIMARY KEY REFERENCES profiles(id),data TEXT NOT NULL DEFAULT '[]');
    CREATE TABLE IF NOT EXISTS orders(ref TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES profiles(id),data TEXT NOT NULL,idempotency_key TEXT NOT NULL,request_hash TEXT NOT NULL,UNIQUE(user_id,idempotency_key));
    CREATE TABLE IF NOT EXISTS limits(bucket TEXT PRIMARY KEY,count INTEGER NOT NULL,reset_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS media(id TEXT PRIMARY KEY,mime TEXT NOT NULL,filename TEXT NOT NULL,owner_id TEXT NOT NULL REFERENCES profiles(id),created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL);
    INSERT OR IGNORE INTO schema_migrations VALUES(1,datetime('now'));`)
  const seed = JSON.parse(fs.readFileSync(path.join(ROOT,'server/data/catalogue.json'),'utf8'))
  const insert = db.prepare('INSERT OR IGNORE INTO products VALUES(?,?)')
  for (const product of seed) insert.run(product.id,JSON.stringify(product))
  transaction(db,()=>{
    if(db.prepare('SELECT 1 FROM schema_migrations WHERE version=?').get(CATALOGUE_NAMES_VERSION))return
    for(const row of db.prepare('SELECT id,data FROM products').all()){
      const current=JSON.parse(String(row.data)),updated=correctedProductName(current)
      if(updated!==current)db.prepare('UPDATE products SET data=? WHERE id=?').run(JSON.stringify(updated),String(row.id))
    }
    db.prepare("INSERT INTO schema_migrations VALUES(?,datetime('now'))").run(CATALOGUE_NAMES_VERSION)
  })
  return db
}
export function transaction(db: DatabaseSync, callback: () => any) {
  db.exec('BEGIN IMMEDIATE')
  try { const result=callback();db.exec('COMMIT');return result }
  catch(error) { db.exec('ROLLBACK');throw error }
}
