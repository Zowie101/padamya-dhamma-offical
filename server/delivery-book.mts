import {randomUUID} from 'node:crypto'
import {ApiError} from './security.mts'
export function deliveryFields(value:any){const {name,phone,email,address,city,country}=value;return {name,phone,email,address,city,country}}
export function addressBook(value:any){
  if(value?.version===2&&Array.isArray(value.addresses))return structuredClone(value)
  return {version:2,defaultId:value?'primary':null,addresses:value?[{id:'primary',label:'Home',details:deliveryFields(value)}]:[]}
}
export function defaultDelivery(value:any){const book=addressBook(value);return book.addresses.find((item:any)=>item.id===book.defaultId)?.details||null}
export function changeAddress(value:any,action:string,data:any={}){
  const book=addressBook(value)
  if(action==='delivery'){
    const item=book.addresses.find((item:any)=>item.id===book.defaultId)
    if(item)item.details=deliveryFields(data)
    else{const id=randomUUID();book.addresses.push({id,label:'Home',details:deliveryFields(data)});book.defaultId=id}
    return book
  }
  if(action==='add'){
    if(book.addresses.length>=10)throw new ApiError(400,'You can save up to 10 delivery addresses.')
    const id=randomUUID();book.addresses.push({id,label:data.label,details:deliveryFields(data)})
    if(!book.defaultId||data.makeDefault)book.defaultId=id
    return book
  }
  const item=book.addresses.find((item:any)=>item.id===data.id)
  if(!item)throw new ApiError(404,'Address not found in your account.')
  if(action==='edit'){item.label=data.label;item.details=deliveryFields(data);if(data.makeDefault)book.defaultId=item.id}
  else if(action==='default')book.defaultId=item.id
  else if(action==='delete'){book.addresses=book.addresses.filter((entry:any)=>entry.id!==item.id);if(book.defaultId===item.id)book.defaultId=book.addresses[0]?.id||null}
  else throw new ApiError(400,'Choose a valid address action.')
  return book
}
