import { Request, Response, NextFunction } from 'express'
import { ProductCreateDTOSchema } from '../zod/schemas.ts';
import * as productService from '../lib/index.ts'
import { isSkuExisted } from '../lib/utils.ts'
const createProduct = async (req: Request, res: Response, next: NextFunction) => {

  const parsedData = ProductCreateDTOSchema.safeParse({
    ...req.body
  })
  if (!parsedData.success) {
    return res.status(400).json({
      status: false,
      error: parsedData.error.issues.map(issue => ({
        error: issue.message
      }))
    })
  }

  const isSkuExist = await isSkuExisted(parsedData.data.sku)
  if (isSkuExist) {
    return res.status(400).json({ code: 400, message: 'product with that sku are exist' })
  }
  const product = await productService.createProduct(parsedData.data)
  res.status(200).json({
    status: 'success',
    data: product
  })
}
export default createProduct;