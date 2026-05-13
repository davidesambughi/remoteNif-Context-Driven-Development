import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '@/lib/env'
import * as schema from './schema'

// Singleton pattern prevents hot reloads in dev from spawning a new pool on every module
// re-evaluation, which exhausts Supabase's connection limit quickly.
const globalForDb = globalThis as unknown as { pool: ReturnType<typeof postgres> }
const pool = globalForDb.pool ?? postgres(env.DATABASE_URL, { max: 1 })
if (process.env.NODE_ENV !== 'production') globalForDb.pool = pool

export const db = drizzle(pool, { schema })

export type Database = typeof db
