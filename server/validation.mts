import { z } from 'zod'
import { ApiError } from './security.mts'
export const cartSchema=z.array(z.object({id:z.string().min(1).max(80),qty:z.number().int().min(1).max(99)})).max(50)
export const wishlistSchema=z.array(z.string().min(1).max(80)).max(100)
export const customerSchema=z.object({name:z.string().trim().min(1).max(120),email:z.email().max(254).transform(value=>value.toLowerCase()),phone:z.string().trim().min(1).max(60),address:z.string().trim().min(1).max(1000),city:z.string().trim().min(1).max(120),country:z.string().trim().min(1).max(80),note:z.string().max(2000).optional().default('')})
export const orderSchema=z.object({customer:customerSchema,saveDelivery:z.boolean().optional(),cart:cartSchema.min(1),idempotencyKey:z.string().min(16).max(100)})
export const credentialsSchema=z.object({email:z.email().max(254).transform(value=>value.toLowerCase()),password:z.string().min(12).max(128),name:z.string().trim().max(120).optional().default('')})
export const productPatchSchema=z.object({price:z.number().int().min(0).max(1000000000).optional(),stock:z.number().int().min(0).max(100000).nullable().optional(),active:z.boolean().optional(),name:z.string().trim().min(1).max(160).regex(/^[^<>"'`]*$/).optional(),desc:z.string().trim().max(3000).regex(/^[^<>]*$/).optional(),material:z.string().trim().max(250).regex(/^[^<>]*$/).optional(),image:z.string().regex(/^\/?(?:assets\/|media\/)[\w/(). -]+\.(?:png|jpe?g|webp)$/i).optional()}).strict()
export const chatSchema=z.object({messages:z.array(z.object({role:z.enum(['user','assistant']),content:z.string().trim().min(1).max(2000)})).min(1).max(16),language:z.enum(['en','my']).default('en')})
export function validate(schema: any,input: unknown) {
  const result=schema.safeParse(input)
  if(!result.success) throw new ApiError(400,result.error.issues.map((issue:any)=>`${issue.path.join('.')||'request'}: ${issue.message}`).slice(0,3).join('; '))
  return result.data
}
