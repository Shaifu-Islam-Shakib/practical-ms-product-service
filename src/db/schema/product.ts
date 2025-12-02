import { pgEnum, pgTable, varchar, text, timestamp, decimal, real, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';



export const status = pgEnum("product_status", ['draft', 'published', 'unlisted'])

export const product = pgTable('product', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name').notNull(),
  description: text("description"),
  sku: varchar('sku').unique().notNull(),
  status: status('status').notNull().default('published'),
  price: real('price').notNull().default(0),
  inventoryId: varchar('inventory_id').default(''),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})
