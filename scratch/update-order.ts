import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { orders } from '../lib/db/schema'
import { eq } from 'drizzle-orm'

const sql = postgres('postgresql://postgres:PNvgPGzlWmFaG6XM@db.esnhbmyacfqzzpoctwcn.supabase.co:5432/postgres')
const db = drizzle(sql)

async function updateStatus(orderId: string, status: any) {
  await db.update(orders).set({ status }).where(eq(orders.id, orderId))
  console.log(`Updated order ${orderId} to status ${status}`)
}

const orderId = '4a62b26d-ce7d-4c47-a22c-ffd5dd738cb3'

async function run() {
  // Test sequential statuses
  // await updateStatus(orderId, 'documents_under_review')
  // await updateStatus(orderId, 'documents_approved')
  // await updateStatus(orderId, 'submitted')
  // await updateStatus(orderId, 'delivered')
}

// I'll run them one by one and ask the subagent to refresh
updateStatus(orderId, process.argv[2])
