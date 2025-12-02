import express from 'express'
const router = express.Router()
import productRoute from './productRoute.ts'
router.use('/products', productRoute)
export default router