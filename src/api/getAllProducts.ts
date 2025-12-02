import { Request, Response, NextFunction } from 'express'
import * as productService from '../lib/index.ts'
const getAllProducts = async (req: Request, res:Response, next: NextFunction) => {
  try {
    const products = await productService.getAllProducts()

    if (!products) {
      return res.status(400).json({
        code: 400,
        status: 'failed',
        message: 'No products are available'
      })
    }
    res.status(200).json({
      code: 200,
      status: 'success',
      data: products
    })
  } catch (err) {
    console.error('Error:', err);
    next(err)
  }
}
export default getAllProducts