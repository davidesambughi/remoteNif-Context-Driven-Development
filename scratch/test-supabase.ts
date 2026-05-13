import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '../lib/supabase/server'

async function testSignUp() {
  const email = `test-${Math.random()}@example.com`
  const password = 'Password123!'
  const language = 'en'

  console.log('Testing signUp with:', email)

  // We need to mock cookies for createClient
  // But createClient in lib/supabase/server.ts calls await cookies()
  // This will fail in a script because there is no Request context.
  
  // Let's use the browser client instead for testing
}

// Actually, let's use the admin client to see if we can at least talk to Supabase
import { createAdminClient } from '../lib/supabase/admin'

async function testAdmin() {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('users').select('*').limit(1)
  if (error) {
    console.error('Admin Client Error:', error)
  } else {
    console.log('Admin Client Success:', data)
  }
}

testAdmin()
