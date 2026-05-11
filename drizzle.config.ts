import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// Drizzle Kit runs outside Next.js and doesn't load .env.local automatically
config({ path: '.env.local' })

export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
