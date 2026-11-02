import { ApiError } from './security.mts'
export function cloudStorage(env:any=process.env,fetcher:any=fetch){
  const bucket=env.SUPABASE_STORAGE_BUCKET||'product-media'
  const raw=env.SUPABASE_URL||'',key=env.SUPABASE_SERVICE_ROLE_KEY||''
  if(!raw||!key)return null
  const origin=new URL(raw)
  if(origin.protocol!=='https:'||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash)throw Error('Use the HTTPS Supabase project URL only.')
  if(!/^[a-z0-9-]{1,63}$/.test(bucket))throw Error('Invalid Supabase storage bucket name.')
  const base=origin.origin+'/storage/v1/object/',headers={apikey:key,authorization:'Bearer '+key}
  const objectPath=(id:string)=>encodeURIComponent(bucket)+'/'+encodeURIComponent(id)
  return {
    url:(id:string)=>base+'public/'+objectPath(id),
    async put(id:string,mime:string,bytes:Buffer){
      const response=await fetcher(base+objectPath(id),{method:'POST',headers:{...headers,'content-type':mime,'x-upsert':'false'},body:bytes,signal:AbortSignal.timeout(30000)})
      if(!response.ok)throw new ApiError(503,'Product upload could not be saved. Check the cloud storage bucket configuration.')
    },
    async remove(id:string){await fetcher(base+encodeURIComponent(bucket),{method:'DELETE',headers:{...headers,'content-type':'application/json'},body:JSON.stringify({prefixes:[id]}),signal:AbortSignal.timeout(15000)})}
  }
}
