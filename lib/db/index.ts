import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '@/lib/env'
import * as schema from './schema'

const pool = postgres(env.DATABASE_URL)

export const db = drizzle(pool, { schema })

export type Database = typeof db
