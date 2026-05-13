import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { orders } from '../lib/db/schema'
import { eq } from 'drizzle-orm'

const sql = postgres('postgresql://postgres:PNvgPGzlWmFaG6XM@db.esnhbmyacfqzzpoctwcn.supabase.co:5432/postgres')
const db = drizzle(sql)

async function updateDelivered(orderId: string, nifNumber: string) {
  await db.update(orders).set({ 
    status: 'delivered',
    nifNumber: nifNumber,
    deliveredAt: new Date()
  }).where(eq(orders.id, orderId))
  console.log(`Updated order ${orderId} to delivered with NIF ${nifNumber}`)
}

const orderId = '4a62b26d-ce7d-4c47-a22c-ffd5dd738cb3'
updateDelivered(orderId, '234 567 890')
