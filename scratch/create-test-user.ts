import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createAdminClient } from '../lib/supabase/admin'

async function createTestUser() {
  const supabase = createAdminClient()
  const email = `test-${Math.random().toString(36).substring(7)}@example.com`
  const password = 'Password123!'

  console.log('Creating confirmed user:', email)

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { language: 'en' }
  })

  if (error) {
    console.error('Failed to create user:', error.message)
    return
  }

  console.log('User created successfully:', data.user.id)
  
  // Now let's try to add an order for this user to test the dashboard
  const { db } = await import('../lib/db')
  const { orders } = await import('../lib/db/schema')
  
  const [newOrder] = await db.insert(orders).values({
    userId: data.user.id,
    tier: 'standard',
    status: 'documents_pending'
  }).returning()

  console.log('Order created for user:', newOrder.id)
  console.log('Credentials: email:', email, 'password:', password)
}

createTestUser()
