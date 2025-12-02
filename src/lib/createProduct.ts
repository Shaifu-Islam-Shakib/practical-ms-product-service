import db from '../db/index.ts';
import { schema } from '../db/schema/index.ts'
import { ProductCreateDTO } from '../zod/schemas.ts'
import { eq } from 'drizzle-orm'
import axios from 'axios'
import { Inventory_url } from './config.ts'
const createProduct = async (data: ProductCreateDTO) => {


  const { name, description, sku, price, status } = data



  //create product
  const [product] = await db.insert(schema.product).values({

    name: name,
    description: description,
    status: status as 'draft' | 'published' | 'unlisted',
    sku: sku,
    price: price
  }).returning()

  //create inventory

  const { data: inventory } = await axios.post(`${Inventory_url}/inventories`, {
    productId: product.id,
    sku: product.sku
  })
  //console.log(inventory);
  //const newInventoryId: string = 'shakifg'

  //update product with inventory id
  const response = await db.update(schema.product).set({ inventoryId: inventory.data.id }).where(eq(schema.product.id, product.id)).returning()
 // console.log(response);
  return response
}
export default createProduct;