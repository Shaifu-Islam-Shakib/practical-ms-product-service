import { schema } from '../db/schema/index.ts';
import { ProductUpdateDTO } from '../zod/schemas.ts'
import {eq} from 'drizzle-orm'
import { isProductExist } from './utils.ts'
import db from '../db/index.ts'
import { BadRequestError, NotFoundError } from '../utils/error.ts'
const updateProduct = async (data: ProductUpdateDTO, productId: string) => {

  const isExist = await isProductExist(productId)
  if (!isExist) throw new NotFoundError('Product is not found')
  const [updatedData] = await db.update(schema.product).set({...data,updatedAt:new Date()}).where(eq(schema.product.id,productId)).returning()
  return updatedData
}
export default updateProduct