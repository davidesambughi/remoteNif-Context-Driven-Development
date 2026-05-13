import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { users } from '../lib/db/schema'

const sql = postgres('postgresql://postgres:PNvgPGzlWmFaG6XM@db.esnhbmyacfqzzpoctwcn.supabase.co:5432/postgres')
const db = drizzle(sql)

async function test() {
  try {
    const result = await db.select().from(users).limit(1)
    console.log('DB Connection Success:', result)
  } catch (err) {
    console.error('DB Connection Failed:', err)
  }
}

test()
