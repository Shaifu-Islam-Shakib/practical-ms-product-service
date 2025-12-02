import db from '../db/index.ts'
const getAllProducts = async () => {
  const products = await db.query.product.findMany()

  return products;
}
export default getAllProducts;