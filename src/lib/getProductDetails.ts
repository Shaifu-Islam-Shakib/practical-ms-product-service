import { isProductExist } from './utils.ts';
import db from '../db/index.ts'
import axios from 'axios';
import { schema } from '../db/schema/index.ts'
import { eq } from 'drizzle-orm'
import { Inventory_url } from './config.ts'
const getProductDetails = async (productId: string) => {
  const isExist = await isProductExist(productId)
  if (!isExist) {
    return {
      mesage: 'product not found',
      code: 404
    };
  }
  if (isExist.inventoryId === '' || null) {
    // create inventory
    const { data: inventory } = await axios.post(`${Inventory_url}/inventories`, {
      productId: isExist.id,
      sku: isExist.sku
    })

    //update the product 
    await db.update(schema.product).set({
      inventoryId: inventory.id
    }).where(eq(schema.product.id, productId))
    return {
      code: 200,
      data: {
        ...isExist,
        inventoryId: inventory.id,
        stock: inventory.quantity || 0,
        stockStatus: inventory.quantity > 0 ? 'in stock' : 'out of stock'
      }
    }
  }
  //fetch inventory 
  const { data: inventory } = await axios.get(`${Inventory_url}/inventories/${isExist.inventoryId}/details`)
  return {
    code: 200,
    data: {
      ...isExist,
      stock: inventory.quantity || 0,
      stockStatus: inventory.quantity > 0 ? 'in stock' : 'out of stock'
    }
  }
};
export default getProductDetails;