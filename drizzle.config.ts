import { defineConfig } from 'drizzle-kit';
import 'dotenv/config'

if (!process.env.DATABASE_URL) {
  throw new Error('Database url not found')
}
import { schema } from './src/db/schema/index.ts'
export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql', // This should be at root level
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});