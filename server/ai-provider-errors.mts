// Only fixed classifications leave this module; never return raw provider messages.
export async function providerFailure(response:any){
  let reason='unknown'
  try{
    const error=(await response.json())?.error
    const message=String(error?.message||'').toLowerCase()
    const status=String(error?.status||'')
    if(/location|region|country/.test(message))reason='region_restricted'
    else if(/high demand|overload|capacity/.test(message))reason='overloaded'
    else if(/quota|rate limit|too many requests/.test(message))reason='quota_or_rate_limit'
    else if(/credit|billing|payment/.test(message))reason='billing'
    else if(/api key|unauthenticated|invalid credential/.test(message)||status==='UNAUTHENTICATED')reason='authentication'
    else if(status==='NOT_FOUND')reason='invalid_model'
    else if(status==='INVALID_ARGUMENT')reason='invalid_request'
    else if(status==='UNAVAILABLE')reason='provider_unavailable'
  }catch{}
  const header=response.headers?.get?.('retry-after')
  const seconds=header===null||header===undefined?NaN:Number(header)
  const retryAfterMs=Number.isFinite(seconds)&&seconds>0?Math.min(seconds*1000,300000):undefined
  return Object.assign(new Error('Provider unavailable'),{httpStatus:response.status,providerReason:reason,retryAfterMs})
}
