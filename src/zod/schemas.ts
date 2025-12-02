import { z } from 'zod';
import { status } from '../db/schema/index.ts';
import { schema } from '../db/schema/index.ts';

function drizzleEnumToZod<T extends readonly [string, ...string[]]>(drizzleEnum: { enumValues: T }) {
  if (drizzleEnum.enumValues.length === 0) {
    throw new Error('Enum values array cannot be empty');
  }
  return z.enum(drizzleEnum.enumValues);
}

type ProductInsert = typeof schema.product.$inferInsert;

export const ProductCreateDTOSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  price: z.number(),
  status: drizzleEnumToZod(status).default('published'), // Add default to match DB
  inventoryId: z.string().optional().default('') // Make optional to match DB schema
});

export const ProductUpdateDTOSchema = ProductCreateDTOSchema.omit({ sku: true,inventoryId:true }).partial()


export type ProductCreateDTO = z.infer<typeof ProductCreateDTOSchema>;
export type ProductUpdateDTO = z.infer<typeof ProductUpdateDTOSchema>;