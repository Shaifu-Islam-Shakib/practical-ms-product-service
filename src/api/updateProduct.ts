import { Request, Response, NextFunction } from 'express'
import { ProductUpdateDTOSchema, type ProductUpdateDTO } from '../zod/schemas.ts'
import { BadRequestError } from '../utils/error.ts'
import * as productService from '../lib/index.ts'

const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params
    if (!productId) throw new BadRequestError()

    const parsedBody = ProductUpdateDTOSchema.safeParse(req.body)
    if (!parsedBody.success) {
      return res.status(400).json({
        error: parsedBody.error.issues.map(issue => issue.message)
      })
    }

    // Create a properly typed update object
 /*   const updateFields: Partial<Pick<ProductUpdateDTO, 'name' | 'description' | 'price' | 'status'>> = {};

    const allowedUpdateFields = ['name', 'description', 'price', 'status'] as const;

    for (const key of allowedUpdateFields) {
      if (key in parsedBody.data && parsedBody.data[key] !== undefined) {
        updateFields[key] = parsedBody.data[key];
      }
    }*/

    const updatedData = await productService.updateProduct(parsedBody.data, productId)

    res.status(200).json({
      data: updatedData
    })
  } catch (err) {
    console.error('Error:', err);
    next(err)
  }
}

export default updateProduct