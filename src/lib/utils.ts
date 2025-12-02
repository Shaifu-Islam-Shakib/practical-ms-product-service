import db from '../db/index.ts';
export const isSkuExisted = async (sku: string) => {
  const isSkuExist = await db.query.product.findFirst({
    where: (product, { eq }) => eq(product.sku, sku)
  })
  return isSkuExist
}
export const isProductExist = async (productId:string) => {
  const isExist = await db.query.product.findFirst({
    where: (product, { eq }) => eq(product.id, productId)
  })
  return isExist
}
//export default isSkuExisted