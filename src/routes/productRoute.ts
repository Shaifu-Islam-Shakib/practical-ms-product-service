import express from 'express';
import * as productController from '../api/index.ts'
const router = express.Router()
router.route('/')
  .post(productController.createProduct)
  .get(productController.getAllProducts)
router.route('/:productId')
  .get(productController.getProductDetails)
  .patch(productController.updateProduct)
export default router