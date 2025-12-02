import { Request, Response, NextFunction } from 'express'
import { isProductExist } from '../lib/utils.ts'
import * as productService from '../lib/index.ts'
const getProductDetails = async (req: Request, res: Response, next: NextFunction) => {
  const { productId } = req.params

  const product = await productService.getProductDetails(productId)
  res.status(product.code).json(product)
}
export default getProductDetails;